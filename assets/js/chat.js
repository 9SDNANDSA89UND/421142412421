/* ============================================================
   TamedBlox Chat System — FINAL DELETE-ENABLED FRONTEND
   ✔ Instant send
   ✔ SSE live updates
   ✔ Duplicate prevention
   ✔ Admin hard delete support
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;

// ⭐ Tracks local message timestamp to prevent SSE duplicates
let LAST_SENT_TIMESTAMP = null;

/* ============================================================
   SSE STREAM HANDLER
============================================================ */
let evtSrc = null;

function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      // ⭐ Hard deleted ticket
      if (msg.deleted === true) {
        alert("This ticket has been deleted.");
        qs("chatWindow").classList.add("hidden");

        // Disable input
        qs("chatInput").disabled = true;
        qs("chatSend").disabled = true;

        return;
      }

      // Normal message
      appendMessage(msg);

    } catch (err) {
      console.warn("SSE parse error:", err);
    }
  };
}

/* ============================================================
   HELPERS
============================================================ */
function qs(id) {
  return document.getElementById(id);
}

/* ============================================================
   BUBBLE STYLING LOGIC
============================================================ */
function isMine(m) {
  if (IS_ADMIN && m.sender === "admin") return true;
  if (!IS_ADMIN && m.sender === CURRENT_CHAT.userEmail) return true;
  return false;
}

function createMsgHTML(m) {
  if (m.system) {
    return `
      <div class="msg them" style="opacity:0.6;">
        ${m.content}
        <br><small>${new Date(m.timestamp).toLocaleTimeString()}</small>
      </div>
    `;
  }

  return `
    <div class="msg ${isMine(m) ? "me" : "them"}">
      ${m.content}
      <br><small>${new Date(m.timestamp).toLocaleTimeString()}</small>
    </div>
  `;
}

/* ============================================================
   SAFE APPEND (NO DUPLICATES)
============================================================ */
function appendMessage(msg) {
  // Duplicate filter (SSE echo of our instant message)
  if (msg.timestamp === LAST_SENT_TIMESTAMP) return;

  const box = qs("chatMessages");
  if (!box) return;

  box.innerHTML += createMsgHTML(msg);
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD MESSAGES
============================================================ */
async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();

  const box = qs("chatMessages");
  box.innerHTML = msgs.map(createMsgHTML).join("");
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD CHAT (LOGGED-IN USER)
============================================================ */
async function loadChatForUser(token) {
  const me = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!me.ok) return false;

  const user = await me.json();
  IS_ADMIN = !!user.admin;

  if (IS_ADMIN) {
    enableAdminUI();
    return loadAdminChats(token);
  }

  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat || !chat._id) return false;

  CURRENT_CHAT = {
    _id: chat._id,
    userEmail: user.email
  };

  renderOrderSummary(chat);
  await loadMessages(chat._id);
  showChatWindow();

  startSSE(chat._id);
  return true;
}

/* ============================================================
   LOAD STRIPE CHAT (ANONYMOUS)
============================================================ */
async function loadChatById(chatId) {
  try {
    const res = await fetch(`${API}/chats/by-id/${chatId}`);
    const chat = await res.json();

    if (!chat || !chat._id) return false;

    CURRENT_CHAT = {
      _id: chat._id,
      userEmail: "anonymous"
    };

    renderOrderSummary(chat);
    await loadMessages(chat._id);
    showChatWindow();

    startSSE(chat._id);
    return true;

  } catch (err) {
    console.error("loadChatById error:", err);
    return false;
  }
}

/* ============================================================
   ADMIN MODE: LOAD ACTIVE CHATS
============================================================ */
async function loadAdminChats(token) {
  const res = await fetch(`${API}/chats/all`, {
    headers: { Authorization: "Bearer " + token }
  });

  const list = await res.json();
  const wrap = qs("adminChatList");
  wrap.innerHTML = "";

  if (!Array.isArray(list)) return;

  list.forEach((chat) => {
    wrap.innerHTML += `
      <div class="admin-chat-item" onclick="openAdminChat('${chat._id}')">
        <strong>${chat.orderDetails?.orderId || "Unknown Order"}</strong><br>
        ${chat.participants?.[0] || "Unknown User"}
      </div>
    `;
  });
}

async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API}/chats/by-id/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat) {
    alert("This chat was deleted.");
    return;
  }

  CURRENT_CHAT = {
    _id: chatId,
    userEmail: "admin"
  };

  renderOrderSummary(chat);
  await loadMessages(chatId);
  showChatWindow();

  startSSE(chatId);
}

/* ============================================================
   ORDER SUMMARY RENDER
============================================================ */
function renderOrderSummary(chat) {
  const o = chat.orderDetails;
  const box = qs("chatOrderSummary");

  if (!o) {
    box.innerHTML = `<strong>No linked order.</strong>`;
    return;
  }

  box.innerHTML = `
    <strong>Order:</strong> ${o.orderId}<br>
    <strong>Total:</strong> $${o.total} USD<br>
    <strong>Items:</strong><br>
    ${o.items.map(i => `${i.qty}× ${i.name}`).join("<br>")}
  `;
}

/* ============================================================
   HARD DELETE TICKET (ADMIN)
============================================================ */
async function closeTicket() {
  if (!CURRENT_CHAT) return;

  const token = localStorage.getItem("authToken");
  if (!IS_ADMIN) return alert("Only admins can delete tickets.");

  await fetch(`${API}/chats/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ chatId: CURRENT_CHAT._id })
  });

  // Remove from admin list instantly
  document.querySelector(
    `.admin-chat-item[onclick="openAdminChat('${CURRENT_CHAT._id}')"]`
  )?.remove();

  // Close chat UI
  qs("chatWindow").classList.add("hidden");
}

/* ============================================================
   SEND MESSAGE — INSTANT + DUPLICATE SAFE
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  const msg = input.value.trim();
  if (!msg || !CURRENT_CHAT) return;

  input.value = "";

  const timestamp = new Date().toISOString();

  const localMessage = {
    sender: IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail,
    content: msg,
    timestamp
  };

  LAST_SENT_TIMESTAMP = timestamp;
  appendMessage(localMessage);

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json" };

  if (IS_ADMIN) headers.Authorization = "Bearer " + token;
  else if (token) headers.Authorization = "Bearer " + token;
  else headers["x-purchase-verified"] = "true";

  fetch(`${API}/chats/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId: CURRENT_CHAT._id,
      content: msg
    })
  });
}

/* ============================================================
   UI BINDING + INIT
============================================================ */
function enableAdminUI() {
  qs("adminChatPanel").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");

  // Add delete button once
  if (!qs("closeTicketBtn")) {
    const btn = document.createElement("button");
    btn.id = "closeTicketBtn";
    btn.innerText = "Delete Ticket";
    btn.style =
      "background:#ff4b4b;color:white;padding:10px;margin:10px;border-radius:10px;width:90%;cursor:pointer;";
    btn.onclick = closeTicket;
    qs("chatWindow").prepend(btn);
  }
}

function showChatWindow() {
  qs("chatWindow").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");
}

function initChatUI() {
  qs("chatSend").onclick = sendMessage;

  qs("chatButton").onclick = () => {
    qs("chatWindow").classList.toggle("hidden");
  };
}

/* ============================================================
   MAIN INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  initChatUI();

  const token = localStorage.getItem("authToken");
  let loaded = false;

  // Returning from Stripe
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get("chat") === "open" && urlParams.get("session_id")) {
    const sid = urlParams.get("session_id");

    const res = await fetch(`${API}/pay/session-info/${sid}`);
    const data = await res.json();

    if (data.chatId) {
      loaded = await loadChatById(data.chatId);
      localStorage.setItem("HAS_PURCHASED", "yes");
    }
  }

  if (!loaded && token) {
    loaded = await loadChatForUser(token);
  }

  if (!loaded) {
    qs("chatButton").classList.add("hidden");
    qs("chatWindow").classList.add("hidden");
  }
});

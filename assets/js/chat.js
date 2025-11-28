/* ============================================================
   TamedBlox Chat System — FINAL + ADMIN BUTTON PATCHED
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;

// Prevent SSE duplication
let LAST_SENT_TIMESTAMP = null;

// iPad global touch handler to prevent blocked touch events
document.addEventListener("touchend", () => {}, { passive: false });

/* ============================================================
   SSE STREAM HANDLER — PATCHED FOR STABILITY
============================================================ */
let evtSrc = null;

function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (msg.deleted === true) {
        alert("This ticket has been deleted.");
        qs("chatWindow").classList.add("hidden");

        qs("chatInput").disabled = true;
        qs("chatSend").disabled = true;

        return;
      }

      appendMessage(msg);

    } catch (err) {
      console.warn("SSE parse error:", err);
    }
  };

  evtSrc.onerror = () => {
    console.warn("SSE connection lost, retrying...");
    setTimeout(() => startSSE(chatId), 1500);
  };
}

/* ============================================================
   HELPERS
============================================================ */
function qs(id) {
  return document.getElementById(id);
}

/* ============================================================
   MESSAGE BUBBLE LOGIC
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
   SAFE APPEND — NO DUPLICATES
============================================================ */
function appendMessage(msg) {
  if (msg.timestamp === LAST_SENT_TIMESTAMP) return;

  const box = qs("chatMessages");
  if (!box) return;

  box.innerHTML += createMsgHTML(msg);
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD MESSAGES FROM SERVER
============================================================ */
async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();

  const box = qs("chatMessages");
  box.innerHTML = msgs.map(createMsgHTML).join("");
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD USER CHAT (LOGGED-IN USERS)
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
   LOAD CHAT BY ID (RETURNING FROM STRIPE)
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

  } catch {
    return false;
  }
}

/* ============================================================
   ADMIN MODE — LOAD ACTIVE CHATS
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
      <div class="admin-chat-item" data-id="${chat._id}">
        <strong>${chat.orderDetails?.orderId || "Order"}</strong><br>
        ${chat.participants?.[0] || "User"}
      </div>
    `;
  });

  document.querySelectorAll(".admin-chat-item").forEach((el) => {
    el.onclick = () => openAdminChat(el.getAttribute("data-id"));
  });
}

/* ============================================================
   OPEN ADMIN CHAT
============================================================ */
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
   ORDER SUMMARY BOX
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
   ADMIN HARD DELETE
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

  document.querySelector(`[data-id="${CURRENT_CHAT._id}"]`)?.remove();
  qs("chatWindow").classList.add("hidden");
}

/* ============================================================
   SEND MESSAGE — iPad/iPhone/Android SAFE VERSION
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");

  // iPad: ensure last typed character is committed
  let msg = input.value;
  msg = msg.trim();
  input.value = msg;

  if (!msg || !CURRENT_CHAT) return;

  // Save message before clearing (iOS fix)
  const sendContent = msg;
  input.value = "";

  const timestamp = new Date().toISOString();

  const localMessage = {
    sender: IS_ADMIN ? "admin" : (CURRENT_CHAT.userEmail || "user"),
    content: sendContent,
    timestamp
  };

  LAST_SENT_TIMESTAMP = timestamp;
  appendMessage(localMessage);

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json" };

  if (token) headers.Authorization = "Bearer " + token;
  else headers["x-purchase-verified"] = "true";

  // iPad Safari fix: delay fetch call so keyboard blur doesn't cancel it
  setTimeout(() => {
    fetch(`${API}/chats/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId: CURRENT_CHAT._id,
        content: sendContent
      })
    }).catch(() => {});
  }, 50);

  forceScrollBottom();
}

/* ============================================================
   MOBILE/TABLET SEND FIX
============================================================ */
function mobileSendFix(event) {
  event.preventDefault();
  event.stopPropagation();
  sendMessage();
}

function forceScrollBottom() {
  const box = qs("chatMessages");
  setTimeout(() => {
    box.scrollTop = box.scrollHeight;
  }, 50);
}

/* ============================================================
   ADMIN UI ENABLER
============================================================ */
function enableAdminUI() {
  qs("adminChatPanel").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");

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

  // Desktop
  qs("chatSend").onclick = sendMessage;

  // Mobile + iPad + Safari fixes
  qs("chatSend").addEventListener("touchstart", mobileSendFix, { passive: false });
  qs("chatSend").addEventListener("touchend", mobileSendFix, { passive: false });
  qs("chatSend").addEventListener("pointerup", mobileSendFix);
  qs("chatSend").addEventListener("click", mobileSendFix);

  // Chat button toggle
  qs("chatButton").onclick = () => {
    qs("chatWindow").classList.toggle("hidden");
  };
}

/* ============================================================
   ADMIN BUTTON PATCH
============================================================ */
function bindAdminButton() {
  const btn = document.getElementById("adminChatBtn");
  if (!btn) return setTimeout(bindAdminButton, 50);

  btn.onclick = async () => {
    const panel = document.getElementById("adminChatPanel");
    if (!panel) return;

    panel.classList.toggle("hidden");

    const token = localStorage.getItem("authToken");
    if (IS_ADMIN && token) {
      await loadAdminChats(token);
    }
  };

  console.log("Admin Chat button bound.");
}

setTimeout(bindAdminButton, 150);

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

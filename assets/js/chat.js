/* ============================================================
   TamedBlox Chat — FINAL PURCHASE-VERIFIED VERSION (2025)
   ✔ Only buyers, logged-in users, and admins get a chat
   ✔ Guests without purchase DO NOT see chat
   ✔ Guest buyers CAN send messages (fixed x-purchase-verified)
   ✔ Admin delete works
   ✔ SSE real-time
   ✔ iOS/PC/Mobile message send
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;
let LAST_SENT_TIMESTAMP = null;
let evtSrc = null;

// iOS focus bug fix
document.addEventListener("touchend", () => {}, { passive: false });

const qs = (id) => document.getElementById(id);

/* ============================================================
   SSE STREAM
============================================================ */
function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (msg.deleted) {
        alert("This ticket has been deleted.");
        qs("chatWindow").classList.add("hidden");
        qs("chatInput").disabled = true;
        qs("chatSend").disabled = true;
        return;
      }

      appendMessage(msg);
    } catch {}
  };

  evtSrc.onerror = () => {
    setTimeout(() => startSSE(chatId), 1500);
  };
}

/* ============================================================
   MESSAGE RENDERING
============================================================ */
function isMine(msg) {
  const me = IS_ADMIN ? "admin" : (CURRENT_CHAT.userEmail || "customer");
  return msg.sender === me;
}

function createMsgHTML(msg) {
  if (msg.system) {
    return `
      <div class="msg them" style="opacity:.6;">
        ${msg.content}
        <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
      </div>`;
  }

  return `
    <div class="msg ${isMine(msg) ? "me" : "them"}">
      ${msg.content}
      <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
    </div>`;
}

function appendMessage(msg) {
  if (msg.timestamp === LAST_SENT_TIMESTAMP) return;

  const box = qs("chatMessages");
  if (!box) return;

  box.innerHTML += createMsgHTML(msg);
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD CHAT DATA
============================================================ */
async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();
  qs("chatMessages").innerHTML = msgs.map(createMsgHTML).join("");
  qs("chatMessages").scrollTop = qs("chatMessages").scrollHeight;
}

/* Logged-in user chat */
async function loadChatForUser(token) {
  const info = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!info.ok) return false;

  const user = await info.json();
  IS_ADMIN = !!user.admin;

  // Admin
  if (IS_ADMIN) {
    enableAdminUI();
    return loadAdminChats(token);
  }

  // User
  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat || !chat._id) return false;

  CURRENT_CHAT = { _id: chat._id, userEmail: user.email };

  renderOrderSummary(chat);
  await loadMessages(chat._id);
  showChatWindow();
  startSSE(chat._id);

  return true;
}

/* Stripe return */
async function loadChatById(chatId) {
  const res = await fetch(`${API}/chats/by-id/${chatId}`);
  const chat = await res.json();

  if (!chat || !chat._id) return false;

  CURRENT_CHAT = { _id: chat._id, userEmail: chat.userEmail || "customer" };

  renderOrderSummary(chat);
  await loadMessages(chat._id);
  showChatWindow();
  startSSE(chat._id);

  return true;
}

/* ============================================================
   ORDER SUMMARY
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
   ADMIN PANEL
============================================================ */
async function loadAdminChats(token) {
  const res = await fetch(`${API}/chats/all`, {
    headers: { Authorization: "Bearer " + token }
  });

  const list = await res.json();
  const wrap = qs("adminChatList");
  wrap.innerHTML = "";

  list.forEach((chat) => {
    wrap.innerHTML += `
      <div class="admin-chat-item" data-id="${chat._id}">
        <strong>${chat.orderDetails?.orderId || "Order"}</strong><br>
        ${chat.participants?.[0] || "User"}
      </div>`;
  });

  document.querySelectorAll(".admin-chat-item").forEach(el => {
    el.onclick = () => openAdminChat(el.getAttribute("data-id"));
  });
}

async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API}/chats/by-id/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();

  CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

  renderOrderSummary(chat);
  await loadMessages(chatId);
  showChatWindow();
  startSSE(chatId);
}

function enableAdminUI() {
  qs("adminChatPanel").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");

  if (!qs("deleteTicketBtn")) {
    const btn = document.createElement("button");
    btn.id = "deleteTicketBtn";
    btn.innerText = "Delete Ticket";

    btn.style = `
      background:#ff4b4b; color:white; padding:10px;
      margin:10px; border-radius:10px; width:90%;
      font-weight:900; border:none; cursor:pointer;
    `;

    btn.onclick = closeTicket;
    qs("chatWindow").insertBefore(btn, qs("chatOrderSummary"));
  }
}

/* ============================================================
   DELETE TICKET (Admin)
============================================================ */
async function closeTicket() {
  const token = localStorage.getItem("authToken");
  if (!IS_ADMIN) return alert("Only admins can delete tickets.");
  if (!CURRENT_CHAT) return;

  if (!confirm("Delete this ticket?")) return;

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
  alert("Ticket deleted.");
}

/* ============================================================
   SEND MESSAGE (GUEST BUYER FIX)
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  let msg = input.value.trim();
  input.value = "";
  if (!msg) return;

  const token = localStorage.getItem("authToken");
  const hasPurchased = localStorage.getItem("HAS_PURCHASED") === "yes";

  // Guests MUST have purchased
  if (!token && !hasPurchased && !IS_ADMIN) {
    alert("You must complete a purchase before chatting with support.");
    return;
  }

  if (!CURRENT_CHAT) return;

  const timestamp = new Date().toISOString();
  LAST_SENT_TIMESTAMP = timestamp;

  appendMessage({
    sender: IS_ADMIN ? "admin" : (CURRENT_CHAT.userEmail || "customer"),
    content: msg,
    timestamp
  });

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = "Bearer " + token;
  } else {
    // FIXED ✔ REQUIRED FOR BACKEND TO ACCEPT GUEST MESSAGES
    headers["x-guest"] = "true";
    headers["x-purchase-verified"] = "true";
  }

  setTimeout(() => {
    fetch(`${API}/chats/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId: CURRENT_CHAT._id,
        content: msg
      })
    });
  }, 20);
}

/* ============================================================
   CHAT UI
============================================================ */
function showChatWindow() {
  qs("chatWindow").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");
}

function initChatUI() {
  const sendBtn = qs("chatSend");

  sendBtn.onclick = (e) => {
    e.preventDefault();
    sendMessage();
  };

  sendBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    sendMessage();
  }, { passive: false });

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

  const urlParams = new URLSearchParams(location.search);

  // Stripe return
  if (urlParams.get("chat") === "open" && urlParams.get("session_id")) {
    const sid = urlParams.get("session_id");
    const res = await fetch(`${API}/pay/session-info/${sid}`);
    const data = await res.json();

    if (data.chatId) {
      localStorage.setItem("HAS_PURCHASED", "yes");
      loaded = await loadChatById(data.chatId);
    }
  }

  // Logged-in user
  if (!loaded && token) {
    loaded = await loadChatForUser(token);
  }

  // Guests without purchase → hide chat
  if (!loaded) {
    qs("chatWindow").classList.add("hidden");
    qs("chatButton").classList.add("hidden");
  }
});

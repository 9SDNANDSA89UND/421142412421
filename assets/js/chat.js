/* ============================================================
   TamedBlox Chat — FULLY PATCHED VERSION (NO AUTO OPEN)
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;
let LAST_SENT_TIMESTAMP = null;
let evtSrc = null;

// Helper
const qs = (id) => document.getElementById(id);

/* ============================================================
   SSE STREAM HANDLER
============================================================ */
function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
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
  return `
    <div class="msg ${msg.system ? "system" : isMine(msg) ? "me" : "them"}">
      ${msg.content}
      <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
    </div>`;
}

function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box) return;

  box.innerHTML += createMsgHTML(msg);
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD CHAT MESSAGES
============================================================ */
async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();
  qs("chatMessages").innerHTML = msgs.map(createMsgHTML).join("");
  qs("chatMessages").scrollTop = qs("chatMessages").scrollHeight;
}

/* ============================================================
   LOAD USER CHAT
============================================================ */
async function loadChatForUser(token) {
  const info = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!info.ok) return false;

  const user = await info.json();
  IS_ADMIN = !!user.admin;

  /* ---------- ADMIN MODE ---------- */
  if (IS_ADMIN) {
    qs("adminChatBtn")?.classList.remove("hidden");
    return true; // Wait for toggle to open admin panel
  }

  /* ---------- NORMAL USER ---------- */
  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat || !chat._id) return false;

  CURRENT_CHAT = { _id: chat._id, userEmail: user.email };

  await loadMessages(chat._id);

  // Do NOT auto-open chat window
  qs("chatButton")?.classList.remove("hidden");

  return true;
}

/* ============================================================
   ADMIN: LOAD ALL CHATS INTO SIDEBAR
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

  document.querySelectorAll(".admin-chat-item").forEach((el) => {
    el.onclick = () => openAdminChat(el.getAttribute("data-id"));
  });
}

/* ============================================================
   OPEN A CHAT AS ADMIN
============================================================ */
async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API}/chats/by-id/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();

  CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

  await loadMessages(chatId);
  qs("chatWindow").classList.remove("hidden");
  startSSE(chatId);
}

/* ============================================================
   SEND MESSAGE
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  let msg = input.value.trim();
  input.value = "";

  if (!msg || !CURRENT_CHAT) return;

  const token = localStorage.getItem("authToken");

  appendMessage({
    sender: IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail,
    content: msg,
    timestamp: new Date()
  });

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

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
   TOGGLE ADMIN PANEL
============================================================ */
function setupAdminPanelToggle() {
  const btn = qs("adminChatBtn");
  const panel = qs("adminChatPanel");

  if (!btn || !panel) return;

  btn.onclick = async () => {
    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
      const token = localStorage.getItem("authToken");
      await loadAdminChats(token);
    }
  };
}

/* ============================================================
   TOGGLE CHAT WINDOW BUTTON
============================================================ */
function setupChatButton() {
  const btn = qs("chatButton");
  const win = qs("chatWindow");

  if (!btn || !win) return;

  btn.onclick = () => {
    win.classList.toggle("hidden");
  };
}

/* ============================================================
   MAIN INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");

  setupAdminPanelToggle();
  setupChatButton();

  let loaded = false;

  if (token) loaded = await loadChatForUser(token);

  /* ---------- NOT LOGGED IN ---------- */
  if (!loaded) {
    qs("adminChatPanel")?.classList.add("hidden");
    qs("chatWindow")?.classList.add("hidden");
    qs("chatButton")?.classList.add("hidden");
    qs("adminChatBtn")?.classList.add("hidden");
  }
});

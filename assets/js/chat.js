/* ============================================================
   TamedBlox Chat — FINAL STABLE VERSION (NO MORE TOGGLE BUGS)
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;
let evtSrc = null;

const qs = (id) => document.getElementById(id);

/* ============================================================
   SSE
============================================================ */
function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      appendMessage(JSON.parse(e.data));
    } catch {}
  };

  evtSrc.onerror = () => setTimeout(() => startSSE(chatId), 1500);
}

/* ============================================================
   MESSAGE RENDERING
============================================================ */
function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box) return;

  const mine = IS_ADMIN ? "admin" : CURRENT_CHAT?.userEmail;

  const html = `
    <div class="msg ${msg.system ? "system" : msg.sender === mine ? "me" : "them"}">
      ${msg.content}
      <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
    </div>`;

  box.innerHTML += html;
  box.scrollTop = box.scrollHeight;
}

async function loadMessages(id) {
  const res = await fetch(`${API}/chats/messages/${id}`);
  const msgs = await res.json();
  qs("chatMessages").innerHTML = msgs.map(appendMessage).join("");
}

/* ============================================================
   LOAD ADMIN CHAT LIST
============================================================ */
async function loadAdminChats() {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API}/chats/all`, {
    headers: { Authorization: "Bearer " + token }
  });

  const list = await res.json();
  const wrap = qs("adminChatList");
  wrap.innerHTML = "";

  list.forEach((chat) => {
    const el = document.createElement("div");
    el.className = "admin-chat-item";
    el.dataset.id = chat._id;
    el.innerHTML = `<strong>${chat.orderDetails?.orderId || "Order"}</strong><br>${chat.participants?.[0]}`;
    el.onclick = () => openAdminChat(chat._id);
    wrap.appendChild(el);
  });
}

/* ============================================================
   OPEN CHAT AS ADMIN
============================================================ */
async function openAdminChat(id) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API}/chats/by-id/${id}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();

  CURRENT_CHAT = { _id: id, userEmail: "admin" };

  qs("chatWindow").classList.remove("hidden");

  await loadMessages(id);
  startSSE(id);
}

/* ============================================================
   ADMIN PANEL TOGGLE — FIXED (ALWAYS OPENS)
============================================================ */
async function toggleAdminPanel() {
  const panel = qs("adminChatPanel");
  const token = localStorage.getItem("authToken");

  if (!panel) return;

  const opening = panel.classList.contains("hidden");

  if (opening) {
    // ALWAYS load chat list BEFORE opening (fixes stuck panel)
    await loadAdminChats(token);
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

function setupAdminButton() {
  const btn = qs("adminChatBtn");
  if (!btn) return;
  btn.onclick = toggleAdminPanel;
}

/* ============================================================
   LOAD USER OR ADMIN SESSION
============================================================ */
async function loadSession() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  const me = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!me.ok) return false;

  const user = await me.json();
  IS_ADMIN = !!user.admin;

  // Admin shouldn't auto-open panel or chat window
  if (IS_ADMIN) {
    qs("adminChatBtn")?.classList.remove("hidden");
    return true;
  }

  // Normal user chat
  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat?._id) return false;

  CURRENT_CHAT = { _id: chat._id, userEmail: user.email };

  qs("chatButton")?.classList.remove("hidden");

  return true;
}

/* ============================================================
   SEND MESSAGE
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  const text = input.value.trim();
  input.value = "";

  if (!text || !CURRENT_CHAT) return;

  const token = localStorage.getItem("authToken");

  appendMessage({
    sender: IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail,
    content: text,
    timestamp: new Date()
  });

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  fetch(`${API}/chats/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chatId: CURRENT_CHAT._id, content: text })
  });
}

/* ============================================================
   CHAT WINDOW TOGGLE
============================================================ */
function setupChatWindowToggle() {
  const btn = qs("chatButton");
  const win = qs("chatWindow");
  if (!btn || !win) return;

  btn.onclick = () => win.classList.toggle("hidden");
}

/* ============================================================
   MAIN
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  setupAdminButton();
  setupChatWindowToggle();

  const ok = await loadSession();

  if (!ok) {
    qs("adminChatPanel")?.classList.add("hidden");
    qs("adminChatBtn")?.classList.add("hidden");
    qs("chatWindow")?.classList.add("hidden");
    qs("chatButton")?.classList.add("hidden");
  }
});

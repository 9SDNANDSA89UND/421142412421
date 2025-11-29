/* ============================================================
   TamedBlox Chat — FINAL PRODUCTION VERSION (STABLE)
============================================================ */

window.API = "https://website-5eml.onrender.com";

let IS_ADMIN = false;
let CURRENT_CHAT = null;
let evtSrc = null;

const qs = (id) => document.getElementById(id);

/* ============================================================
   SAFE AUTH CHECK (NEVER HIDES UI FOR LOGGED-IN USERS)
============================================================ */
async function loadSession() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return { loggedIn: false, admin: false };
  }

  let me;
  try {
    me = await fetch(`${API}/auth/me`, {
      headers: { Authorization: "Bearer " + token }
    });
  } catch (err) {
    console.warn("Auth check failed:", err);
    return { loggedIn: false, admin: false };
  }

  if (!me.ok) {
    console.warn("auth/me returned", me.status);
    return { loggedIn: false, admin: false };
  }

  const user = await me.json();

  return {
    loggedIn: true,
    admin: user.admin === true,
    user
  };
}

/* ============================================================
   SSE STREAM
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
   MESSAGES
============================================================ */
function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box) return;

  const mine = IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail;

  const div = document.createElement("div");
  div.className = `msg ${msg.system ? "system" : msg.sender === mine ? "me" : "them"}`;
  div.innerHTML = `${msg.content}<br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();

  qs("chatMessages").innerHTML = "";
  msgs.forEach((m) => appendMessage(m));
}

/* ============================================================
   CUSTOMER CHAT LOADING
============================================================ */
async function loadCustomerChat(token) {
  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (!chat?._id) return false;

  CURRENT_CHAT = { _id: chat._id, userEmail: chat.userEmail };

  await loadMessages(chat._id);

  qs("chatButton")?.classList.remove("hidden");
  startSSE(chat._id);

  return true;
}

/* ============================================================
   ADMIN CHAT LIST
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
    const item = document.createElement("div");
    item.className = "admin-chat-item";
    item.dataset.id = chat._id;
    item.innerHTML = `
      <strong>${chat.orderDetails?.orderId || "Order"}</strong><br>
      ${chat.participants?.[0] || "User"}
    `;
    item.onclick = () => openAdminChat(chat._id);
    wrap.appendChild(item);
  });
}

/* ============================================================
   ADMIN OPEN CHAT
============================================================ */
async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API}/chats/by-id/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();

  CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

  qs("chatWindow").classList.remove("hidden");

  await loadMessages(chatId);
  startSSE(chatId);
}

/* ============================================================
   SENDING MESSAGES
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

  fetch(`${API}/chats/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? "Bearer " + token : ""
    },
    body: JSON.stringify({ chatId: CURRENT_CHAT._id, content: text })
  });
}

/* ============================================================
   ADMIN PANEL TOGGLE
============================================================ */
function setupAdminToggle() {
  const btn = qs("adminChatBtn");
  const panel = qs("adminChatPanel");

  if (!btn || !panel) return;

  btn.onclick = async () => {
    const opening = panel.classList.contains("hidden");

    if (opening) {
      await loadAdminChats();
      panel.classList.remove("hidden");
    } else {
      panel.classList.add("hidden");
    }
  };
}

/* ============================================================
   CHAT WINDOW TOGGLE (CUSTOMER + ADMIN)
============================================================ */
function setupChatWindowToggle() {
  const btn = qs("chatButton");
  const win = qs("chatWindow");

  if (!btn || !win) return;

  btn.onclick = () => win.classList.toggle("hidden");
}

/* ============================================================
   MAIN INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  setupAdminToggle();
  setupChatWindowToggle();

  const session = await loadSession();

  if (!session.loggedIn) {
    // guest
    qs("adminChatPanel")?.classList.add("hidden");
    qs("chatWindow")?.classList.add("hidden");
    qs("chatButton")?.classList.add("hidden");
    return;
  }

  IS_ADMIN = session.admin;

  if (IS_ADMIN) {
    qs("adminChatBtn")?.classList.remove("hidden");
    return; // admin must click button to open panel
  }

  // customer
  await loadCustomerChat(localStorage.getItem("authToken"));
});

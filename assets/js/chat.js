/* ============================================================
   TamedBlox — Chat System (FINAL PATCHED VERSION)
   ✔ Admin panel z-index fixed
   ✔ Mobile landscape mode fixed
   ✔ Fully responsive chat UI
============================================================ */

window.API = "https://website-5eml.onrender.com";

let IS_ADMIN = false;
let CURRENT_CHAT = null;
let evtSrc = null;

const qs = (id) => document.getElementById(id);

/* ============================================================
   SAFE DOM WAITER — guarantees navbar exists before binding
============================================================ */
function waitForElement(id, cb) {
  const el = document.getElementById(id);
  if (el) return cb(el);
  setTimeout(() => waitForElement(id, cb), 30);
}

/* ============================================================
   AUTH CHECK
============================================================ */
async function loadSession() {
  const token = localStorage.getItem("authToken");
  if (!token) return { loggedIn: false, admin: false };

  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) return { loggedIn: false };

    const user = await res.json();

    return {
      loggedIn: true,
      admin: user.admin === true,
      email: user.email
    };
  } catch {
    return { loggedIn: false };
  }
}

/* ============================================================
   SSE
============================================================ */
function startSSE(chatId) {
  if (!chatId) return;

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
   RENDER MESSAGES
============================================================ */
function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box || !msg) return;

  const mine = IS_ADMIN ? "admin" : CURRENT_CHAT?.userEmail;

  const div = document.createElement("div");
  div.className = `msg ${msg.system ? "system" : msg.sender === mine ? "me" : "them"}`;
  div.innerHTML = `${msg.content}<br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function loadMessages(id) {
  try {
    const res = await fetch(`${API}/chats/messages/${id}`);
    const msgs = await res.json();
    const box = qs("chatMessages");

    if (!box) return;

    box.innerHTML = "";
    msgs.forEach((m) => appendMessage(m));
  } catch {}
}

/* ============================================================
   CUSTOMER CHAT LOADING
============================================================ */
async function loadCustomerChat(token, email) {
  try {
    const res = await fetch(`${API}/chats/my-chats`, {
      headers: { Authorization: "Bearer " + token }
    });

    const chat = await res.json();

    if (!chat?._id) return false;

    CURRENT_CHAT = { _id: chat._id, userEmail: email };

    await loadMessages(chat._id);

    qs("chatButton")?.classList.remove("hidden");
    startSSE(chat._id);

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   ADMIN CHAT LIST
============================================================ */
async function loadAdminChats() {
  try {
    const token = localStorage.getItem("authToken");
    const wrap = qs("adminChatList");
    if (!wrap) return;

    const res = await fetch(`${API}/chats/all`, {
      headers: { Authorization: "Bearer " + token }
    });

    const list = await res.json();
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
  } catch {}
}

/* ============================================================
   OPEN ADMIN CHAT
============================================================ */
async function openAdminChat(chatId) {
  try {
    const token = localStorage.getItem("authToken");

    const res = await fetch(`${API}/chats/by-id/${chatId}`, {
      headers: { Authorization: "Bearer " + token }
    });

    const chat = await res.json();

    CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

    qs("chatWindow")?.classList.remove("hidden");

    await loadMessages(chatId);
    startSSE(chatId);
  } catch {}
}

/* ============================================================
   SEND MESSAGE
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  if (!input) return;

  const text = input.value.trim();
  input.value = "";

  if (!text || !CURRENT_CHAT) return;

  appendMessage({
    sender: IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail,
    content: text,
    timestamp: new Date()
  });

  try {
    const token = localStorage.getItem("authToken");

    fetch(`${API}/chats/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? "Bearer " + token : ""
      },
      body: JSON.stringify({ chatId: CURRENT_CHAT._id, content: text })
    });
  } catch {}
}

/* ============================================================
   ADMIN PANEL TOGGLE
============================================================ */
function bindAdminToggle() {
  waitForElement("adminChatBtn", (btn) => {
    btn.classList.remove("hidden");

    btn.onclick = async () => {
      const panel = qs("adminChatPanel");
      if (!panel) return;

      const opening = panel.classList.contains("hidden");

      if (opening) {
        await loadAdminChats();
        panel.classList.remove("hidden");
      } else {
        panel.classList.add("hidden");
      }
    };
  });
}

/* ============================================================
   CHAT WINDOW TOGGLE
============================================================ */
function bindChatButton() {
  waitForElement("chatButton", (btn) => {
    btn.onclick = () => {
      qs("chatWindow")?.classList.toggle("hidden");
    };
  });
}

/* ============================================================
   MAIN INIT — ✔ FIXED SEND BUTTON HERE
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  // ⭐ FIX — send button actually sends
  waitForElement("chatSend", (btn) => {
    btn.onclick = () => sendMessage();
  });

  const session = await loadSession();

  if (!session.loggedIn) return;

  IS_ADMIN = session.admin;

  bindChatButton();

  if (IS_ADMIN) {
    bindAdminToggle();
    return;
  }

  await loadCustomerChat(localStorage.getItem("authToken"), session.email);
});

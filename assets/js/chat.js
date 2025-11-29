/* ============================================================
   TamedBlox — Chat System (Universal Working Version)
   ✔ Logged-in customers
   ✔ Guests
   ✔ Stripe checkout
   ✔ Admin panel
   ✔ Correct bubble colors
   ✔ No duplicate messages
============================================================ */

window.API = "https://website-5eml.onrender.com";

let IS_ADMIN = false;
let CURRENT_CHAT = null;
let evtSrc = null;

const qs = (id) => document.getElementById(id);

/* ============================================================
   WAIT FOR ELEMENT
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
  if (!token) return { loggedIn: false };

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
   SSE STREAM
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
   RENDER MESSAGE (FIXED BUBBLE COLORS)
============================================================ */
function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box || !msg) return;

  let mine;

  // Admin
  if (IS_ADMIN) {
    mine = "admin";
  }

  // Logged-in customer (email known)
  else if (CURRENT_CHAT?.userEmail && CURRENT_CHAT.userEmail !== "customer") {
    mine = CURRENT_CHAT.userEmail;
  }

  // Guest & Stripe customers
  else {
    mine = "customer";
  }

  const sender = msg.sender || "customer";

  const div = document.createElement("div");
  div.className = `msg ${
    msg.system ? "system" : sender === mine ? "me" : "them"
  }`;

  div.innerHTML = `${msg.content}<br><small>${new Date(
    msg.timestamp
  ).toLocaleTimeString()}</small>`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   LOAD ALL MESSAGES
============================================================ */
async function loadMessages(chatId) {
  try {
    const res = await fetch(`${API}/chats/messages/${chatId}`);
    const msgs = await res.json();
    const box = qs("chatMessages");
    if (!box) return;

    box.innerHTML = "";
    msgs.forEach((m) => appendMessage(m));
  } catch {}
}

/* ============================================================
   LOGGED-IN CUSTOMER CHAT LOAD
============================================================ */
async function loadCustomerChat(token, email) {
  try {
    const res = await fetch(`${API}/chats/my-chats`, {
      headers: { Authorization: "Bearer " + token }
    });

    const chat = await res.json();
    if (!chat?._id) return false;

    CURRENT_CHAT = { _id: chat._id, userEmail: email };

    qs("chatButton")?.classList.remove("hidden");
    qs("chatWindow")?.classList.remove("hidden");

    await loadMessages(chat._id);
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
   SEND MESSAGE (NO DUPLICATES)
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  if (!input) return;

  const text = input.value.trim();
  input.value = "";
  if (!text || !CURRENT_CHAT) return;

  // DO NOT append locally — SSE adds it correctly
  try {
    const token = localStorage.getItem("authToken");

    fetch(`${API}/chats/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? "Bearer " + token : ""
      },
      body: JSON.stringify({
        chatId: CURRENT_CHAT._id,
        content: text
      })
    });
  } catch {}
}

/* ============================================================
   ADMIN TOGGLE BUTTON
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
   CHAT WINDOW BUTTON
============================================================ */
function bindChatButton() {
  waitForElement("chatButton", (btn) => {
    btn.onclick = () => {
      qs("chatWindow")?.classList.toggle("hidden");
    };
  });
}

/* ============================================================
   UNIVERSAL CHAT LOADER (LOGGED-IN OR GUEST)
============================================================ */
async function universalChatLoad() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const chatOpen = params.get("chat");

  // 1️⃣ Stripe checkout return
  if (chatOpen === "open" && sessionId) {
    try {
      const res = await fetch(`${API}/pay/session-info/${sessionId}`);
      const data = await res.json();

      if (data.chatId) {
        CURRENT_CHAT = { _id: data.chatId, userEmail: "customer" };

        qs("chatButton")?.classList.remove("hidden");
        qs("chatWindow")?.classList.remove("hidden");

        await loadMessages(data.chatId);
        startSSE(data.chatId);
        return;
      }
    } catch (err) {
      console.error("Stripe chat load failed", err);
    }
  }

  // 2️⃣ Logged-in customers
  const token = localStorage.getItem("authToken");
  if (token) {
    const session = await loadSession();
    if (session.loggedIn) {
      const ok = await loadCustomerChat(token, session.email);
      if (ok) return;
    }
  }

  // 3️⃣ Guests → nothing to load until they fully purchase
}

/* ============================================================
   MAIN INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {

  // Send button fix
  waitForElement("chatSend", (btn) => {
    btn.onclick = () => sendMessage();
  });

  // Load chat for every user type (guest, logged-in, stripe)
  await universalChatLoad();

  // Admin logic
  const session = await loadSession();
  if (session.loggedIn) {
    IS_ADMIN = session.admin;

    bindChatButton();

    if (IS_ADMIN) {
      bindAdminToggle();
      return;
    }
  }
});

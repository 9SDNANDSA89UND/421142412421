window.API = "https://website-5eml.onrender.com";

let IS_ADMIN = false;
let CURRENT_CHAT = null;
let evtSrc = null;

const qs = (id) => document.getElementById(id);

function waitForElement(id, cb) {
  const el = document.getElementById(id);
  if (el) return cb(el);
  setTimeout(() => waitForElement(id, cb), 30);
}

/* ============================================================
   SESSION LOADING
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
   RESTORE ORDER SUMMARY
============================================================ */
function renderOrderSummary(order) {
  const box = qs("chatOrderSummary");
  if (!box) return;
  if (!order) {
    box.innerHTML = "";
    return;
  }
  const date = order.date
    ? new Date(order.date).toLocaleString()
    : new Date().toLocaleString();
  box.innerHTML = `
    <strong style="font-size:14px;">Order Summary</strong><br>
    <div style="margin-top:6px; font-size:13px; line-height:1.4;">
      <b>Order ID:</b> ${order.orderId || "N/A"}<br>
      <b>Product:</b> ${order.productName || "Unknown Product"}<br>
      <b>Price:</b> ${order.price ? "$" + order.price : "N/A"}<br>
      <b>Date:</b> ${date}
    </div>
  `;
}

/* ============================================================
   SSE STREAM + MESSAGE LOADING
============================================================ */
function startSSE(chatId) {
  if (!chatId) return;
  if (evtSrc) evtSrc.close();
  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);
  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      appendMessage(msg);
    } catch {}
  };
  evtSrc.onerror = () => setTimeout(() => startSSE(chatId), 1500);
}

function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box || !msg) return;
  if (msg.deleted) {
    qs("chatWindow")?.classList.add("hidden");
    localStorage.removeItem("tamed_last_session");
    localStorage.removeItem("tamed_chat_id");
    return;
  }

  let mine;
  if (IS_ADMIN) {
    mine = "admin";
  } else if (CURRENT_CHAT?.userEmail && CURRENT_CHAT.userEmail !== "customer") {
    mine = CURRENT_CHAT.userEmail;
  } else {
    mine = "customer";
  }

  const div = document.createElement("div");
  div.className = `msg ${msg.system ? "system" : msg.sender === mine ? "me" : "them"}`;
  div.innerHTML = `
    ${msg.content}
    <br>
    <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

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
   RESTORE CHAT FROM SESSION — NEW LOGIC
============================================================ */
async function restoreChatFromSession(sessionId) {
  try {
    const res = await fetch(`${API}/pay/session-info/${sessionId}`);
    const data = await res.json();
    if (!data.chatId) return false;

    // SAVE chatId to localStorage
    localStorage.setItem("tamed_chat_id", data.chatId);

    CURRENT_CHAT = { _id: data.chatId, userEmail: "customer" };

    const chatInfo = await fetch(`${API}/chats/by-id/${data.chatId}`).then(r => r.json());
    renderOrderSummary(chatInfo.orderDetails);

    qs("chatWindow")?.classList.remove("hidden");
    qs("chatButton")?.classList.remove("hidden");

    await loadMessages(data.chatId);
    startSSE(data.chatId);

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   UNIVERSAL CHAT LOAD — FULLY PATCHED
============================================================ */
async function universalChatLoad() {
  const params = new URLSearchParams(window.location.search);

  // 1️⃣ Get URL session ID
  let sessionId = params.get("session_id");

  // 2️⃣ Fallback to saved session
  if (!sessionId) {
    sessionId = localStorage.getItem("tamed_last_session");
  }

  // 3️⃣ If session exists, save it
  if (sessionId) {
    localStorage.setItem("tamed_last_session", sessionId);

    const restored = await restoreChatFromSession(sessionId);
    if (restored) return;
  }

  // 4️⃣ Fallback: If chatId exists, restore chat directly
  const savedChatId = localStorage.getItem("tamed_chat_id");
  if (savedChatId) {
    CURRENT_CHAT = { _id: savedChatId, userEmail: "customer" };
    const chatInfo = await fetch(`${API}/chats/by-id/${savedChatId}`).then(r => r.json());
    renderOrderSummary(chatInfo.orderDetails);

    qs("chatWindow")?.classList.remove("hidden");
    qs("chatButton")?.classList.remove("hidden");

    await loadMessages(savedChatId);
    startSSE(savedChatId);
    return;
  }

  // 5️⃣ Logged-in user fallback to customer chat
  const token = localStorage.getItem("authToken");
  if (token) {
    const session = await loadSession();
    if (session.loggedIn) {
      const ok = await loadCustomerChat(token, session.email);
      if (ok) return;
    }
  }
}

/* ============================================================
   LOAD CUSTOMER CHAT (existing logic)
============================================================ */
async function loadCustomerChat(token, email) {
  try {
    const res = await fetch(`${API}/chats/my-chats`, {
      headers: { Authorization: "Bearer " + token }
    });
    const chat = await res.json();
    if (!chat?._id) return false;

    localStorage.setItem("tamed_chat_id", chat._id);

    CURRENT_CHAT = { _id: chat._id, userEmail: email };
    renderOrderSummary(chat.orderDetails);
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
   SEND MESSAGE
============================================================ */
async function sendMessage() {
  const input = qs("chatInput");
  if (!input) return;
  const text = input.value.trim();
  input.value = "";
  if (!text || !CURRENT_CHAT) return;

  let sender =
    IS_ADMIN
      ? "admin"
      : CURRENT_CHAT.userEmail && CURRENT_CHAT.userEmail !== "customer"
      ? CURRENT_CHAT.userEmail
      : "customer";

  const token = localStorage.getItem("authToken");
  try {
    await fetch(`${API}/chats/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? "Bearer " + token : ""
      },
      body: JSON.stringify({
        chatId: CURRENT_CHAT._id,
        content: text,
        sender
      })
    });
  } catch {}
}

/* ============================================================
   ADMIN CONTROLS
============================================================ */
function enableAdminDelete() {
  waitForElement("deleteTicketBtn", (btn) => {
    btn.onclick = async () => {
      if (!CURRENT_CHAT?._id) return;
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API}/chats/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ chatId: CURRENT_CHAT._id })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("tamed_last_session");
        localStorage.removeItem("tamed_chat_id");
        location.reload();
      }
    };
  });
}

function bindAdminToggle() {
  waitForElement("adminChatBtn", (btn) => {
    btn.classList.remove("hidden");
    btn.onclick = async () => {
      const panel = qs("adminChatPanel");
      if (!panel) return;
      if (panel.classList.contains("hidden")) {
        await loadAdminChats();
        panel.classList.remove("hidden");
      } else {
        panel.classList.add("hidden");
      }
    };
  });
}

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

async function openAdminChat(chatId) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API}/chats/by-id/${chatId}`, {
      headers: { Authorization: "Bearer " + token }
    });
    const chat = await res.json();
    CURRENT_CHAT = { _id: chatId, userEmail: "admin" };
    renderOrderSummary(chat.orderDetails);
    qs("chatWindow")?.classList.remove("hidden");
    await loadMessages(chatId);
    startSSE(chatId);
  } catch {}
}

/* ============================================================
   CHAT BUTTON
============================================================ */
function bindChatButton() {
  waitForElement("chatButton", (btn) => {
    btn.onclick = () =>
      qs("chatWindow")?.classList.toggle("hidden");
  });
}

/* ============================================================
   INIT
============================================================ */
window.chatInit = () => {
  loadSession().then((session) => {
    if (session.loggedIn) {
      IS_ADMIN = session.admin;
      bindChatButton();
      if (IS_ADMIN) {
        bindAdminToggle();
        enableAdminDelete();
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  waitForElement("chatSend", (btn) => {
    btn.onclick = () => sendMessage();
  });
  await universalChatLoad();
  loadSession().then((session) => {
    if (session.loggedIn) {
      IS_ADMIN = session.admin;
      bindChatButton();
      if (IS_ADMIN) {
        bindAdminToggle();
        enableAdminDelete();
      }
    }
  });
});

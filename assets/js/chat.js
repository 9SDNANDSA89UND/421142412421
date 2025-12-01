// Disable chat on the post-purchase page
if (window.location.pathname.includes("post-purchase.html")) {
  console.log("Chat disabled on post-purchase page");
  window.chatInit = () => {};
  throw "";
}

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

function renderOrderSummary(order) {
  const box = qs("chatOrderSummary");
  if (!box || !order) return;

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : new Date().toLocaleString();

  box.innerHTML = `
    <strong>Order Summary</strong>
    <div class="chat-summary-group">
      <span class="chat-summary-label">Order ID:</span>
      <span class="chat-summary-value">${order.orderId}</span>
    </div>
    <div class="chat-summary-group">
      <span class="chat-summary-label">Product:</span>
      <span class="chat-summary-value">${
        order.items?.[0]?.name || "Unknown Item"
      }</span>
    </div>
    <div class="chat-summary-group">
      <span class="chat-summary-label">Price:</span>
      <span class="chat-summary-value">$${order.total?.toFixed(2)}</span>
    </div>
    <div class="chat-summary-group">
      <span class="chat-summary-label">Date:</span>
      <span class="chat-summary-value">${date}</span>
    </div>
  `;
}

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

function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box || !msg) return;

  if (msg.deleted) {
    qs("chatWindow")?.classList.add("hidden");
    localStorage.removeItem("tamed_chat_id");
    return;
  }

  let mine = IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail;

  const div = document.createElement("div");
  div.className = `msg ${
    msg.system ? "system" : msg.sender === mine ? "me" : "them"
  }`;

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

    box.innerHTML = "";
    msgs.forEach((m) => appendMessage(m));
  } catch {}
}

async function restoreChatFromSession(sessionId) {
  try {
    const res = await fetch(`${API}/pay/session-info/${sessionId}`);
    const data = await res.json();

    if (!data.chatId) return false;

    CURRENT_CHAT = { _id: data.chatId, userEmail: data.email || "customer" };

    const chatInfo = await fetch(`${API}/chats/by-id/${data.chatId}`).then((r) =>
      r.json()
    );

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
   ACCOUNT PRIORITY CHAT LOADING
============================================================ */
async function universalChatLoad() {
  // 1️⃣ LOGGED-IN USER → ALWAYS LOAD THEIR CHAT FIRST
  const token = localStorage.getItem("authToken");
  if (token) {
    const session = await loadSession();
    if (session.loggedIn) {
      const ok = await loadCustomerChat(token, session.email);
      if (ok) return;
    }
  }

  // 2️⃣ URL session fallback (Stripe)
  const params = new URLSearchParams(window.location.search);
  let sessionId = params.get("session_id");

  if (sessionId) {
    const restored = await restoreChatFromSession(sessionId);
    if (restored) return;
  }

  // 3️⃣ localStorage fallback
  const savedChatId = localStorage.getItem("tamed_chat_id");
  if (savedChatId) {
    CURRENT_CHAT = { _id: savedChatId, userEmail: "customer" };

    const chatInfo = await fetch(
      `${API}/chats/by-id/${savedChatId}`
    ).then((r) => r.json());

    renderOrderSummary(chatInfo.orderDetails);

    qs("chatWindow")?.classList.remove("hidden");
    qs("chatButton")?.classList.remove("hidden");

    await loadMessages(savedChatId);
    startSSE(savedChatId);
  }
}

async function loadCustomerChat(token, email) {
  try {
    const res = await fetch(`${API}/chats/my-chats`, {
      headers: { Authorization: "Bearer " + token }
    });

    const chat = await res.json();
    if (!chat?._id) return false;

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

async function sendMessage() {
  const input = qs("chatInput");
  const text = input.value.trim();
  input.value = "";

  if (!text || !CURRENT_CHAT) return;

  const sender = IS_ADMIN ? "admin" : CURRENT_CHAT.userEmail;

  const token = localStorage.getItem("authToken");

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
}

function enableAdminDelete() {
  waitForElement("deleteTicketBtn", (btn) => {
    btn.onclick = async () => {
      if (!CURRENT_CHAT?._id) return;

      const token = localStorage.getItem("authToken");

      await fetch(`${API}/chats/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ chatId: CURRENT_CHAT._id })
      });

      localStorage.removeItem("tamed_chat_id");
      location.reload();
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
          ${chat.userEmail || "User"}
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

function bindChatButton() {
  waitForElement("chatButton", (btn) => {
    btn.onclick = () => qs("chatWindow")?.classList.toggle("hidden");
  });
}

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

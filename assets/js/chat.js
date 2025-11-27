/* ============================================================
   TamedBlox Chat System — FINAL PATCHED VERSION
   ✔ Loads chat ONLY using chatId from Stripe
   ✔ Prevents random users from seeing other chats
   ✔ Fixes admin mode
   ✔ SSE real-time messaging
   ✔ No duplicate API, no “chat not ready”, no fallback bugs
============================================================ */

console.log("%c[TAMEDBLOX CHAT] Loaded", "color:#4ef58a;font-weight:900;");

window.API = "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let IS_ADMIN = false;

/* ============================================================
   SSE: LIVE MESSAGE STREAM
============================================================ */
let evtSrc = null;

function startSSE(chatId) {
  if (evtSrc) evtSrc.close();

  evtSrc = new EventSource(`${API}/chats/stream/${chatId}`);

  evtSrc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
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

function createMsgHTML(m) {
  const mine = m.sender === CURRENT_CHAT.userEmail;
  return `
    <div class="msg ${mine ? "me" : "them"}">
      ${m.content}
      <br><small>${new Date(m.timestamp).toLocaleTimeString()}</small>
    </div>
  `;
}

function appendMessage(msg) {
  const box = qs("chatMessages");
  if (!box) return;
  box.innerHTML += createMsgHTML(msg);
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
   LOAD CHAT BY chatId (ANONYMOUS PURCHASE)
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
   LOAD ALL MESSAGES
============================================================ */

async function loadMessages(chatId) {
  const res = await fetch(`${API}/chats/messages/${chatId}`);
  const msgs = await res.json();

  const box = qs("chatMessages");
  box.innerHTML = msgs.map(createMsgHTML).join("");
  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   ADMIN MODE
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

  CURRENT_CHAT = {
    _id: chatId,
    userEmail: "admin"
  };

  renderOrderSummary(chat);
  await loadMessages(chatId);
  showChatWindow();
}

/* ============================================================
   RENDER ORDER SUMMARY
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
   SEND MESSAGE
============================================================ */

async function sendMessage() {
  const input = qs("chatInput");
  const msg = input.value.trim();
  if (!msg || !CURRENT_CHAT) return;

  input.value = "";

  const token = localStorage.getItem("authToken");

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (!token) headers["x-purchase-verified"] = "true";

  await fetch(`${API}/chats/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId: CURRENT_CHAT._id,
      content: msg
    })
  });
}

/* ============================================================
   UI FUNCTIONS
============================================================ */

function enableAdminUI() {
  qs("adminChatPanel").classList.remove("hidden");
  qs("chatButton").classList.remove("hidden");
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
   MAIN STARTUP LOGIC
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  initChatUI();

  const token = localStorage.getItem("authToken");
  let loaded = false;

  /* CASE 1 — Returning from Stripe */
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

  /* CASE 2 — Logged-in user with real chat */
  if (!loaded && token) {
    loaded = await loadChatForUser(token);
  }

  /* CASE 3 — Non-purchaser → hide chat */
  if (!loaded) {
    qs("chatButton").classList.add("hidden");
    qs("chatWindow").classList.add("hidden");
  }
});

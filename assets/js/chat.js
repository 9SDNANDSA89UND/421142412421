/* ============================================================
   TamedBlox — FINAL CHAT.JS (ANON PURCHASE SUPPORT + NO ERRORS)
============================================================ */

if (window.__CHAT_JS_LOADED__) {
  console.warn("chat.js already loaded");
} else {
  window.__CHAT_JS_LOADED__ = true;

window.API = window.API || "https://website-5eml.onrender.com";

let CURRENT_CHAT = null;
let ALL_CHATS = [];

/* ============================================================
   URL PARAM HANDLER (auto-open chat after Stripe purchase)
============================================================ */
const urlParams = new URLSearchParams(window.location.search);
const autoOpen = urlParams.get("chat") === "open";
const urlChatId = urlParams.get("chatId");

/* If we were redirected from purchase, mark as purchased */
if (autoOpen) {
  localStorage.setItem("HAS_PURCHASED", "yes");
}

/* ============================================================
   SHOW CHAT BUBBLE IF USER MAY HAVE ACCESS
============================================================ */
async function showChatBubbleIfAllowed() {
  const bubble = document.getElementById("chatButton");
  if (!bubble) return;

  // Already purchased?
  if (localStorage.getItem("HAS_PURCHASED") === "yes") {
    bubble.classList.remove("hidden");
    return;
  }

  // Logged in users can get chat
  const token = sanitizeToken(localStorage.getItem("authToken"));
  if (!token) return;

  const res = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await res.json();
  if (chat && chat._id) {
    bubble.classList.remove("hidden");
    localStorage.setItem("HAS_PURCHASED", "yes");
  }
}

/* ============================================================
   TOKEN SANITIZER
============================================================ */
function sanitizeToken(t) {
  if (!t || t === "null" || t === "undefined" || t.trim() === "") return null;
  return t;
}

/* ============================================================
   LOAD CHAT (USER OR ADMIN)
============================================================ */
async function loadChat() {
  const token = sanitizeToken(localStorage.getItem("authToken"));

  /* 1️⃣ Admin/User Mode if Logged in */
  if (token) {
    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (meRes.ok) {
      const user = await meRes.json();

      // ADMIN MODE
      if (user.admin) {
        const r = await fetch(`${API}/chats/all`, {
          headers: { Authorization: "Bearer " + token }
        });

        ALL_CHATS = await r.json();
        renderAdminChatList();
        document.getElementById("chatButton")?.classList.remove("hidden");
        return;
      }

      // USER MODE
      const chatRes = await fetch(`${API}/chats/my-chats`, {
        headers: { Authorization: "Bearer " + token }
      });

      const chat = await chatRes.json();
      if (chat && chat._id) {
        CURRENT_CHAT = { _id: chat._id, userEmail: user.email };
        document.getElementById("chatButton")?.classList.remove("hidden");
        refreshMessages();
        return;
      }
    }
  }

  /* 2️⃣ Anonymous Purchased Mode */
  const purchased = localStorage.getItem("HAS_PURCHASED") === "yes";

  // URL chatId override from Stripe
  if (purchased && urlChatId) {
    CURRENT_CHAT = { _id: urlChatId, userEmail: "anonymous" };
    document.getElementById("chatButton")?.classList.remove("hidden");
    refreshMessages();
    return;
  }

  // Fetch latest chat from backend
  if (purchased) {
    await loadAnonymousChat();
  }
}

/* ============================================================
   ANONYMOUS CHAT LOADER
============================================================ */
async function loadAnonymousChat() {
  const bubble = document.getElementById("chatButton");

  const res = await fetch(`${API}/chats/anonymous-latest`, {
    headers: { "X-Purchase-Verified": "true" }
  });

  const chat = await res.json();

  if (chat && chat._id) {
    CURRENT_CHAT = { _id: chat._id, userEmail: "anonymous" };
    bubble?.classList.remove("hidden");
    refreshMessages();
  }
}

/* ============================================================
   SEND MESSAGE (USER OR ANON PURCHASE)
============================================================ */
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  if (!CURRENT_CHAT?._id) {
    alert("Chat not ready.");
    return;
  }

  input.value = "";

  const token = sanitizeToken(localStorage.getItem("authToken"));
  const purchased = localStorage.getItem("HAS_PURCHASED") === "yes";

  const headers = { "Content-Type": "application/json" };

  if (token) headers.Authorization = "Bearer " + token;
  else if (purchased) headers["X-Purchase-Verified"] = "true";
  else return alert("You must log in or purchase to use chat.");

  await fetch(`${API}/chats/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId: CURRENT_CHAT._id,
      content: msg
    })
  });

  refreshMessages();
}

/* ============================================================
   REFRESH MESSAGES
============================================================ */
async function refreshMessages() {
  if (!CURRENT_CHAT?._id) return;

  const token = sanitizeToken(localStorage.getItem("authToken"));
  const headers = {};

  if (token) headers.Authorization = "Bearer " + token;
  else headers["X-Purchase-Verified"] = "true";

  const res = await fetch(`${API}/chats/messages/${CURRENT_CHAT._id}`, {
    headers
  });

  const messages = await res.json();
  renderMessages(messages);
}

/* ============================================================
   RENDER CHAT MESSAGES
============================================================ */
function renderMessages(messages) {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  box.innerHTML = messages
    .map(
      (m) => `
        <div class="msg ${m.sender === CURRENT_CHAT?.userEmail ? "me" : "them"}">
          ${m.content}
          <br><small>${new Date(m.timestamp).toLocaleTimeString()}</small>
        </div>
      `
    )
    .join("");

  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   ADMIN PANEL LIST
============================================================ */
function renderAdminChatList() {
  const list = document.getElementById("adminChatList");
  if (!list) return;

  list.innerHTML = ALL_CHATS.map(
    (c) => `
      <div class="admin-chat-item" onclick="openAdminChat('${c._id}')">
        <strong>${c.orderDetails?.orderId || "Order"}</strong><br>
        ${c.participants[0]}
      </div>
    `
  ).join("");
}

window.openAdminChat = async function (chatId) {
  const token = sanitizeToken(localStorage.getItem("authToken"));

  CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

  const res = await fetch(`${API}/chats/messages/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  renderMessages(data);

  document.getElementById("chatWindow")?.classList.remove("hidden");
};

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  showChatBubbleIfAllowed();
  await loadChat();

  // Auto refresh
  setInterval(() => {
    if (CURRENT_CHAT?._id) refreshMessages();
  }, 2000);

  // Chat bubble click
  const bubble = document.getElementById("chatButton");
  if (bubble) {
    bubble.onclick = () => {
      document.getElementById("chatWindow")?.classList.toggle("hidden");
    };
  }

  // Send
  document.getElementById("chatSend")?.addEventListener("click", sendMessage);

  // Auto-open chat after purchase
  if (autoOpen) {
    setTimeout(() => {
      document.getElementById("chatButton")?.classList.remove("hidden");
      document.getElementById("chatWindow")?.classList.remove("hidden");
    }, 400);
  }
});

} // END WRAPPER

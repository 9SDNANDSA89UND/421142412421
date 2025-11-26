/* ============================================================
   TamedBlox — CHAT SYSTEM (ANONYMOUS SEND FOR PURCHASED USERS)
   - Prevents duplicate loading
   - Fixes API redeclare
   - Allows anon send ONLY if purchased
   - Chat bubble appears for purchased or admin
============================================================ */

// ========= SAFE WRAPPER (NO DUPLICATE LOAD) ========= //
if (window.__CHAT_JS_LOADED__) {
  console.warn("chat.js already loaded — skipping.");
} else {
  window.__CHAT_JS_LOADED__ = true;

// ========= SAFE API DEFINE ========= //
window.API = window.API || "https://website-5eml.onrender.com";

let ALL_CHATS = [];
let CURRENT_CHAT = null;

/* ============================================================
   PURCHASE BASED CHAT ICON VISIBILITY
============================================================ */
async function showChatBubbleIfPurchased() {
  const bubble = document.getElementById("chatButton");
  if (!bubble) return;

  // Already marked as purchased
  if (localStorage.getItem("HAS_PURCHASED") === "yes") {
    bubble.classList.remove("hidden");
    return;
  }

  // If logged in -> check if their account has a chat
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const r = await fetch(`${API}/chats/my-chats`, {
        headers: { Authorization: "Bearer " + token }
      });

      const chat = await r.json();
      if (chat && chat._id) {
        bubble.classList.remove("hidden");
        localStorage.setItem("HAS_PURCHASED", "yes");
      }
    } catch {}
  }
}

/* ============================================================
   INITIAL SETUP
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  showChatBubbleIfPurchased();
  loadChat();

  setInterval(() => {
    if (CURRENT_CHAT?._id) refreshMessages();
  }, 2000);

  const chatBtn = document.getElementById("chatButton");
  if (chatBtn) {
    chatBtn.onclick = () => {
      const token = localStorage.getItem("authToken");
      const bought = localStorage.getItem("HAS_PURCHASED") === "yes";

      // Show login ONLY if not purchased AND not logged in
      if (!token && !bought) {
        if (typeof openModal === "function") openModal("loginModal");
        return;
      }

      document.getElementById("chatWindow").classList.toggle("hidden");
    };
  }

  const adminBtn = document.getElementById("adminChatBtn");
  if (adminBtn) {
    adminBtn.onclick = () => {
      document.getElementById("adminChatPanel").classList.toggle("hidden");
    };
  }

  const sendBtn = document.getElementById("chatSend");
  if (sendBtn) sendBtn.onclick = sendMessage;
});

/* ============================================================
   LOAD CHAT DATA
============================================================ */
async function loadChat() {
  const token = localStorage.getItem("authToken");

  // Logged out? They may still have purchased via localStorage
  if (!token) {
    // Chat will be anonymous until they login
    return;
  }

  const me = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!me.ok) return;
  const user = await me.json();

  // Admin mode
  if (user.admin) {
    const all = await fetch(`${API}/chats/all`, {
      headers: { Authorization: "Bearer " + token }
    });

    ALL_CHATS = await all.json();
    renderAdminChatList();

    document.getElementById("chatButton")?.classList.remove("hidden");
    return;
  }

  // User mode
  const chatRes = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await chatRes.json();
  if (chat && chat._id) {
    CURRENT_CHAT = { ...chat, userEmail: user.email };
    localStorage.setItem("HAS_PURCHASED", "yes");

    document.getElementById("chatButton")?.classList.remove("hidden");

    renderOrderSummary(chat);
    refreshMessages();
  }
}

/* ============================================================
   ADMIN — CHAT LIST
============================================================ */
function renderAdminChatList() {
  const list = document.getElementById("adminChatList");
  if (!list) return;

  list.innerHTML = "";

  ALL_CHATS.forEach((c) => {
    list.innerHTML += `
      <div class="admin-chat-item" onclick="openAdminChat('${c._id}')">
        <strong>${c.orderDetails?.orderId || "No Order"}</strong><br>
        ${c.participants[0]}
      </div>
    `;
  });
}

/* ============================================================
   ADMIN — OPEN CHAT
============================================================ */
async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  CURRENT_CHAT = { _id: chatId, userEmail: "admin" };

  const res = await fetch(`${API}/chats/messages/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const msgs = await res.json();
  renderMessages(msgs);

  const win = document.getElementById("chatWindow");
  win.classList.add("admin-mode");
  win.classList.remove("hidden");
}

/* ============================================================
   ORDER SUMMARY
============================================================ */
function renderOrderSummary(chat) {
  const el = document.getElementById("chatOrderSummary");
  if (!el) return;

  if (!chat.orderDetails) {
    el.innerHTML = "<strong>No order linked.</strong>";
    return;
  }

  const o = chat.orderDetails;

  el.innerHTML = `
    <strong>Order ID:</strong> ${o.orderId}<br>
    <strong>Total:</strong> $${o.total} USD<br>
    <strong>Items:</strong><br>
    ${o.items.map(i => `• ${i.qty}× ${i.name}`).join("<br>")}
  `;
}

/* ============================================================
   RENDER MESSAGES
============================================================ */
function renderMessages(msgs) {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  box.innerHTML = msgs.map(m => `
    <div class="msg ${m.sender === CURRENT_CHAT?.userEmail ? "me" : "them"}">
      ${m.content}
      <br><small>${new Date(m.timestamp).toLocaleTimeString()}</small>
    </div>
  `).join("");

  box.scrollTop = box.scrollHeight;
}

/* ============================================================
   REFRESH MESSAGES
============================================================ */
async function refreshMessages() {
  if (!CURRENT_CHAT?._id) return;

  const token = localStorage.getItem("authToken");
  const headers = {};

  if (token) {
    headers.Authorization = "Bearer " + token;
  } else {
    headers["X-Purchase-Verified"] = "true";
  }

  const res = await fetch(`${API}/chats/messages/${CURRENT_CHAT._id}`, {
    headers
  });

  const msgs = await res.json();
  renderMessages(msgs);
}

/* ============================================================
   SEND MESSAGE (ANON IF PURCHASED)
============================================================ */
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  input.value = "";

  const token = localStorage.getItem("authToken");
  const purchased = localStorage.getItem("HAS_PURCHASED") === "yes";

  // Block random non-buyers
  if (!token && !purchased) {
    alert("You must purchase before using chat.");
    return;
  }

  // Anonymous OR logged-in headers
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  else headers["X-Purchase-Verified"] = "true";

  await fetch(`${API}/chats/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId: CURRENT_CHAT?._id,
      content: msg
    })
  });

  refreshMessages();
}

/* ============================================================
   END WRAPPER
============================================================ */
} // end wrapper

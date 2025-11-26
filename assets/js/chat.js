const API = "https://website-5eml.onrender.com";

let ALL_CHATS = [];
let CURRENT_CHAT = null;

document.addEventListener("DOMContentLoaded", () => {
  loadChat();

  // Auto-refresh
  setInterval(() => {
    if (CURRENT_CHAT?._id) refreshMessages();
  }, 2000);

  // USER CHAT BUTTON
  const userChatBtn = document.getElementById("chatButton");
  if (userChatBtn) {
    userChatBtn.onclick = () => {
      document.getElementById("chatWindow").classList.toggle("hidden");
    };
  }

  // ADMIN NAVBAR BUTTON
  const adminBtn = document.getElementById("adminChatBtn");
  if (adminBtn) {
    adminBtn.onclick = () => {
      document.getElementById("adminChatPanel").classList.toggle("hidden");
    };
  }

  document.getElementById("chatSend").onclick = sendMessage;
});

/* MAIN LOADER */
async function loadChat() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;
  const user = await res.json();

  /* ===== ADMIN MODE ===== */
  if (user.admin === true) {
    const allRes = await fetch(`${API}/chats/all`, {
      headers: { Authorization: "Bearer " + token }
    });

    ALL_CHATS = await allRes.json();
    renderAdminChatList();
    return;
  }

  /* ===== USER MODE ===== */
  const chatRes = await fetch(`${API}/chats/my-chats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await chatRes.json();
  if (!chat) return;

  CURRENT_CHAT = {
    ...chat,
    userEmail: user.email
  };

  renderOrderSummary(chat);
  refreshMessages();
}

/* ADMIN LIST */
function renderAdminChatList() {
  const list = document.getElementById("adminChatList");
  list.innerHTML = "";

  ALL_CHATS.forEach(c => {
    list.innerHTML += `
      <div class="admin-chat-item" onclick="openAdminChat('${c._id}')">
        <strong>${c.orderDetails?.orderId || "No Order"}</strong><br>
        ${c.participants[0]}
      </div>
    `;
  });
}

/* ADMIN OPEN CHAT */
async function openAdminChat(chatId) {
  const token = localStorage.getItem("authToken");

  CURRENT_CHAT = {
    _id: chatId,
    userEmail: "admin"
  };

  const res = await fetch(`${API}/chats/messages/${chatId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const msgs = await res.json();
  renderMessages(msgs);

  const chatWin = document.getElementById("chatWindow");
  chatWin.classList.add("admin-mode");
  chatWin.classList.remove("hidden");
}

/* ORDER SUMMARY */
function renderOrderSummary(chat) {
  const el = document.getElementById("chatOrderSummary");

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

/* RENDER MESSAGES */
function renderMessages(msgs) {
  const box = document.getElementById("chatMessages");

  box.innerHTML = msgs
    .map(
      m => `
      <div class="msg ${m.sender === CURRENT_CHAT.userEmail ? "me" : "them"}">
        ${m.content}<br>
        <small>${new Date(m.timestamp).toLocaleTimeString()}</small>
      </div>
    `
    )
    .join("");

  box.scrollTop = box.scrollHeight;
}

/* REFRESH */
async function refreshMessages() {
  const token = localStorage.getItem("authToken");
  if (!CURRENT_CHAT?._id) return;

  const res = await fetch(`${API}/chats/messages/${CURRENT_CHAT._id}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const msgs = await res.json();
  renderMessages(msgs);
}

/* SEND */
async function sendMessage() {
  const msg = document.getElementById("chatInput").value.trim();
  if (!msg || !CURRENT_CHAT?._id) return;

  document.getElementById("chatInput").value = "";

  const token = localStorage.getItem("authToken");

  await fetch(`${API}/chats/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      chatId: CURRENT_CHAT._id,
      content: msg
    })
  });

  refreshMessages();
}

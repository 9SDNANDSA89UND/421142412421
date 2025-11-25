async function loadChat() {
  const token = localStorage.getItem("authToken");

  // Not logged in → no chat
  if (!token) return;

  // Get auth user info (needed to check admin)
  const userRes = await fetch("https://website-5eml.onrender.com/auth/me", {
    headers: { Authorization: "Bearer " + token }
  });
  const user = await userRes.json();

  // If user is ADMIN → Always show chat button
  const ADMIN_EMAIL = "benjaminmorcombe@gmail.com";
  const isAdmin = user.email === ADMIN_EMAIL;

  // Fetch chat data
  const chatRes = await fetch("https://website-5eml.onrender.com/chats/my-chats", {
    headers: { Authorization: "Bearer " + token }
  });

  const chat = await chatRes.json();

  // Condition 1: Admin = always show
  // Condition 2: Buyer = show only if chat exists
  if (isAdmin || chat) {
    document.getElementById("chatButton").classList.remove("hidden");
  }

  if (!chat) return; // Chat doesn't exist yet → admin still sees empty chat

  window.USER_CHAT = chat;

  // ⭐ FIX #1 — REQUIRED: attach user email to USER_CHAT
  window.USER_CHAT.userEmail = user.email;

  // Order summary
  const order = chat.orderDetails;
  document.getElementById("chatOrderSummary").innerHTML = `
    <strong>Order ID:</strong> ${order.orderId}<br>
    <strong>Total:</strong> $${order.total} USD<br>
    <strong>Items:</strong><br>
    ${order.items.map(i => `• ${i.qty}× ${i.name}`).join("<br>")}
  `;
}

document.getElementById("chatButton").onclick = () => {
  document.getElementById("chatWindow").classList.toggle("hidden");
};

async function refreshMessages() {
  if (!window.USER_CHAT) return;

  const token = localStorage.getItem("authToken");

  const res = await fetch(
    `https://website-5eml.onrender.com/chats/messages/${window.USER_CHAT._id}`,
    { headers: { Authorization: "Bearer " + token } }
  );

  const msgs = await res.json();

  const box = document.getElementById("chatMessages");
  box.innerHTML = msgs
    .map(
      m => `
      <div class="msg ${
        m.sender === window.USER_CHAT.userEmail ? "me" : "them"
      }">
        ${m.content}<br>
        <small>${new Date(m.timestamp).toLocaleTimeString()}</small>
      </div>
    `
    )
    .join("");

  box.scrollTop = box.scrollHeight;
}

document.getElementById("chatSend").onclick = async () => {
  const msg = document.getElementById("chatInput").value;
  if (!msg) return;

  document.getElementById("chatInput").value = "";

  const token = localStorage.getItem("authToken");

  await fetch("https://website-5eml.onrender.com/chats/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      chatId: window.USER_CHAT._id,
      content: msg
    })
  });

  refreshMessages();
};

document.addEventListener("DOMContentLoaded", () => {
  loadChat();

  // ⭐ FIX #2 — Prevent errors before USER_CHAT is loaded
  setInterval(() => {
    if (window.USER_CHAT && window.USER_CHAT._id) {
      refreshMessages();
    }
  }, 2000);
});

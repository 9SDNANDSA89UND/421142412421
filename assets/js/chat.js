async function loadChat() {
  const token = localStorage.getItem("authToken");

  // Not logged in → no chat system at all
  if (!token) return;

  // Get logged-in user
  const userRes = await fetch("https://website-5eml.onrender.com/auth/me", {
    headers: { Authorization: "Bearer " + token }
  });

  // If token invalid → stop
  if (!userRes.ok) return;

  const user = await userRes.json();

  const ADMIN_EMAIL = "benjaminmorcombe@gmail.com";
  const isAdmin = user.email === ADMIN_EMAIL;

  // Get chat
  const chatRes = await fetch("https://website-5eml.onrender.com/chats/my-chats", {
    headers: { Authorization: "Bearer " + token }
  });

  // If unauthorized or server error → stop
  if (!chatRes.ok) {
    console.warn("Chat not available:", await chatRes.text());
    if (isAdmin) {
      // Admin sees chat bubble even with no active chat
      document.getElementById("chatButton").classList.remove("hidden");
    }
    return;
  }

  const chat = await chatRes.json();

  // Admin OR user with chat → show the button
  if (isAdmin || chat) {
    document.getElementById("chatButton").classList.remove("hidden");
  }

  // If no chat exists yet → stop (admin still sees empty window)
  if (!chat) return;

  // Save chat to global
  window.USER_CHAT = chat;
  window.USER_CHAT.userEmail = user.email;

  // Safety guard
  if (!chat.orderDetails) return;

  const order = chat.orderDetails;

  document.getElementById("chatOrderSummary").innerHTML = `
    <strong>Order ID:</strong> ${order.orderId}<br>
    <strong>Total:</strong> $${order.total} USD<br>
    <strong>Items:</strong><br>
    ${order.items.map(i => `• ${i.qty}× ${i.name}`).join("<br>")}
  `;
}

// Toggle chat window
document.getElementById("chatButton").onclick = () => {
  document.getElementById("chatWindow").classList.toggle("hidden");
};

async function refreshMessages() {
  // If no chat yet → don't try to load messages
  if (!window.USER_CHAT || !window.USER_CHAT._id) return;

  const token = localStorage.getItem("authToken");

  const res = await fetch(
    `https://website-5eml.onrender.com/chats/messages/${window.USER_CHAT._id}`,
    { headers: { Authorization: "Bearer " + token } }
  );

  if (!res.ok) return;

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
  const msg = document.getElementById("chatInput").value.trim();

  // No message → do nothing
  if (!msg) return;

  // No chat yet → user has not purchased anything
  if (!window.USER_CHAT || !window.USER_CHAT._id) {
    alert("Chat is not available. You must have an active order first.");
    return;
  }

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

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadChat();

  // Refresh only when chat actually exists
  setInterval(() => {
    if (window.USER_CHAT && window.USER_CHAT._id) {
      refreshMessages();
    }
  }, 2000);
});

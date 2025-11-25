async function loadChat() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  // Get user info
  const userRes = await fetch("https://website-5eml.onrender.com/auth/me", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!userRes.ok) return;
  const user = await userRes.json();

  const ADMIN_EMAIL = "benjaminmorcombe@gmail.com";
  const isAdmin = user.email === ADMIN_EMAIL;

  // Get chat from backend
  const chatRes = await fetch("https://website-5eml.onrender.com/chats/my-chats", {
    headers: { Authorization: "Bearer " + token }
  });

  let chat = null;
  if (chatRes.ok) {
    chat = await chatRes.json();
  }

  // ADMIN ALWAYS SEES CHAT BUTTON
  if (isAdmin) {
    document.getElementById("chatButton").classList.remove("hidden");

    // If admin has no chat yet → create a blank chat state
    if (!chat) {
      window.USER_CHAT = {
        _id: null,
        messages: [],
        userEmail: user.email,
        orderDetails: null
      };
      return;
    }
  }

  // Normal user → chat must exist
  if (!chat) return;

  // Store chat globally
  window.USER_CHAT = chat;
  window.USER_CHAT.userEmail = user.email;

  // If orderDetails missing, skip summary
  if (chat.orderDetails) {
    const order = chat.orderDetails;
    document.getElementById("chatOrderSummary").innerHTML = `
      <strong>Order ID:</strong> ${order.orderId}<br>
      <strong>Total:</strong> $${order.total} USD<br>
      <strong>Items:</strong><br>
      ${order.items.map(i => `• ${i.qty}× ${i.name}`).join("<br>")}
    `;
  }

  // Show chat button for users with a chat
  document.getElementById("chatButton").classList.remove("hidden");
}

// Toggle chat window
document.getElementById("chatButton").onclick = () => {
  document.getElementById("chatWindow").classList.toggle("hidden");
};

// Refresh messages safely
async function refreshMessages() {
  const chat = window.USER_CHAT;
  if (!chat) return;

  const token = localStorage.getItem("authToken");

  // ADMIN with no chatId → skip message loading
  if (!chat._id) return;

  const res = await fetch(
    `https://website-5eml.onrender.com/chats/messages/${chat._id}`,
    { headers: { Authorization: "Bearer " + token } }
  );

  if (!res.ok) return;
  const msgs = await res.json();

  const box = document.getElementById("chatMessages");
  box.innerHTML = msgs
    .map(
      m => `
        <div class="msg ${
          m.sender === chat.userEmail ? "me" : "them"
        }">
          ${m.content}<br>
          <small>${new Date(m.timestamp).toLocaleTimeString()}</small>
        </div>
      `
    )
    .join("");

  box.scrollTop = box.scrollHeight;
}

// Send message
document.getElementById("chatSend").onclick = async () => {
  const msg = document.getElementById("chatInput").value.trim();
  if (!msg) return;

  const chat = window.USER_CHAT;

  if (!chat) return;

  const ADMIN_EMAIL = "benjaminmorcombe@gmail.com";

  // Non-admin must have a chatId
  if (!chat._id && chat.userEmail !== ADMIN_EMAIL) {
    alert("Chat is not available. You must have an active order first.");
    return;
  }

  const token = localStorage.getItem("authToken");

  // ADMIN with no existing chat → cannot send
  if (!chat._id && chat.userEmail === ADMIN_EMAIL) {
    alert("No chat opened yet. Wait until a customer makes an order.");
    return;
  }

  // Clear input
  document.getElementById("chatInput").value = "";

  await fetch("https://website-5eml.onrender.com/chats/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      chatId: chat._id,
      content: msg
    })
  });

  refreshMessages();
};

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadChat();

  setInterval(() => {
    if (window.USER_CHAT && window.USER_CHAT._id) {
      refreshMessages();
    }
  }, 2000);
});

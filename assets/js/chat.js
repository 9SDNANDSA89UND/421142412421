let CURRENT_CHAT = null;
let IS_ADMIN = false;

const qs = (sel) => document.querySelector(sel);
const waitForElement = (id, cb) => {
  const el = document.getElementById(id);
  if (el) return cb(el);
  const obs = new MutationObserver(() => {
    const found = document.getElementById(id);
    if (found) {
      cb(found);
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
};

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  return await res.json();
}

/* ======================
   LOAD SESSION
====================== */
async function loadSession() {
  try {
    const session = await api("/auth/me");
    return session;
  } catch {
    return { loggedIn: false };
  }
}

/* ======================
   UNIVERSAL CHAT LOAD
====================== */
async function universalChatLoad() {
  waitForElement("chatButton", (btn) => {
    btn.classList.remove("hidden");
    btn.onclick = () => openUserChat();
  });
}

function openUserChat() {
  const win = qs("#chatWindow");
  win.classList.remove("hidden");
  document.getElementById("chatButton").classList.add("hidden");
}

/* ======================
   BIND USER CHAT BUTTON
====================== */
function bindChatButton() {
  waitForElement("chatButton", (btn) => {
    btn.onclick = () => {
      const win = qs("#chatWindow");
      win.classList.remove("hidden");
      btn.classList.add("hidden");
    };
  });
}

/* ======================
   BIND ADMIN CHAT PANEL TOGGLE
====================== */
function bindAdminToggle() {
  waitForElement("adminChatBtn", (btn) => {
    btn.classList.remove("hidden");

    btn.onclick = async () => {
      const panel = qs("#adminChatPanel");
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

/* ======================
   LOAD ALL ADMIN CHATS
====================== */
async function loadAdminChats() {
  const list = qs("#adminChatList");
  if (!list) return;

  const data = await api("/chats/admin/list");
  list.innerHTML = "";

  if (!data.chats || data.chats.length === 0) {
    list.innerHTML = `<div class="admin-chat-empty">No tickets</div>`;
    return;
  }

  data.chats.forEach((chat) => {
    const div = document.createElement("div");
    div.className = "admin-chat-item";
    div.innerHTML = `
      <div class="admin-chat-email">${chat.email}</div>
      <div class="admin-chat-id">ID: ${chat._id}</div>
    `;
    div.onclick = () => openAdminChat(chat._id);
    list.appendChild(div);
  });
}

/* ======================
   OPEN TICKET AS ADMIN
====================== */
async function openAdminChat(chatId) {
  CURRENT_CHAT = chatId;

  const chatData = await api(`/chats/${chatId}`);
  const msgBox = qs("#chatMessages");
  const win = qs("#chatWindow");

  msgBox.innerHTML = "";

  if (chatData.messages) {
    chatData.messages.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className = msg.fromAdmin ? "msg admin-msg" : "msg user-msg";
      bubble.innerText = msg.text;
      msgBox.appendChild(bubble);
    });
  }

  qs("#chatOrderSummary").innerHTML = `
      <div class="chat-ticket-title">Ticket ID: ${chatId}</div>
      <div class="chat-ticket-email">${chatData.email}</div>
  `;

  win.classList.remove("hidden");
  document.getElementById("chatButton").classList.add("hidden");
}

/* ======================
   SEND MESSAGE
====================== */
async function sendMessage() {
  const input = qs("#chatInput");
  const text = input.value.trim();
  if (!text || !CURRENT_CHAT) return;

  const res = await api(`/chats/${CURRENT_CHAT}/send`, "POST", {
    text,
    fromAdmin: IS_ADMIN,
  });

  if (res.success) {
    const msgBox = qs("#chatMessages");
    const bubble = document.createElement("div");
    bubble.className = IS_ADMIN ? "msg admin-msg" : "msg user-msg";
    bubble.innerText = text;
    msgBox.appendChild(bubble);

    input.value = "";
    msgBox.scrollTop = msgBox.scrollHeight;
  }
}

/* ======================
   ADMIN DELETE TICKET
====================== */
function enableAdminDelete() {
  waitForElement("deleteTicketBtn", (btn) => {
    btn.onclick = async () => {
      if (!CURRENT_CHAT) return;

      const res = await api(`/chats/${CURRENT_CHAT}/delete`, "DELETE");
      if (res.success) {
        qs("#chatMessages").innerHTML = "";
        qs("#chatOrderSummary").innerHTML = "";
        CURRENT_CHAT = null;
        await loadAdminChats();
      }
    };
  });
}


/* ======================
   ON PAGE LOAD
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  waitForElement("chatSend", (btn) => {
    btn.onclick = () => sendMessage();
  });

  await universalChatLoad();

  const session = await loadSession();

  if (session.loggedIn) {
    IS_ADMIN = session.admin === true;

    bindChatButton();

    if (IS_ADMIN) {
      bindAdminToggle();
      enableAdminDelete();
    }
  }
});

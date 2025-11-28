/* ============================================================
   TamedBlox — AUTH SYSTEM (FINAL PATCHED VERSION)
============================================================ */

window.API = window.API || "https://website-5eml.onrender.com";

/* ============================================================
   SAFE FALLBACKS (Fix Option A)
   Prevents "openModal is not defined" errors
============================================================ */
if (!window.openModal) {
  window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  };
}

if (!window.closeModal) {
  window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  };
}

/* ============================================================
   WAIT FOR NAVBAR BEFORE BINDING BUTTONS
   (PATCHED TO CHECK ALL REQUIRED BUTTONS)
============================================================ */
function waitForNavbar(callback) {
  const ready =
    document.getElementById("openLogin") &&
    document.getElementById("openSignup") &&
    document.getElementById("adminChatBtn");

  if (!ready) {
    return setTimeout(() => waitForNavbar(callback), 50);
  }

  callback();
}

/* ============================================================
   INITIALIZE AUTH LOGIC
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  waitForNavbar(() => {
    bindAuthButtons();
    applyLoggedInUI();
  });
});

/* ============================================================
   BIND LOGIN / SIGNUP BUTTONS
============================================================ */
function bindAuthButtons() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  if (loginBtn) loginBtn.onclick = () => openModal("loginModal");
  if (signupBtn) signupBtn.onclick = () => openModal("signupModal");

  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");

  if (loginSubmit) loginSubmit.onclick = loginUser;
  if (signupSubmit) signupSubmit.onclick = signupUser;
}

/* ============================================================
   LOGIN HANDLER
============================================================ */
async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  errorEl.innerText = "";

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!data.success) {
    errorEl.innerText = data.error || "Invalid email or password.";
    return;
  }

  // ⭐ Auto-login
  localStorage.setItem("authToken", data.token);

  closeModal("loginModal");
  location.reload();
}

/* ============================================================
   SIGNUP HANDLER (AUTO-LOGIN)
============================================================ */
async function signupUser() {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirm = document.getElementById("signupPasswordConfirm").value.trim();
  const errorEl = document.getElementById("signupError");

  errorEl.innerText = "";

  if (password !== confirm) {
    errorEl.innerText = "Passwords do not match.";
    return;
  }

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!data.success) {
    errorEl.innerText = data.error || "Signup failed.";
    return;
  }

  // ⭐ Auto-login FIXED (backend never returned token → we fetch one now)
  const loginReq = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginReq.json();

  if (loginData.success && loginData.token) {
    localStorage.setItem("authToken", loginData.token);
  }

  closeModal("signupModal");
  location.reload();
}

/* ============================================================
   UPDATE NAVBAR FOR LOGGED-IN USERS
============================================================ */
async function applyLoggedInUI() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  if (loginBtn) loginBtn.style.display = "none";
  if (signupBtn) signupBtn.style.display = "none";

  const navRight = document.querySelector(".nav-right");
  if (!navRight) return;

  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return; // token expired or invalid
  const user = await res.json();

  // ⭐ Display username
  const accountBtn = document.createElement("button");
  accountBtn.className = "nav-rect-btn";
  accountBtn.innerText = `👤 ${user.username}`;
  navRight.appendChild(accountBtn);

  // ⭐ Logout button
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "nav-rect-btn nav-accent-btn";
  logoutBtn.innerText = "Logout";
  logoutBtn.onclick = logoutUser;
  navRight.appendChild(logoutBtn);

  // ⭐ Admin Chat Button (PATCHED)
  const adminBtn = document.getElementById("adminChatBtn");
  if (user.admin === true && adminBtn) {
    adminBtn.style.display = "flex";

    // ⭐ PATCH: Open admin chat panel AND refresh chat list
    adminBtn.onclick = async () => {
      const panel = document.getElementById("adminChatPanel");
      panel.classList.toggle("hidden");

      const token = localStorage.getItem("authToken");
      if (typeof loadAdminChats === "function") {
        await loadAdminChats(token);
      }
    };
  }
}

/* ============================================================
   LOGOUT HANDLER
============================================================ */
function logoutUser() {
  localStorage.removeItem("authToken");
  location.reload();
}

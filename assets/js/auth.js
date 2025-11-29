/* ============================================================
   TamedBlox — AUTH SYSTEM (WITH PROFILE DROPDOWN SUPPORT)
============================================================ */

window.API = window.API || "https://website-5eml.onrender.com";

/* ============================================================
   SAFE FALLBACKS
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
============================================================ */
function waitForNavbar(callback) {
  const ready =
    document.getElementById("openLogin") &&
    document.getElementById("openSignup") &&
    document.getElementById("profileBtn");

  if (!ready) {
    return setTimeout(() => waitForNavbar(callback), 50);
  }

  callback();
}

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

  localStorage.setItem("authToken", data.token);
  closeModal("loginModal");
  location.reload();
}

/* ============================================================
   SIGNUP HANDLER
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

  if (!res.ok) return;

  const user = await res.json();

  /* SHOW PROFILE BUTTON */
  const profileBtn = document.getElementById("profileBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (profileBtn) profileBtn.style.display = "flex";
  if (logoutBtn) logoutBtn.style.display = "flex";

  // Update name with ▼ arrow
  document.getElementById("usernameDisplay").innerText = `${user.username} ▼`;

  /* ============================================================
     DROPDOWN TOGGLE
  ============================================================ */
  profileBtn.onclick = () => {
    const dd = document.getElementById("profileDropdown");
    dd.classList.toggle("hidden");
  };

  /* ============================================================
     ADMIN — CREATOR DASHBOARD BUTTON
  ============================================================ */
  const creatorBtn = document.getElementById("creatorDashboardBtn");

  if (user.admin === true) {
    creatorBtn.style.display = "block";
    creatorBtn.onclick = () => {
      location.href = "/dashboard.html";
    };
  }

  /* ============================================================
     ADMIN CHAT BUTTON
  ============================================================ */
  const adminBtn = document.getElementById("adminChatBtn");
  if (user.admin && adminBtn) {
    adminBtn.style.display = "flex";
  }
}

/* ============================================================
   LOGOUT
============================================================ */
function logoutUser() {
  localStorage.removeItem("authToken");
  location.reload();
}

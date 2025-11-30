window.API = window.API || "https://website-5eml.onrender.com";

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

function waitForNavbar(callback, retry = 0) {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileBtn = document.getElementById("profileBtn");
  const ready = loginBtn && signupBtn && logoutBtn && profileBtn;
  if (!ready) {
    if (retry > 100) return;
    return setTimeout(() => waitForNavbar(callback, retry + 1), 50);
  }
  callback();
}

document.addEventListener("DOMContentLoaded", () => {
  waitForNavbar(() => {
    bindAuthButtons();
    applyLoggedInUI();
    bindHamburgerToggle();
  });
});

function bindHamburgerToggle() {
  const btn = document.querySelector(".nav-toggle-label");
  const menu = document.querySelector(".nav-right");
  if (!btn || !menu) return;
  btn.onclick = () => {
    menu.classList.toggle("open");
  };
}

function bindAuthButtons() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");
  if (loginBtn) loginBtn.onclick = () => openModal("loginModal");
  if (signupBtn) signupBtn.onclick = () => openModal("signupModal");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");
  if (loginSubmit) loginSubmit.onclick = loginUser;
  if (signupSubmit) signupSubmit.onclick = signupUser;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = logoutUser;
}

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

async function applyLoggedInUI() {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");
  if (loginBtn) loginBtn.style.display = "none";
  if (signupBtn) signupBtn.style.display = "none";
  const profileBtn = document.getElementById("profileBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminChatBtn = document.getElementById("adminChatBtn");
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) return;
  const user = await res.json();
  if (profileBtn) profileBtn.style.display = "flex";
  if (logoutBtn) logoutBtn.style.display = "flex";
  const nameEl = document.getElementById("usernameDisplay");
  if (nameEl) nameEl.innerText = `${user.username} ▼`;
  profileBtn.onclick = () => {
    const dd = document.getElementById("profileDropdown");
    dd.classList.toggle("hidden");
  };
  const creatorBtn = document.getElementById("creatorDashboardBtn");
  if (user.admin === true) {
    if (creatorBtn) creatorBtn.style.display = "block";
    if (adminChatBtn) adminChatBtn.style.display = "flex";
    if (creatorBtn) creatorBtn.onclick = () => (location.href = "/dashboard.html");
  }
}

function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("HAS_PURCHASED");
  localStorage.removeItem("tamed_ref");
  location.reload();
}

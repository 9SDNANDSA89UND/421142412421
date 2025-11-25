/* =====================================
   AUTH HANDLERS (FRONTEND)
===================================== */

function initAuth() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  // Navbar loads dynamically, retry until present
  if (!loginBtn || !signupBtn) {
    return setTimeout(initAuth, 80);
  }

  /* ========= MODAL HELPERS ========= */
  window.openModal = (id) => {
    document.getElementById(id)?.classList.remove("hidden");
  };

  window.closeModal = (id) => {
    document.getElementById(id)?.classList.add("hidden");
  };

  /* ========= OPEN LOGIN MODAL ========= */
  loginBtn.onclick = () => openModal("loginModal");

  /* ========= OPEN SIGNUP MODAL ========= */
  signupBtn.onclick = () => openModal("signupModal");

  /* =====================================
       LOGIN SUBMIT
  ====================================== */
  document.getElementById("loginSubmit").onclick = async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    const res = await fetch("https://website-5eml.onrender.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      loginError.innerText = data.error || "Invalid email or password.";
      return;
    }

    localStorage.setItem("authToken", data.token);
    closeModal("loginModal");
    location.reload();
  };

  /* =====================================
       SIGNUP SUBMIT
  ====================================== */
  document.getElementById("signupSubmit").onclick = async () => {
    const username = signupUsername.value;
    const email = signupEmail.value;
    const password = signupPassword.value;
    const confirm = signupPasswordConfirm.value;

    const errorBox = signupError;

    if (password !== confirm) {
      errorBox.innerText = "Passwords do not match.";
      return;
    }

    const res = await fetch("https://website-5eml.onrender.com/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      // Duplicate email/username messages
      if (data.error === "Email already exists") {
        errorBox.innerText = "That email is already in use.";
      } else if (data.error === "Username already exists") {
        errorBox.innerText = "That username is already taken.";
      } else {
        errorBox.innerText = data.error || "Signup failed.";
      }
      return;
    }

    localStorage.setItem("authToken", data.token);
    closeModal("signupModal");
    location.reload();
  };

  /* =====================================
       NAVBAR WHEN LOGGED IN
  ====================================== */
  const token = localStorage.getItem("authToken");

  if (token) {
    const navRight = document.querySelector(".nav-right");
    if (navRight) {
      document.getElementById("openLogin")?.remove();
      document.getElementById("openSignup")?.remove();

      const accountBtn = document.createElement("button");
      accountBtn.className = "auth-btn";
      accountBtn.innerText = "Account";

      const logoutBtn = document.createElement("button");
      logoutBtn.className = "auth-btn";
      logoutBtn.innerText = "Logout";
      logoutBtn.onclick = () => {
        localStorage.removeItem("authToken");
        location.reload();
      };

      navRight.appendChild(accountBtn);
      navRight.appendChild(logoutBtn);
    }
  }

  console.log("Auth initialized.");
}

/* =====================================
   SVG EYE ICON TOGGLE (SHOW/HIDE PASSWORD)
===================================== */

document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-password");
  if (!toggle) return;

  const inputId = toggle.getAttribute("data-target");
  const input = document.getElementById(inputId);

  const eyeOpen = toggle.querySelector(".eye-open");
  const eyeClosed = toggle.querySelector(".eye-closed");

  // Swap type
  if (input.type === "password") {
    input.type = "text";
    eyeOpen.style.display = "none";
    eyeClosed.style.display = "block";
  } else {
    input.type = "password";
    eyeOpen.style.display = "block";
    eyeClosed.style.display = "none";
  }
});

/* Start auth once DOM loads */
document.addEventListener("DOMContentLoaded", initAuth);

/* =====================================
   AUTH HANDLERS (FRONTEND)
===================================== */

function initAuth() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  // If navbar not loaded yet → retry
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
  const loginSubmit = document.getElementById("loginSubmit");

  loginSubmit.onclick = async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("https://website-5eml.onrender.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      document.getElementById("loginError").innerText =
        data.error || "Invalid email or password.";
      return;
    }

    localStorage.setItem("authToken", data.token);
    closeModal("loginModal");
    location.reload();
  };

  /* =====================================
       SIGNUP SUBMIT
  ====================================== */
  const signupSubmit = document.getElementById("signupSubmit");

  signupSubmit.onclick = async () => {
    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupPasswordConfirm").value;

    const errorBox = document.getElementById("signupError");

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

    // Handle duplicate errors
    if (!data.success) {
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
       UPDATE NAVBAR WHEN LOGGED IN
  ====================================== */
  const token = localStorage.getItem("authToken");

  if (token) {
    const navRight = document.querySelector(".nav-right");

    if (navRight) {
      // Remove login/signup buttons
      document.getElementById("openLogin")?.remove();
      document.getElementById("openSignup")?.remove();

      // ACCOUNT button
      const accountBtn = document.createElement("button");
      accountBtn.className = "auth-btn";
      accountBtn.innerText = "Account";

      // LOGOUT BUTTON
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

/* Start auth once DOM loads */
document.addEventListener("DOMContentLoaded", initAuth);

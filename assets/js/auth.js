/* =========================================
   AUTH HANDLERS (FRONTEND ONLY)
========================================= */

function initAuth() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  // Navbar not loaded yet → try again
  if (!loginBtn || !signupBtn) {
    return setTimeout(initAuth, 50);
  }

  // OPEN / CLOSE MODALS
  window.openModal = id => {
    document.getElementById(id)?.classList.remove("hidden");
  };

  window.closeModal = id => {
    document.getElementById(id)?.classList.add("hidden");
  };

  loginBtn.addEventListener("click", () => openModal("loginModal"));
  signupBtn.addEventListener("click", () => openModal("signupModal"));

  /* -------------------------
     LOGIN SUBMIT
  ------------------------- */
  const loginSubmit = document.getElementById("loginSubmit");
  if (loginSubmit) {
    loginSubmit.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      const res = await fetch("https://website-5eml.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        document.getElementById("loginError").innerText = data.error || "Login failed.";
        return;
      }

      localStorage.setItem("authToken", data.token);
      closeModal("loginModal");
      location.reload();
    });
  }

  /* -------------------------
     SIGNUP SUBMIT
  ------------------------- */
  const signupSubmit = document.getElementById("signupSubmit");
  if (signupSubmit) {
    signupSubmit.addEventListener("click", async () => {
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      const res = await fetch("https://website-5eml.onrender.com/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!data.success) {
        document.getElementById("signupError").innerText = data.error || "Signup failed.";
        return;
      }

      localStorage.setItem("authToken", data.token);
      closeModal("signupModal");
      location.reload();
    });
  }

  /* -------------------------
     UPDATE NAVBAR WHEN LOGGED IN
  ------------------------- */
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

// Start once DOM loads
document.addEventListener("DOMContentLoaded", initAuth);

function initAuth() {
  const loginBtn = document.getElementById("openLogin");
  const signupBtn = document.getElementById("openSignup");

  // Navbar not loaded yet → try until it loads
  if (!loginBtn || !signupBtn) {
    return setTimeout(initAuth, 80);
  }

  // Modal helpers
  window.openModal = id => {
    document.getElementById(id)?.classList.remove("hidden");
  };

  window.closeModal = id => {
    document.getElementById(id)?.classList.add("hidden");
  };

  // Open login modal
  loginBtn.onclick = () => openModal("loginModal");

  // Open signup modal
  signupBtn.onclick = () => openModal("signupModal");

  /* -----------------------------------
        LOGIN SUBMIT
  ------------------------------------ */
  document.getElementById("loginSubmit").onclick = async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("https://website-5eml.onrender.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      document.getElementById("loginError").innerText =
        data.error || "Login failed.";
      return;
    }

    localStorage.setItem("authToken", data.token);
    closeModal("loginModal");
    location.reload();
  };

  /* -----------------------------------
        SIGNUP SUBMIT
  ------------------------------------ */
  document.getElementById("signupSubmit").onclick = async () => {
    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupPasswordConfirm").value;

    if (password !== confirm) {
      document.getElementById("signupError").innerText = "Passwords do not match.";
      return;
    }

    const res = await fetch("https://website-5eml.onrender.com/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!data.success) {
      document.getElementById("signupError").innerText =
        data.error || "Signup failed.";
      return;
    }

    localStorage.setItem("authToken", data.token);
    closeModal("signupModal");
    location.reload();
  };

  /* -----------------------------------
        UPDATE NAVBAR WHEN LOGGED IN
  ------------------------------------ */
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

// Start when DOM is ready
document.addEventListener("DOMContentLoaded", initAuth);

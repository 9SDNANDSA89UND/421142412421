document.addEventListener("DOMContentLoaded", () => {

/* ============================
   PRODUCT LIST
============================ */
const products = [
  {
    name: "Mystic Blade",
    rarity: "God",
    price: 12.99,
    oldPrice: 19.99,
    image: "https://via.placeholder.com/300"
  },
  {
    name: "Shadow Cloak",
    rarity: "Secret",
    price: 8.49,
    oldPrice: 12.0,
    image: "https://via.placeholder.com/300"
  },
  {
    name: "OG Emblem",
    rarity: "OG",
    price: 4.2,
    oldPrice: null,
    image: "https://via.placeholder.com/300"
  }
];

/* ============================
   DISCOUNT CALCULATION
============================ */
function getDiscountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function getDiscountClass(percent) {
  if (percent > 90) return "discount-red";
  if (percent > 50) return "discount-orange";
  if (percent > 20) return "discount-yellow";
  return "discount-green";
}

/* ============================
   TOAST NOTIFICATIONS
============================ */
let toastContainer = document.querySelector(".toast-container");
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 20);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ============================
   CART SYSTEM
============================ */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDrawer();
  updateCartDot();
}

window.addToCart = function(name) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  let existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
  }

  saveCart();
  showToast(`${product.name} added to cart`);
}

function updateCartDot() {
  const dot = document.getElementById("cartDot");
  if (!dot) return;
  dot.style.display = cart.length > 0 ? "block" : "none";
}

window.changeQty = function(name, amount) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty += amount;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveCart();
}

window.removeItem = function(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
}

/* ============================
   RENDER CART DRAWER
============================ */
function updateCartDrawer() {
  const drawer = document.getElementById("drawerContent");
  if (!drawer) return;

  if (cart.length === 0) {
    drawer.innerHTML = `<p style="color:#9ca4b1;">Your cart is empty.</p>`;
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    html += `
      <div style="margin-bottom:22px;">
        <div style="font-weight:700; font-size:16px;">${item.name}</div>
        <div style="color:#4ef58a; font-size:17px; font-weight:900;">£${item.price}</div>

        <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
          <button class="qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
          <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
          <button class="qty-btn remove" onclick="removeItem('${item.name}')">×</button>
        </div>

        <div style="margin-top:6px; font-size:14px; color:#9ca4b1;">
          Quantity: ${item.qty}
        </div>
      </div>
    `;
  });

  html += `
    <hr style="border-color:rgba(255,255,255,0.1);margin:18px 0;">
    <div style="font-size:20px;font-weight:900;color:#4ef58a;margin-bottom:12px;">
      Total: £${total.toFixed(2)}
    </div>
    <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
  `;

  drawer.innerHTML = html;
}

window.goToCheckout = function() {
  window.location.href = "checkout.html";
}

/* ============================
   RENDER PRODUCTS
============================ */
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(p => {
    const discountPercent = getDiscountPercent(p.price, p.oldPrice);

    const discountHTML = discountPercent
      ? `<span class="discount-tag ${getDiscountClass(discountPercent)}">-${discountPercent}%</span>`
      : "";

    const rarityClass = `tag-${p.rarity.toLowerCase()}`;

    grid.innerHTML += `
      <div class="card">

        <div class="card-badges">
          <span class="tag ${rarityClass}">${p.rarity}</span>
          ${discountHTML}
        </div>

        <img src="${p.image}" alt="${p.name}">

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">£${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">£${p.oldPrice}</span>` : ""}
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}')">Add to Cart</button>

      </div>
    `;
  });
}

/* ============================
   SEARCH FILTER
============================ */
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(value));
  renderProducts(filtered);
});

/* ============================
   AUTH MODALS
============================ */
window.openModal = function(id) {
  document.getElementById(id)?.classList.remove("hidden");
}
window.closeModal = function(id) {
  document.getElementById(id)?.classList.add("hidden");
}

document.getElementById("openLogin")?.addEventListener("click", () =>
  openModal("loginModal")
);
document.getElementById("openSignup")?.addEventListener("click", () =>
  openModal("signupModal")
);

/* ============================
   VALIDATION + SIGNUP + LOGIN
============================ */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordStrengthLevel(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

async function checkUsernameExists(username) {
  const res = await fetch(
    "https://website-5eml.onrender.com/auth/check-username?u=" + username
  );
  const data = await res.json();
  return data.exists;
}

let canSubmitSignup = {
  username: false,
  email: false,
  password: false,
  match: false,
  captcha: false
};

function updateSignupButton() {
  const btn = document.getElementById("signupSubmit");
  btn.disabled = !(
    canSubmitSignup.username &&
    canSubmitSignup.email &&
    canSubmitSignup.password &&
    canSubmitSignup.match &&
    canSubmitSignup.captcha
  );
}

/* CAPTCHA */
function generateCaptcha() {
  const text = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById("captchaText").innerText = text;
  return text;
}

let captchaValue = generateCaptcha();

document.getElementById("refreshCaptcha")?.addEventListener("click", () => {
  captchaValue = generateCaptcha();
});

document.getElementById("captchaInput")?.addEventListener("input", (e) => {
  const msg = document.getElementById("captchaCheck");

  if (e.target.value.toUpperCase() === captchaValue) {
    msg.innerText = "CAPTCHA matched ✓";
    msg.className = "modal-hint valid";
    canSubmitSignup.captcha = true;
  } else {
    msg.innerText = "CAPTCHA incorrect";
    msg.className = "modal-hint invalid";
    canSubmitSignup.captcha = false;
  }

  updateSignupButton();
});

/* USERNAME SUGGESTIONS */
function generateSuggestions(base) {
  return [
    base + Math.floor(Math.random() * 90 + 10),
    base + Math.floor(Math.random() * 900 + 100),
    base + "_official",
    base + "_yt",
    base + "_rbx",
    base + "_store"
  ];
}

async function showSuggestions(base) {
  const box = document.getElementById("usernameSuggestions");
  box.innerHTML = "";

  const names = generateSuggestions(base);

  names.forEach(name => {
    const el = document.createElement("span");
    el.innerText = name;
    el.onclick = () => {
      signupUsername.value = name;
      document.getElementById("usernameCheck").innerText = "Username available ✓";
      document.getElementById("usernameCheck").className = "modal-hint valid";
      canSubmitSignup.username = true;
      box.classList.add("hidden");
      updateSignupButton();
    };
    box.appendChild(el);
  });

  box.classList.remove("hidden");
}

document.getElementById("signupUsername")?.addEventListener("input", async (e) => {
  const username = e.target.value.trim();
  const msg = document.getElementById("usernameCheck");
  const box = document.getElementById("usernameSuggestions");

  if (username.length < 3) {
    msg.innerText = "Username too short";
    msg.className = "modal-hint invalid";
    canSubmitSignup.username = false;
    box.classList.add("hidden");
    return updateSignupButton();
  }

  const exists = await checkUsernameExists(username);

  if (exists) {
    msg.innerText = "Username already taken";
    msg.className = "modal-hint invalid";
    canSubmitSignup.username = false;

    showSuggestions(username.replace(/[^a-zA-Z0-9]/g, ""));
  } else {
    msg.innerText = "Username available ✓";
    msg.className = "modal-hint valid";
    canSubmitSignup.username = true;
    box.classList.add("hidden");
  }

  updateSignupButton();
});

/* EMAIL CHECK */
document.getElementById("signupEmail")?.addEventListener("input", (e) => {
  const email = e.target.value.trim();
  const msg = document.getElementById("emailCheck");

  if (validateEmail(email)) {
    msg.innerText = "Valid email ✓";
    msg.className = "modal-hint valid";
    canSubmitSignup.email = true;
  } else {
    msg.innerText = "Invalid email";
    msg.className = "modal-hint invalid";
    canSubmitSignup.email = false;
  }

  updateSignupButton();
});

/* PASSWORD STRENGTH */
document.getElementById("signupPassword")?.addEventListener("input", (e) => {
  const pw = e.target.value;
  const msg = document.getElementById("passwordStrength");

  const strength = passwordStrengthLevel(pw);
  const levels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const colors = ["invalid", "invalid", "invalid", "valid", "valid"];

  msg.innerText = "Strength: " + levels[strength];
  msg.className = "modal-hint " + colors[strength];

  canSubmitSignup.password = strength >= 2;
  updateSignupButton();
});

/* PASSWORD MATCH */
document.getElementById("signupPasswordConfirm")?.addEventListener("input", (e) => {
  const pw = signupPassword.value;
  const confirm = e.target.value;
  const msg = document.getElementById("passwordMatch");

  if (confirm === pw && pw.length > 0) {
    msg.innerText = "Passwords match ✓";
    msg.className = "modal-hint valid";
    canSubmitSignup.match = true;
  } else {
    msg.innerText = "Passwords do not match";
    msg.className = "modal-hint invalid";
    canSubmitSignup.match = false;
  }

  updateSignupButton();
});

/* SIGNUP */
document.getElementById("signupSubmit")?.addEventListener("click", async () => {
  const username = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  const res = await fetch("https://website-5eml.onrender.com/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!data.success) {
    signupError.innerText = data.error;
    return;
  }

  localStorage.setItem("authToken", data.token);
  closeModal("signupModal");
  location.reload();
});

/* LOGIN */
document.getElementById("loginSubmit")?.addEventListener("click", async () => {
  const email = loginEmail.value;
  const password = loginPassword.value;

  const res = await fetch("https://website-5eml.onrender.com/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!data.success) {
    loginError.innerText = data.error;
    return;
  }

  localStorage.setItem("authToken", data.token);
  closeModal("loginModal");
  location.reload();
});

/* ============================
   UPDATE NAV WHEN LOGGED IN
============================ */
async function refreshAuthUI() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const res = await fetch("https://website-5eml.onrender.com/auth/me", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const user = await res.json();

  document.getElementById("openLogin").style.display = "none";
  document.getElementById("openSignup").style.display = "none";

  const navRight = document.querySelector(".nav-right");

  const accountBtn = document.createElement("button");
  accountBtn.className = "auth-btn";
  accountBtn.innerText = user.username || "Account";

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "auth-btn";
  logoutBtn.innerText = "Logout";
  logoutBtn.onclick = () => {
    localStorage.removeItem("authToken");
    location.reload();
  };

  navRight.prepend(logoutBtn);
  navRight.prepend(accountBtn);
}

/* ============================
   INITIALIZE EVERYTHING
============================ */
function init() {
  renderProducts(products);
  updateCartDrawer();
  updateCartDot();
  refreshAuthUI();
}

init();

}); // DOMContentLoaded END

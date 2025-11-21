/* ===============================
   PRODUCT DATA (FRONTEND ONLY)
   Used for UI display, NOT for pricing
=============================== */
const products = [
  {
    name: "Mystic Blade",
    rarity: "God",
    price: 12.99,
    oldPrice: 19.99,
    stock: 3,
    image: "https://via.placeholder.com/300x200"
  },
  {
    name: "Shadow Cloak",
    rarity: "Secret",
    price: 8.49,
    oldPrice: 12.0,
    stock: 5,
    image: "https://via.placeholder.com/300x200"
  },
  {
    name: "OG Emblem",
    rarity: "OG",
    price: 4.2,
    stock: 9,
    image: "https://via.placeholder.com/300x200"
  }
];

/* ===============================
   NEW STACKING TOAST NOTIFICATIONS
=============================== */

// Create container once:
let toastContainer = document.querySelector(".toast-container");
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // enter animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  // auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

/* ===============================
   CART SYSTEM
=============================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDrawer();
  updateCartDot();
}

function addToCart(productName) {
  const item = products.find(p => p.name === productName);
  if (!item) return;

  const existing = cart.find(c => c.name === item.name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: item.name,
      price: item.price,
      qty: 1
    });
  }

  saveCart();
  showToast(`${item.name} added to cart`);
}

/* ===============================
   CART NOTIFICATION DOT
=============================== */
function updateCartDot() {
  const cartDot = document.getElementById("cartDot");
  if (!cartDot) return;

  if (cart.length > 0) {
    cartDot.style.display = "block";
    cartDot.classList.add("show");
    setTimeout(() => cartDot.classList.remove("show"), 250);
  } else {
    cartDot.style.display = "none";
  }
}

/* ===============================
   UPDATE CART DRAWER (WITHOUT QTY DISPLAY)
=============================== */
function updateCartDrawer() {
  const drawerContent = document.getElementById("drawerContent");

  if (cart.length === 0) {
    drawerContent.innerHTML = `<p style="color:#8b92a1;">Your cart is empty.</p>`;
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    html += `
      <div style="display:flex;align-items:center;margin-bottom:18px;gap:12px;">
        <div style="flex:1;">
          <div style="font-weight:600;">${item.name}</div>
          <div style="color:#4ef58a;font-weight:700;">£${item.price}</div>
        </div>
      </div>
    `;
  });

  html += `
    <hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">
    <div style="font-size:18px;font-weight:700;color:#4ef58a;margin-bottom:12px;">
      Total: £${total.toFixed(2)}
    </div>

    <button class="checkout-btn" onclick="goToCheckout()">
      Proceed to Checkout
    </button>
  `;

  drawerContent.innerHTML = html;
}

/* ===============================
   CHECKOUT REDIRECT
=============================== */
function goToCheckout() {
  window.location.href = "checkout.html";
}

/* ===============================
   RENDER PRODUCTS
=============================== */
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "card scroll-fade";
    card.setAttribute("data-rarity", product.rarity.toLowerCase());

    card.innerHTML = `
      <span class="tag">${product.rarity}</span>
      <img src="${product.image}" />
      <h3>${product.name}</h3>
      <p>Instant delivery • Trusted seller</p>
      <div class="price-box">
        <span class="price">£${product.price}</span>
        ${product.oldPrice ? `<span class="old-price">£${product.oldPrice}</span>` : ""}
      </div>
      <div class="stock">${product.stock} left</div>
      <button class="buy-btn" data-name="${product.name}">Buy</button>
    `;

    grid.appendChild(card);
  });

  document.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-name"));
    });
  });

  setTimeout(() => {
    document.querySelectorAll(".scroll-fade").forEach(el =>
      el.classList.add("visible")
    );
  }, 80);
}

renderProducts(products);

/* FILTER SYSTEM */
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const f = btn.textContent.toLowerCase();
    renderProducts(f === "all" ? products : products.filter(p => p.rarity.toLowerCase() === f));
  });
});

/* Load cart + dot on startup */
updateCartDrawer();
updateCartDot();

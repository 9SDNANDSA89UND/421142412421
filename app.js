/* ============================
   PRODUCT LIST (front-end only)
============================ */
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

/* ============================
   NEW STACKING TOAST SYSTEM
============================ */
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

  setTimeout(() => {
    toast.classList.add("show");
  }, 20);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

function addToCart(name) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      qty: 1
    });
  }

  saveCart();
  showToast(`${product.name} added to cart`);
}

/* ============================
   CART DOT
============================ */
function updateCartDot() {
  const dot = document.getElementById("cartDot");
  if (!dot) return;

  if (cart.length > 0) {
    dot.style.display = "block";
    dot.classList.add("show");
    setTimeout(() => dot.classList.remove("show"), 200);
  } else {
    dot.style.display = "none";
  }
}

/* ============================
   CART DRAWER FUNCTIONS
============================ */
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("show");
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("show");
}

function updateCartDrawer() {
  const drawer = document.getElementById("drawerContent");

  if (cart.length === 0) {
    drawer.innerHTML = `<p style="color:#8b92a1;">Your cart is empty.</p>`;
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    html += `
      <div style="margin-bottom:18px;">
        <div style="font-weight:600; margin-bottom:3px">${item.name}</div>
        <div style="color:#4ef58a; font-weight:700">£${item.price}</div>

        <div style="margin-top:8px; display:flex; gap:8px;">
          <button class="qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
          <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
          <button class="qty-btn" style="background:#ff4747;color:white;" onclick="removeItem('${item.name}')">×</button>
        </div>
      </div>
    `;
  });

  html += `
    <hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">
    <div style="font-size:18px;font-weight:700;color:#4ef58a;margin-bottom:12px;">
      Total: £${total.toFixed(2)}
    </div>
    <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
  `;

  drawer.innerHTML = html;
}

function changeQty(name, amount) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveCart();
}

function removeItem(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
}

/* ============================
   CHECKOUT
============================ */
function goToCheckout() {
  window.location.href = "checkout.html";
}

/* ============================
   RENDER PRODUCTS
============================ */
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "card scroll-fade";

    card.innerHTML = `
      <span class="tag">${product.rarity}</span>
      <img src="${product.image}">
      <h3>${product.name}</h3>
      <p>Instant delivery • Trusted seller</p>
      <div class="price-box">
        <span class="price">£${product.price}</span>
        ${product.oldPrice ? `<span class="old-price">£${product.oldPrice}</span>` : ""}
      </div>
      <div class="stock">${product.stock} left</div>
      <button class="buy-btn" onclick="addToCart('${product.name}')">Buy</button>
    `;

    grid.appendChild(card);
  });

  setTimeout(() => {
    document.querySelectorAll(".scroll-fade").forEach(el => {
      el.classList.add("visible");
    });
  }, 100);
}

/* ============================
   FILTERS
============================ */
document.querySelectorAll(".filter")?.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const f = btn.textContent.toLowerCase();
    renderProducts(f === "all" ? products : products.filter(p => p.rarity.toLowerCase() === f));
  });
});

/* ============================
   INITIAL LOAD
============================ */
renderProducts(products);
updateCartDrawer();
updateCartDot();

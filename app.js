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

function addToCart(name) {
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
   RENDER CART DRAWER
============================ */
function updateCartDrawer() {
  const drawer = document.getElementById("drawerContent");

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

function goToCheckout() {
  window.location.href = "checkout.html";
}

/* ============================
   RENDER PRODUCT CARDS
============================ */
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
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
   INITIALIZE
============================ */
renderProducts(products);
updateCartDrawer();
updateCartDot();

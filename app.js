/* ===============================
   PRODUCT DATA
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
   CART SYSTEM
=============================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDrawer();
}

/* Add item OR increase qty */
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
      image: item.image,
      qty: 1
    });
  }

  saveCart();
  showToast(`${item.name} added to cart`);
  animateAdd(productName);
}

/* Quantity buttons */
function increaseQty(name) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty++;
  saveCart();
}

function decreaseQty(name) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty--;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveCart();
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
   TOAST NOTIFICATION
=============================== */
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 30);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/* ===============================
   CARD PULSE ANIMATION
=============================== */
function animateAdd(productName) {
  document.querySelectorAll(".card h3").forEach(h3 => {
    if (h3.innerText === productName) {
      const card = h3.closest(".card");
      card.classList.add("pulse");
      setTimeout(() => card.classList.remove("pulse"), 500);
    }
  });
}

/* ===============================
   CHECKOUT BUTTON
=============================== */
function goToCheckout() {
  if (cart.length === 0) return;
  window.location.href = "checkout.html";  // ← Change this if needed
}

/* ===============================
   CART DRAWER CONTENT
=============================== */
function updateCartDrawer() {
  const drawerContent = document.getElementById("drawerContent");

  updateCartDot();

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
        <img src="${item.image}" style="width:60px;height:60px;border-radius:6px;object-fit:contain;">
        
        <div style="flex:1;">
          <div style="font-weight:600;">${item.name}</div>
          <div style="color:#4ef58a;font-weight:700;">£${item.price}</div>

          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <button class="qty-btn" onclick="decreaseQty('${item.name}')">−</button>
            <span style="font-size:16px;">${item.qty}</span>
            <button class="qty-btn" onclick="increaseQty('${item.name}')">+</button>
          </div>
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

/* Load cart on startup */
updateCartDrawer();

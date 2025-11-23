/* =====================================================
   USD-ONLY PRICE SYSTEM — FINAL VERSION
   Backend returns GBP -> we always convert to USD.
===================================================== */

/* USD conversion rate (GBP -> USD) */
const USD_RATE = 1.27;

/* Convert GBP -> USD */
function toUSD(amountGBP) {
  return (amountGBP * USD_RATE).toFixed(2);
}

/* Format as USD */
function formatUSD(amountGBP) {
  const converted = amountGBP * USD_RATE;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(converted);
}

/* =====================================================
   PRODUCT LOADING
===================================================== */

let products = [];

async function loadProducts() {
  try {
    const res = await fetch("https://website-5eml.onrender.com/products");
    products = await res.json();

    products.forEach(p => {
      p.price = Number(p.price);
      if (p.oldPrice) p.oldPrice = Number(p.oldPrice);
    });

    renderProducts(products);

  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }
}

/* =====================================================
   PRODUCT RENDERING (USD ONLY)
===================================================== */

function getDiscountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(p => {
    const discount = getDiscountPercent(p.price, p.oldPrice);

    grid.innerHTML += `
      <div class="card">

        <div class="card-badges">
          <span class="tag tag-${(p.rarity || "Secret").toLowerCase()}">${p.rarity || "Secret"}</span>
          ${discount ? `<span class="discount-tag">${discount}% OFF</span>` : ""}
        </div>

        <img src="${p.image}" class="product-img">

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">${formatUSD(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${formatUSD(p.oldPrice)}</span>` : ""}
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}', this)">
          Add to Cart
        </button>

      </div>
    `;
  });

  initCardTilt();
}

/* =====================================================
   SEARCH
===================================================== */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
  });
}

/* =====================================================
   CART
===================================================== */

function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  const img = btn.closest(".card").querySelector(".product-img");

  // Convert price to USD BEFORE sending to cart
  const usdProduct = {
    ...product,
    price: Number(toUSD(product.price)),
    oldPrice: product.oldPrice ? Number(toUSD(product.oldPrice)) : null
  };

  window.Cart.addItem(usdProduct, img);
}

/* =====================================================
   CARD TILT
===================================================== */

function initCardTilt() {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      const rx = ((y - r.height / 2) / (r.height / 2)) * -10;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 10;

      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
    });
  });
}

/* =====================================================
   MAIN INITIALIZER
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  setupSearch();

  if (window.Cart && window.Cart.init) {
    window.Cart.init();
  }
});

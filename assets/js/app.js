/* =====================================================
   TamedBlox — USD-ONLY PRICE SYSTEM
   No currency selector. No conversion.
   Simply display all prices as USD labels.
===================================================== */

/* Format product numbers as USD strings */
function formatUSD(amount) {
  return `$${Number(amount).toFixed(2)} USD`;
}

/* =====================================================
   LOAD PRODUCTS (BACKEND RETURNS GBP NUMBERS)
===================================================== */

let products = [];

async function loadProducts() {
  try {
    const res = await fetch("https://website-5eml.onrender.com/products");
    products = await res.json();

    // Ensure numeric fields
    products.forEach(p => {
      p.price = Number(p.price);
      p.oldPrice = p.oldPrice ? Number(p.oldPrice) : null;
    });

    renderProducts(products);

  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }
}

/* =====================================================
   PRODUCT RENDERING (USD DISPLAY ONLY)
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
          <span class="tag tag-${(p.rarity || "Secret").toLowerCase()}">
            ${p.rarity || "Secret"}
          </span>
          ${discount ? `<span class="discount-tag">${discount}% OFF</span>` : ""}
        </div>

        <img src="${p.image}" class="product-img" />

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
   SEARCH BAR
===================================================== */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(q));
    renderProducts(filtered);
  });
}

/* =====================================================
   ADD TO CART (USD VALUES)
===================================================== */

function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  const img = btn.closest(".card").querySelector(".product-img");

  // Store values as USD numbers (not strings)
  const usdProduct = {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  };

  window.Cart.addItem(usdProduct, img);
}

/* =====================================================
   CARD TILT EFFECT
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

      card.style.transform =
        `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
    });
  });
}

/* =====================================================
   INITIALIZER
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  setupSearch();

  if (window.Cart && window.Cart.init) {
    window.Cart.init();
  }
});

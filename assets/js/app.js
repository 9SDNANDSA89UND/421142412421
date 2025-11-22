/* =========================================
   PRODUCT DATA
========================================= */

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

/* =========================================
   DISCOUNT SYSTEM
========================================= */

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

/* =========================================
   🚫 REMOVED TOAST SYSTEM
   (No more "Added to cart" notifications)
========================================= */

/* =========================================
   PRODUCT RENDERING
========================================= */

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(p => {
    const discountPercent = getDiscountPercent(p.price, p.oldPrice);
    const rarityClass = `tag-${p.rarity.toLowerCase()}`;

    const discountHTML = discountPercent
      ? `<span class="discount-tag ${getDiscountClass(discountPercent)}">-${discountPercent}%</span>`
      : "";

    grid.innerHTML += `
      <div class="card">
        <div class="card-badges">
          <span class="tag ${rarityClass}">${p.rarity}</span>
          ${discountHTML}
        </div>

        <img src="${p.image}" alt="${p.name}" class="product-img">
        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">£${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">£${p.oldPrice}</span>` : ""}
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}', this)">
          Add to Cart
        </button>
      </div>
    `;
  });
}

/* =========================================
   SEARCH BAR
========================================= */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const value = input.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(value));
    renderProducts(filtered);
  });
}

/* =========================================
   CART SYSTEM (fly animation)
========================================= */

function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const card = btn.closest(".card");
  const img = card.querySelector(".product-img");

  // ⭐ Fly animation + add item
  window.Cart.addItem(product, img);
}

/* =========================================
   INITIALIZER
========================================= */

function initApp() {
  renderProducts(products);
  setupSearch();

  if (window.Cart && window.Cart.init) {
    window.Cart.init();
  }
}

document.addEventListener("DOMContentLoaded", initApp);

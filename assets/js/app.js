/* =========================================
   MANUAL PRODUCT LIST (NO RANDOMIZATION)
========================================= */

const products = [
  {
    name: "La Grande Combinasion ($10M/s)",
    rarity: "Secret",
    price: 10.30,
    oldPrice: 13.38, // 23% discount
    image: "https://i.postimg.cc/tCT9T6xC/Carti.webp"
  }

  // ⭐ Add more real products below manually
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
   PRODUCT RENDERING
========================================= */

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach(p => {
    const percent = getDiscountPercent(p.price, p.oldPrice);
    const rarityClass = `tag-${p.rarity.toLowerCase()}`;

    grid.innerHTML += `
      <div class="card">

        <div class="card-badges">
          <span class="tag ${rarityClass}">${p.rarity}</span>

          ${
            p.oldPrice
              ? `
            <span class="discount-tag ${getDiscountClass(percent)}">
              <svg xmlns="http://www.w3.org/2000/svg"
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41 11 3.82a2 2 0 0 0-1.41-.59H3v6.59a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l4.59-4.59a2 2 0 0 0 0-2.82Z"/>
                <circle cx="7.5" cy="7.5" r="1.5"/>
              </svg>
              ${percent}% Discount
            </span>
            `
              : ""
          }
        </div>

        <img src="${p.image}" alt="${p.name}" class="product-img">

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">£${p.price}</span>
          ${
            p.oldPrice
              ? `<span class="old-price">£${p.oldPrice}</span>`
              : ""
          }
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}', this)">
          <svg xmlns="http://www.w3.org/2000/svg" 
            class="btn-cart-icon" width="16" height="16" 
            viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
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
    const q = input.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q)
    );
    renderProducts(filtered);
  });
}

/* =========================================
   CART SYSTEM — FLY ANIMATION
========================================= */

function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const card = btn.closest(".card");
  const img = card.querySelector(".product-img");

  window.Cart.addItem(product, img);
}

/* =========================================
   INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  setupSearch();

  if (window.Cart && window.Cart.init) {
    window.Cart.init();
  }
});

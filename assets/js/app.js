/* ============================================================
   PRODUCT LIST
============================================================ */

const products = [
  {
    name: "La Grande Combinasion ($10M/s)",
    rarity: "Secret",
    price: 10.30,
    oldPrice: 13.38,
    image: "https://i.postimg.cc/tCT9T6xC/Carti.webp"
  }
];

/* ============================================================
   DISCOUNT SYSTEM
============================================================ */
function getDiscountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/* ============================================================
   PRODUCT RENDERING
============================================================ */

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

          <!-- RARITY BADGE -->
          <span class="tag ${rarityClass}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7l9-4 9 4-9 4-9-4z" />
              <path d="M3 17l9 4 9-4" />
              <path d="M3 12l9 4 9-4" />
            </svg>
            ${p.rarity}
          </span>

          <!-- DISCOUNT BADGE -->
          ${
            p.oldPrice 
            ? `<span class="discount-tag">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#0B0F14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 12l-8 8-8-8 8-8z" />
                </svg>
                ${percent}% Discount
               </span>`
            : ""
          }

        </div>

        <img src="${p.image}" class="product-img" alt="${p.name}">

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">£${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">£${p.oldPrice}</span>` : ""}
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}', this)">
          <svg xmlns="http://www.w3.org/2000/svg" class="btn-cart-icon"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

/* ============================================================
   SEARCH
============================================================ */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(q));
    renderProducts(filtered);
  });
}

/* ============================================================
   CART ADD
============================================================ */

function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const card = btn.closest(".card");
  const img = card.querySelector(".product-img");

  window.Cart.addItem(product, img);
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  setupSearch();
  if (window.Cart && window.Cart.init) window.Cart.init();
});

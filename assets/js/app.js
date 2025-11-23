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

  // ⭐ Add more real products here
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

        <!-- ⭐ RARITY BADGE WITH GEM ICON -->
        <div class="card-badges">
          <span class="tag ${rarityClass}">
            <svg xmlns="http://www.w3.org/2000/svg"
              width="14" height="14"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="rarity-icon">
              <path d="M10.5 3 8 9l4 13 4-13-2.5-6"/>
              <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/>
              <path d="M2 9h20"/>
            </svg>
            ${p.rarity}
          </span>

          <!-- ⭐ DISCOUNT BADGE -->
          ${
            p.oldPrice
              ? `<span class="discount-tag ${getDiscountClass(percent)}">
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'
                    viewBox='0 0 24 24' fill='none' stroke='currentColor'
                    stroke-width='2' stroke-linecap='round' stroke-linejoin='round'
                    class='lucide lucide-tag'>
                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
                    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
                  </svg>
                  ${percent}% Discount
                 </span>`
              : ""
          }
        </div>

        <!-- IMAGE -->
        <img src="${p.image}" alt="${p.name}" class="product-img">

        <!-- NAME -->
        <h3>${p.name}</h3>

        <!-- PRICE SECTION -->
        <div class="price-box">
          <span class="price">£${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">£${p.oldPrice}</span>` : ""}
        </div>

        <!-- ADD TO CART BUTTON -->
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
    const filtered = products.filter(p => p.name.toLowerCase().includes(q));
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

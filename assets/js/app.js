/* =====================================================
   AUTO + MANUAL CURRENCY SYSTEM
===================================================== */

// Map timezones to default currency
const currencyMap = {
  "Europe/London": "GBP",
  "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR",
  "Europe/Madrid": "EUR",
  "Europe/Rome": "EUR",
  "Europe/Amsterdam": "EUR",
  "Europe/Oslo": "NOK",
  "Europe/Stockholm": "SEK",
  "Europe/Copenhagen": "DKK",
  "Europe/Warsaw": "PLN",

  "America/New_York": "USD",
  "America/Chicago": "USD",
  "America/Denver": "USD",
  "America/Los_Angeles": "USD",
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",

  "Asia/Tokyo": "JPY",
  "Asia/Hong_Kong": "HKD",
  "Asia/Seoul": "KRW",
  "Asia/Singapore": "SGD",
  "Asia/Dubai": "AED",

  "Australia/Sydney": "AUD",
  "Australia/Melbourne": "AUD"
};

// Load saved currency or auto-detect
const savedCurrency = localStorage.getItem("tamedblox_currency");

if (savedCurrency && savedCurrency !== "AUTO") {
    var userCurrency = savedCurrency;
} else {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var userCurrency = currencyMap[timezone] || "GBP";
}

/* Format prices based on userCurrency */
function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: userCurrency,
    minimumFractionDigits: 2
  }).format(amount);
}

/* =====================================================
   CURRENCY DROPDOWN HANDLER
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("currencySelector");

  if (dropdown) {
    dropdown.value = savedCurrency || "AUTO";

    dropdown.addEventListener("change", () => {
      const val = dropdown.value;

      if (val === "AUTO") {
        localStorage.removeItem("tamedblox_currency");
      } else {
        localStorage.setItem("tamedblox_currency", val);
      }

      location.reload();
    });
  }
});

/* =====================================================
   PRODUCT LIST
===================================================== */
const products = [
  {
    name: "La Grande Combinasion ($10M/s)",
    rarity: "Secret",
    price: 10.30,
    oldPrice: 13.38,
    image: "https://i.postimg.cc/tCT9T6xC/Carti.webp"
  }
];

/* =====================================================
   DISCOUNT HELPERS
===================================================== */
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

/* =====================================================
   RENDER PRODUCTS
===================================================== */
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
          <span class="tag ${rarityClass}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.5 3 8 9l4 13 4-13-2.5-6"/>
              <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/>
              <path d="M2 9h20"/>
            </svg>
            ${p.rarity}
          </span>

          ${p.oldPrice ? `
            <span class="discount-tag ${getDiscountClass(percent)}">
              <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'
                viewBox='0 0 24 24' fill='none' stroke='currentColor'
                stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
                <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
              </svg>
              ${percent}% Discount
            </span>` : ""}
        </div>

        <img src="${p.image}" class="product-img">

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ""}
        </div>

        <button class="buy-btn" onclick="addToCart('${p.name}', this)">
          <svg xmlns="http://www.w3.org/2000/svg" class="btn-cart-icon" width="16"
               height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
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
    const query = input.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(query)
    );
    renderProducts(filtered);
  });
}

/* =====================================================
   ADD TO CART WRAPPER
===================================================== */
function addToCart(name, btn) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const card = btn.closest(".card");
  const img = card.querySelector(".product-img");

  window.Cart.addItem(product, img);
}

/* =====================================================
   3D TILT ON MOUSE POSITION
===================================================== */
function initCardTilt() {
  const cards = document.querySelectorAll(".card");
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        `perspective(800px) rotateX(0deg) rotateY(0deg)`;
    });
  });
}

/* =====================================================
   INIT EVERYTHING
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  setupSearch();

  if (window.Cart && window.Cart.init)
    window.Cart.init();
});

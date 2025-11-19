// ===============================
//   TamedBlox Store — APP.JS
//   Neon Edition (Final Build)
// ===============================

// PRODUCT DATA
const products = [
  {
    name: "Grass V2 Seed",
    price: 4.55,
    stock: 12,
    img: "https://via.placeholder.com/400x250",
    tag: "special"
  },
  {
    name: "Premium Soil Pack",
    price: 2.49,
    stock: 38,
    img: "https://via.placeholder.com/400x250",
    tag: "rare"
  },
  {
    name: "Watering Module",
    price: 7.99,
    stock: 5,
    img: "https://via.placeholder.com/400x250",
    tag: "exclusive"
  }
];

// ====================================
//  RENDER PRODUCTS
// ====================================
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card scroll-fade";
    card.style.animationDelay = `${i * 0.1}s`;

    card.innerHTML = `
      <div class="tag">${p.tag}</div>
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>Instant delivery • Trusted seller</p>

      <div class="price">
        £${p.price}
        <span class="old-price">£${(p.price * 1.25).toFixed(2)}</span>
      </div>

      <div class="stock">${p.stock} left</div>

      <button class="buy-btn" onclick="addToCart('${p.name}', ${p.price})">
        Buy
      </button>
    `;

    grid.appendChild(card);
  });

  scrollFadeCheck();
}

// Initial load
renderProducts(products);


// ====================================
//  FILTERS
// ====================================
const filterButtons = document.querySelectorAll(".filter");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.innerText.toLowerCase();

    if (type === "all") {
      renderProducts(products);
    } else {
      renderProducts(products.filter(p => p.tag === type));
    }
  });
});

// ====================================
//  SEARCH SYSTEM
// ====================================
const searchBox = document.querySelector(".search-box input");

if (searchBox) {
  searchBox.addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();

    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q)
    );

    renderProducts(filtered);
  });
}


// ====================================
//  CART SYSTEM (LOCALSTORAGE)
// ====================================
function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));

  // Neon popup effect?
  alert("Added to cart!");
}


// ====================================
//  SCROLL FADE-IN ANIMATION
// ====================================
function scrollFadeCheck() {
  const elems = document.querySelectorAll(".scroll-fade");

  elems.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", scrollFadeCheck);
window.addEventListener("load", scrollFadeCheck);

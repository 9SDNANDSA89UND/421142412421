// TamedBlox Neon Edition — app.js

// Product list
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

// Render product grid
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  list.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card fade-in-up";
    card.style.animationDelay = `${i * 0.1}s`;

    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>Instant delivery • Trusted seller</p>
      <div class="price">£${p.price}</div>
      <div class="stock">${p.stock} left</div>
      <button class="buy-btn" onclick="addToCart('${p.name}', ${p.price})">Buy</button>
    `;

    grid.appendChild(card);
  });
}

// Initial load
renderProducts(products);

// ---------- FILTERS ----------
const filterButtons = document.querySelectorAll(".filter");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const t = btn.textContent.toLowerCase();

    renderProducts(t === "all" ? products : products.filter(x => x.tag === t));
  });
});

// ---------- SEARCH FIX ----------
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

// ---------- CART SYSTEM ----------
function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Item added to cart!");
}

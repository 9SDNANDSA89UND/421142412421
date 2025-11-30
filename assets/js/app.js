function formatUSD(amount) {
  return `$${Number(amount).toFixed(2)} USD`;
}

let products = [];
let productsOriginal = [];
let _TILT_BOUND = false;

function waitFor(checkFn, callback, retry = 0) {
  if (checkFn()) return callback();
  if (retry > 50) return;
  setTimeout(() => waitFor(checkFn, callback, retry + 1), 40);
}

async function loadProducts() {
  try {
    const cached = localStorage.getItem("tamed_products");
    if (cached) {
      products = JSON.parse(cached);
      productsOriginal = [...products];
      renderProducts(products);
    }

    const res = await fetch("https://website-5eml.onrender.com/products");
    const fresh = await res.json();

    fresh.forEach(p => {
      p.price = Number(p.price);
      p.oldPrice = p.oldPrice ? Number(p.oldPrice) : null;
    });

    products = fresh;
    productsOriginal = [...fresh];
    localStorage.setItem("tamed_products", JSON.stringify(fresh));

    renderProducts(products);
  } catch (err) {}
}

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
          <span class="tag-secret">${p.rarity || "Secret"}</span>
          ${discount ? `<span class="discount-tag">${discount}% OFF</span>` : ""}
        </div>

        <img src="${p.image}" class="product-img" />

        <h3>${p.name}</h3>

        <div class="price-box">
          <span class="price">${formatUSD(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${formatUSD(p.oldPrice)}</span>` : ""}
        </div>

        <div class="card-actions">
          <button class="add-cart-btn" data-name="${p.name}">Add to Cart</button>
          <button class="buy-now-btn" data-name="${p.name}">Buy Now</button>
        </div>

      </div>
    `;
  });

  initCardTilt();
  bindCartButtons();
  bindBuyNowButtons();
}

function bindCartButtons() {
  const buttons = document.querySelectorAll(".add-cart-btn");
  if (!buttons.length) return setTimeout(bindCartButtons, 40);

  waitFor(
    () => window.Cart && typeof window.Cart.addItem === "function",
    () => {
      buttons.forEach(btn => {
        btn.onclick = () => {
          const name = btn.getAttribute("data-name");
          const imgElement = btn.closest(".card").querySelector(".product-img");
          addToCart(name, imgElement);
        };
      });
    }
  );
}

function bindBuyNowButtons() {
  const buttons = document.querySelectorAll(".buy-now-btn");

  buttons.forEach(btn => {
    btn.onclick = () => {
      const name = btn.getAttribute("data-name");
      const product = products.find(p => p.name === name);
      if (!product) return;

      const query = new URLSearchParams({
        product: name,
        price: product.price
      });

      window.location.href = "/checkout.html?" + query.toString();
    };
  });
}

function addToCart(name, imgElement) {
  const product = products.find(p => p.name === name);
  if (!product) return;

  const fixedProduct = {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  };

  window.Cart.addItem(fixedProduct, imgElement);
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    const filtered = productsOriginal.filter(p =>
      p.name.toLowerCase().includes(q)
    );
    products = filtered;
    renderProducts(filtered);
  });
}

function setupSorting() {
  const sortSelect = document.getElementById("sortSelect");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", () => {
    const v = sortSelect.value;

    if (v === "relevance") {
      products = [...productsOriginal];
      renderProducts(products);
      return;
    }

    const sorted = [...productsOriginal];

    if (v === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (v === "za") sorted.sort((a, b) => b.name.localeCompare(a.name));
    if (v === "low") sorted.sort((a, b) => a.price - b.price);
    if (v === "high") sorted.sort((a, b) => b.price - a.price);

    products = sorted;
    renderProducts(sorted);
  });
}

function initCardTilt() {
  if (_TILT_BOUND) return;
  _TILT_BOUND = true;

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

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  setupSearch();
  setupSorting();

  waitFor(
    () => window.Cart && typeof window.Cart.init === "function",
    () => window.Cart.init()
  );
});

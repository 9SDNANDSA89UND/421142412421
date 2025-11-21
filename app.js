const products = [
  {
    name: "Mystic Blade",
    rarity: "God",
    price: 12.99,
    oldPrice: 19.99,
    stock: 3,
    image: "https://via.placeholder.com/300x200"
  },
  {
    name: "Shadow Cloak",
    rarity: "Secret",
    price: 8.49,
    oldPrice: 12.0,
    stock: 5,
    image: "https://via.placeholder.com/300x200"
  },
  {
    name: "OG Emblem",
    rarity: "OG",
    price: 4.2,
    stock: 9,
    image: "https://via.placeholder.com/300x200"
  }
];

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#8b92a1;padding:40px 0;">No items available yet.</div>`;
    return;
  }

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "card scroll-fade";
    card.setAttribute("data-rarity", product.rarity.toLowerCase());

    card.innerHTML = `
      <span class="tag">${product.rarity}</span>
      <img src="${product.image}" />
      <h3>${product.name}</h3>
      <p>Instant delivery • Trusted seller</p>
      <div class="price-box">
        <span class="price">£${product.price}</span>
        ${product.oldPrice ? `<span class="old-price">£${product.oldPrice}</span>` : ""}
      </div>
      <div class="stock">${product.stock} left</div>
      <button class="buy-btn">Buy</button>
    `;

    grid.appendChild(card);
  });

  setTimeout(() => {
    document.querySelectorAll(".scroll-fade").forEach(el =>
      el.classList.add("visible")
    );
  }, 80);
}

renderProducts(products);

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const f = btn.textContent.toLowerCase();
    renderProducts(f === "all" ? products : products.filter(p => p.rarity.toLowerCase() === f));
  });
});

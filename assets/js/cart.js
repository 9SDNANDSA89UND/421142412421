/* =========================================
   CART SYSTEM (NOW WITH AUTO CURRENCY)
========================================= */

/* --- MUST MATCH app.js --- */
function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: userCurrency,   // comes from app.js
    minimumFractionDigits: 2
  }).format(amount);
}

window.Cart = {
  items: [],

  /* -----------------------------
     INIT
  ----------------------------- */
  init() {
    const saved = localStorage.getItem("tamedblox_cart");
    this.items = saved ? JSON.parse(saved) : [];

    this.updateDot();
    this.updateDrawer();
  },

  /* -----------------------------
     SAVE CART
  ----------------------------- */
  save() {
    localStorage.setItem("tamedblox_cart", JSON.stringify(this.items));
    this.updateDot();
    this.updateDrawer();
  },

  /* -----------------------------
     FLY TO CART ANIMATION
  ----------------------------- */
  flyToCart(imgSrc, startElement) {
    const cartIcon = document.getElementById("cartBtn");
    if (!cartIcon || !startElement) return;

    const startRect = startElement.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    const flyImg = document.createElement("img");
    flyImg.src = imgSrc;
    flyImg.className = "fly-img";

    flyImg.style.left = startRect.left + "px";
    flyImg.style.top = startRect.top + "px";

    document.body.appendChild(flyImg);

    let trail = setInterval(() => {
      const particle = document.createElement("div");
      particle.className = "fly-particle";
      const rect = flyImg.getBoundingClientRect();
      particle.style.left = rect.left + "px";
      particle.style.top = rect.top + "px";
      document.body.appendChild(particle);

      requestAnimationFrame(() => {
        particle.style.opacity = "0";
        particle.style.transform = "scale(0.2)";
      });

      setTimeout(() => particle.remove(), 500);
    }, 45);

    requestAnimationFrame(() => {
      flyImg.style.transform = `
        translate(${endRect.left - startRect.left}px,
                  ${endRect.top - startRect.top}px)
        scale(0.2)
      `;
      flyImg.style.opacity = "0";
    });

    setTimeout(() => {
      cartIcon.style.animation = "cartBounce 0.35s ease";
      setTimeout(() => cartIcon.style.animation = "", 350);
    }, 850);

    setTimeout(() => {
      clearInterval(trail);
      flyImg.remove();
    }, 900);
  },

  /* -----------------------------
     ADD ITEM
  ----------------------------- */
  addItem(product, clickedElement = null) {
    const existing = this.items.find(i => i.name === product.name);

    if (existing) {
      existing.qty++;
    } else {
      this.items.push({
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1
      });
    }

    this.save();

    if (clickedElement) {
      this.flyToCart(product.image, clickedElement);
    }
  },

  /* -----------------------------
     CHANGE QTY
  ----------------------------- */
  changeQty(name, amount) {
    const item = this.items.find(i => i.name === name);
    if (!item) return;

    item.qty += amount;
    if (item.qty <= 0) {
      this.items = this.items.filter(i => i.name !== name);
    }

    this.save();
  },

  /* -----------------------------
     REMOVE ITEM
  ----------------------------- */
  remove(name) {
    this.items = this.items.filter(i => i.name !== name);
    this.save();
  },

  /* -----------------------------
     UPDATE CART DOT
  ----------------------------- */
  updateDot() {
    const dot = document.getElementById("cartDot");
    if (!dot) return;

    dot.style.display = this.items.length > 0 ? "block" : "none";
  },

  /* -----------------------------
     UPDATE CART DRAWER UI
     (NOW WITH RETRY FIX)
  ----------------------------- */
  updateDrawer() {
    const drawer = document.getElementById("drawerContent");

    // ⭐ FIX: Wait for navbar/drawer to load
    if (!drawer) {
      setTimeout(() => this.updateDrawer(), 50);
      return;
    }

    if (this.items.length === 0) {
      drawer.innerHTML = `<p style="color:#9ca4b1;">Your cart is empty.</p>`;
      const totalEl = document.getElementById("drawerTotal");
      if (totalEl) totalEl.innerText = formatPrice(0);
      return;
    }

    let html = "";
    let total = 0;

    this.items.forEach(item => {
      total += item.price * item.qty;

      html += `
        <div class="cart-item">
          <img src="${item.image}" class="cart-img">

          <div class="cart-info">
            <div class="cart-name">${item.name}</div>
            <div class="cart-price">${formatPrice(item.price)}</div>
          </div>

          <div class="cart-qty-controls">
            <div class="cart-qty-row">
              <button class="qty-btn" onclick="Cart.changeQty('${item.name}', -1)">−</button>
              <span class="qty-display">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.changeQty('${item.name}', 1)">+</button>
            </div>

            <button class="qty-btn cart-remove" onclick="Cart.remove('${item.name}')">×</button>
          </div>
        </div>
      `;
    });

    drawer.innerHTML = html;

    const totalEl = document.getElementById("drawerTotal");
    if (totalEl) totalEl.innerText = formatPrice(total);
  }
};

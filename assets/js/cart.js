/* =========================================
   CART SYSTEM (MODULAR)
========================================= */

window.Cart = {
  items: [],

  /* -----------------------------
     INIT CART FROM LOCALSTORAGE
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
     ⭐ FLY TO CART ANIMATION
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

    requestAnimationFrame(() => {
      flyImg.style.transform = `
        translate(${endRect.left - startRect.left}px, 
                  ${endRect.top - startRect.top}px)
        scale(0.2)
      `;
      flyImg.style.opacity = "0";
    });

    setTimeout(() => flyImg.remove(), 900);
  },

  /* -----------------------------
     ADD ITEM + FLY ANIMATION
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

    /* ⭐ Trigger Animation */
    if (clickedElement) {
      this.flyToCart(product.image, clickedElement);
    }
  },

  /* -----------------------------
     CHANGE QUANTITY
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
     REMOVE ITEM COMPLETELY
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
  ----------------------------- */
  updateDrawer() {
    const drawer = document.getElementById("drawerContent");
    if (!drawer) return;

    if (this.items.length === 0) {
      drawer.innerHTML = `<p style="color:#9ca4b1;">Your cart is empty.</p>`;
      document.getElementById("drawerTotal").innerText = "£0.00";
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
            <div class="cart-price">£${item.price}</div>
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

    /* ⭐ NEW total updater */
    document.getElementById("drawerTotal").innerText = "£" + total.toFixed(2);
  }
};

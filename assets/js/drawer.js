// CART DRAWER LOGIC (Modernized)

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartBtn = document.getElementById("cartBtn");
const closeDrawer = document.getElementById("closeDrawer");

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.style.display = "block";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.style.display = "none";
}

if (cartBtn) cartBtn.addEventListener("click", openCart);
if (closeDrawer) closeDrawer.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

/* Update Drawer Content */
function updateCartDrawer() {
  const drawer = document.getElementById("drawerContent");

  if (!drawer) return;

  if (cart.length === 0) {
    drawer.innerHTML = `<p style="color:#9ca4b1; margin-top:20px;">Your cart is empty.</p>`;
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    html += `
      <div class="cart-item">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">£${item.price}</div>

        <div class="cart-qty-row">
          <button class="qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
          <div class="qty-display">${item.qty}</div>
          <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
          <button class="qty-btn qty-remove" onclick="removeItem('${item.name}')">×</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="cart-total-line">Total: £${total.toFixed(2)}</div>
    <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
  `;

  drawer.innerHTML = html;
}

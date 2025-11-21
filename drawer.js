/* ============================
   CART DRAWER CONTROLS (FINAL)
   Works with updated styles + app.js
============================ */

// OPEN CART
export function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (drawer && overlay) {
    drawer.classList.add("open");
    overlay.classList.add("show");
  }
}

// CLOSE CART
export function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (drawer && overlay) {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
  }
}

// EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const closeBtn = document.getElementById("closeDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      openCart();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeCart();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      closeCart();
    });
  }
});

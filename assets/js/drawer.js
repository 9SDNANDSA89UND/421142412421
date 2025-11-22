/* =========================================
   CART DRAWER CONTROLS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeDrawerBtn = document.getElementById("closeDrawer");

  function openDrawer() {
    cartDrawer.classList.add("open");
    cartOverlay.style.display = "block";
    document.body.style.overflow = "hidden"; // disable scrolling
  }

  function closeDrawer() {
    cartDrawer.classList.remove("open");
    cartOverlay.style.display = "none";
    document.body.style.overflow = ""; // restore scroll
  }

  /* OPEN */
  cartBtn?.addEventListener("click", openDrawer);

  /* CLOSE BUTTON */
  closeDrawerBtn?.addEventListener("click", closeDrawer);

  /* OVERLAY CLICK */
  cartOverlay?.addEventListener("click", closeDrawer);

  /* ESC KEY */
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDrawer();
  });

  /* Make functions globally available (for HTML onclick) */
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
});


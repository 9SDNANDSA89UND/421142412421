function initDrawer() {
  const cartBtn = document.getElementById("cartBtn");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeDrawer = document.getElementById("closeDrawer");
  const drawerCheckoutBtn = document.getElementById("drawerCheckoutBtn");

  // If navbar hasn't loaded yet, try again in 50ms
  if (!cartBtn || !cartDrawer || !cartOverlay) {
    return setTimeout(initDrawer, 50);
  }

  // OPEN DRAWER
  cartBtn.addEventListener("click", () => {
    cartDrawer.classList.add("open");
    cartOverlay.style.display = "block";
  });

  // CLOSE DRAWER BY CLICKING X
  if (closeDrawer) {
    closeDrawer.addEventListener("click", () => {
      cartDrawer.classList.remove("open");
      cartOverlay.style.display = "none";
    });
  }

  // CLOSE DRAWER BY CLICKING OUTSIDE
  cartOverlay.addEventListener("click", () => {
    cartDrawer.classList.remove("open");
    cartOverlay.style.display = "none";
  });

  // CHECKOUT BUTTON INSIDE DRAWER
  if (drawerCheckoutBtn) {
    drawerCheckoutBtn.addEventListener("click", () => {
      window.location.href = "/checkout.html";
    });
  }

  console.log("Cart drawer initialized.");
}

// Run drawer init when page loads
document.addEventListener("DOMContentLoaded", initDrawer);

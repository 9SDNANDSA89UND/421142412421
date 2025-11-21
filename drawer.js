const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeDrawer = document.getElementById("closeDrawer");

/* OPEN DRAWER */
cartBtn.addEventListener("click", () => {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("show");
  updateCartDrawer();
});

/* CLOSE DRAWER (X BUTTON) */
closeDrawer.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
});

/* CLOSE DRAWER BY CLICKING OVERLAY */
cartOverlay.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
});

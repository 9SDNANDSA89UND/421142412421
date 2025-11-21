const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeDrawer = document.getElementById("closeDrawer");

cartBtn.addEventListener("click", () => {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("show");
});

closeDrawer.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
});

cartOverlay.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
});


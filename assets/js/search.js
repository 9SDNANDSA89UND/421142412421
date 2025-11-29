// Product search logic

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("productSearchInput");
  const btn = document.getElementById("productSearchBtn");

  if (!input || !btn) return;

  // Search when pressing the button
  btn.onclick = () => runSearch();

  // Search on Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") runSearch();
  });

  function runSearch() {
    const term = input.value.trim().toLowerCase();
    filterProducts(term);
  }
});

// This function hides/shows products already rendered on page
function filterProducts(term) {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const name = card.querySelector(".product-title")?.innerText.toLowerCase() || "";

    if (name.includes(term)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

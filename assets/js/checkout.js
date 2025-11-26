/* ============================================================
   TamedBlox — CHECKOUT PAGE SCRIPT (CSP SAFE)
============================================================ */

function formatUSD(amount) {
  return `$${Number(amount).toFixed(2)} USD`;
}

function waitForCart(callback) {
  if (window.Cart && typeof window.Cart.init === "function") {
    return callback();
  }
  setTimeout(() => waitForCart(callback), 40);
}

function loadComponent(selector, file) {
  const el = document.querySelector(selector);
  if (!el) return;
  fetch(file)
    .then((r) => r.text())
    .then((html) => (el.innerHTML = html));
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("#navbar", "components/navbar.html");
  loadComponent("#modals", "components/modals.html");
  loadComponent("#footer", "components/footer.html");

  waitForCart(() => {
    window.Cart.init();

    const wrapper = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");

    const items = window.Cart.items || [];
    let total = 0;

    if (!items.length) {
      wrapper.innerHTML = `<p style="color:#9ca4b1;">Your cart is empty.</p>`;
      totalEl.innerText = formatUSD(0);
      return;
    }

    let html = "";
    items.forEach((i) => {
      total += i.price * i.qty;

      html += `
        <div class="checkout-card">
          <img src="${i.image}" class="checkout-img">

          <div class="checkout-info">
            <div class="checkout-name">${i.name}</div>
            <div class="checkout-price">${formatUSD(i.price)}</div>
            <div class="checkout-qty">Qty: ${i.qty}</div>
          </div>
        </div>
      `;
    });

    wrapper.innerHTML = html;
    totalEl.innerText = formatUSD(total);

    document.getElementById("checkoutPay").onclick = async () => {
      if (!items.length) {
        alert("Your cart is empty.");
        return;
      }

      try {
        const res = await fetch(
          "https://website-5eml.onrender.com/pay/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: items })
          }
        );

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || "Payment session failed.");
        }
      } catch {
        alert("Payment server unreachable.");
      }
    };
  });
});

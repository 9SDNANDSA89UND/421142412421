const API = "https://website-5eml.onrender.com";

async function loadProducts() {
    const res = await fetch(`${API}/products`);
    const products = await res.json();

    const container = document.getElementById("product-list");
    if (!container) return;

    container.innerHTML = "";

    products.forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p><strong>£${p.price}</strong></p>
                <button class="add-btn" onclick="addToCart('${p.id}', '${p.name}', ${p.price})">Add to Cart</button>
            </div>
        `;
    });
}

function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ id, name, price });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to cart!");
}

function loadCart() {
    const tbody = document.getElementById("cart-items");
    if (!tbody) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;

    tbody.innerHTML = "";

    cart.forEach(item => {
        total += item.price;
        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>£${item.price}</td>
            </tr>
        `;
    });

    document.getElementById("total").innerText = total;
}

function checkout() {
    alert("Checkout coming soon!");
}

loadProducts();
loadCart();

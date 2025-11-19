const API = "https://website-5eml.onrender.com";
const PLACEHOLDER_IMG = "https://dummyimage.com/400x280/2a2d44/ffffff&text=TamedBlox+Item";

async function loadProducts() {
    const res = await fetch(`${API}/products`);
    const products = await res.json();

    const grid = document.getElementById("product-list");
    grid.innerHTML = "";

    products.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">

                <div class="badges">
                    <div class="badge purple">Popular</div>
                    <div class="badge blue">Deal</div>
                </div>

                <img src="${PLACEHOLDER_IMG}" class="product-img" />

                <h3>${p.name}</h3>
                <p>${p.description}</p>

                <div class="add-bar">
                    <strong>£${p.price}</strong>

                    <button class="add-btn" onclick="addToCart('${p.id}', '${p.name}', ${p.price})">
                        Add
                    </button>
                </div>

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
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const tbody = document.getElementById("cart-items");

    if (!tbody) return;

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

loadProducts();
loadCart();

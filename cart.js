const cartContainer = document.getElementById("cartContainer");
const totalEl = document.getElementById("total");
const cartQRCodesDiv = document.getElementById("cart-qrcodes");
const darkModeToggle = document.getElementById("darkModeToggle");

let productsInCart = [];
const token = localStorage.getItem("token");

// Dark mode toggle
function applyDarkMode(enable) {
  document.body.classList.toggle("dark-mode", enable);
  document.querySelectorAll(".product").forEach(p => p.classList.toggle("dark-mode", enable));
  document.querySelectorAll(".remove-btn").forEach(b => b.classList.toggle("dark-mode", enable));
  document.querySelectorAll(".quantity button").forEach(b => b.classList.toggle("dark-mode", enable));
}
darkModeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-mode");
  applyDarkMode(isDark);
  localStorage.setItem("darkMode", isDark);
});
if (localStorage.getItem("darkMode") === "true") applyDarkMode(true);

// Not logged in
if (!token) {
  cartContainer.innerHTML = "<p class='empty'>Please sign in to view your cart.</p>";
} else {
  loadCart();
}

// Load cart from backend
async function loadCart() {
  try {
    const res = await fetch("http://localhost:5000/api/cart", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) throw new Error("Failed to fetch cart");
    const data = await res.json();

    // Normalize cart using backend fields only
    productsInCart = data.map(item => ({
      productId: item.productId,
      name: item.name || "Unnamed Product",
      price: item.price || 0,
      image: item.image || "images/default-banner.jpg",
      quantity: item.quantity || 1
    }));

    renderCart();

  } catch (err) {
    console.error("Error loading cart:", err);
    cartContainer.innerHTML = "<p class='empty'>Error fetching cart data.</p>";
  }
}

// Render cart
function renderCart() {
  if (!productsInCart.length) {
    cartContainer.innerHTML = "<p class='empty'>Your cart is empty 🛒</p>";
    totalEl.textContent = "";
    cartQRCodesDiv.innerHTML = "";
    return;
  }

  cartContainer.innerHTML = "";
  let total = 0;

  productsInCart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const div = document.createElement("div");
    div.className = "product" + (document.body.classList.contains("dark-mode") ? " dark-mode" : "");
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="product-info">
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
      </div>
      <div class="quantity">
        <button class="decrease">-</button>
        <span>${item.quantity}</span>
        <button class="increase">+</button>
      </div>
      <div>₹${subtotal}</div>
      <button class="remove-btn">Remove</button>
    `;

    // Quantity buttons
    div.querySelector(".increase").addEventListener("click", () => {
      item.quantity++;
      renderCart();
    });
    div.querySelector(".decrease").addEventListener("click", () => {
      if (item.quantity > 1) item.quantity--;
      renderCart();
    });

    // Remove button
    div.querySelector(".remove-btn").addEventListener("click", async () => {
      if (!confirm("Remove this item from cart?")) return;
      try {
        await fetch(`http://localhost:5000/api/cart/${item.productId}`, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });
        productsInCart = productsInCart.filter(p => p.productId !== item.productId);
        renderCart();
      } catch (err) {
        console.error("Error removing product:", err);
        alert("Failed to remove product");
      }
    });

    cartContainer.appendChild(div);
  });

  totalEl.textContent = "Total: ₹" + total;

  updateQRCodes();
}

// Update QR codes
async function updateQRCodes() {
  if (!productsInCart.length) {
    cartQRCodesDiv.innerHTML = "<p>No products selected</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/upi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ products: productsInCart.map(p => p.productId) })
    });
    if (!res.ok) throw new Error("Failed to fetch QR codes");

    const data = await res.json();
    cartQRCodesDiv.innerHTML = "";

    data.forEach(seller => {
      const div = document.createElement("div");
      div.classList.add("qr-box");
      div.innerHTML = `
        <h4>${seller.sellerName} - Total: ₹${seller.total}</h4>
        <img src="${seller.qrCode}" alt="QR Code" width="150"/>
        <ul>
          ${seller.products.map(p => `<li>${p.name || "Unnamed Product"} - ₹${p.price || 0}</li>`).join("")}
        </ul>
      `;
      cartQRCodesDiv.appendChild(div);
    });

  } catch (err) {
    console.error("Error fetching QR codes:", err);
    cartQRCodesDiv.innerHTML = "<p>Failed to load QR codes</p>";
  }
}

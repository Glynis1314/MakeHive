
const cartProductsDiv = document.getElementById("cart-products");
const cartQRCodesDiv = document.getElementById("cart-qrcodes");
const totalAmountSpan = document.getElementById("total-amount");

let productsInCart = [];

// Load cart
async function loadCart() {
  const token = localStorage.getItem("token");
  if (!token) {
    cartProductsDiv.innerHTML = "<p>Please log in to view your cart</p>";
    totalAmountSpan.textContent = "0";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/cart", {
      headers: { "Authorization": "Bearer " + token }
    });
    productsInCart = await res.json();

    if (!productsInCart.length) {
      cartProductsDiv.innerHTML = "<p>Your cart is empty</p>";
      totalAmountSpan.textContent = "0";
      cartQRCodesDiv.innerHTML = "";
    } else {
      renderProducts();
      updateQRCodes();
    }
  } catch (err) {
    console.error("Error loading cart:", err);
    cartProductsDiv.innerHTML = "<p>Failed to load cart</p>";
  }
}

// Render products
function renderProducts() {
  cartProductsDiv.innerHTML = "";
  productsInCart.forEach(product => {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
      <input type="checkbox" data-id="${product._id}" checked>
      <img src="${product.image}" alt="${product.name}" style="width:100px;">
      <div>
        <p>${product.name}</p>
        <span>₹${product.price} × ${product.quantity}</span>
      </div>
      <button class="remove-btn" data-id="${product._id}">Remove</button>
    `;
    cartProductsDiv.appendChild(productDiv);
  });

  document.querySelectorAll("#cart-products input").forEach(input => {
    input.addEventListener("change", updateQRCodes);
  });
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", removeProduct);
  });
}

// Remove product
async function removeProduct(e) {
  const id = e.target.dataset.id;
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  try {
    await fetch(`http://localhost:5000/api/cart/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    productsInCart = productsInCart.filter(p => p._id !== id);
    renderProducts();
    updateQRCodes();
  } catch (err) {
    console.error("Error removing product:", err);
    alert("Failed to remove product");
  }
}

// Update QR codes
async function updateQRCodes() {
  const selectedProductsIds = Array.from(document.querySelectorAll("#cart-products input:checked"))
    .map(input => input.dataset.id);

  // Calculate total
  let total = 0;
  selectedProductsIds.forEach(pid => {
    const prod = productsInCart.find(p => p._id === pid);
    if (prod) total += prod.price * (prod.quantity || 1);
  });
  totalAmountSpan.textContent = total || "0";

  if (!selectedProductsIds.length) {
    cartQRCodesDiv.innerHTML = "<p>No products selected</p>";
    return;
  }

  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:5000/api/upi", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ products: selectedProductsIds })
    });
    const data = await res.json();

    cartQRCodesDiv.innerHTML = "";
    data.forEach(seller => {
      const sellerDiv = document.createElement("div");
      sellerDiv.classList.add("qr-box");
      sellerDiv.innerHTML = `
        <h4>${seller.sellerName} - Total: ₹${seller.total}</h4>
        <img src="${seller.qrCode}" alt="QR Code"/>
        <ul>
          ${seller.products.map(p => `<li>${p.name} - ₹${p.price}</li>`).join("")}
        </ul>
      `;
      cartQRCodesDiv.appendChild(sellerDiv);
    });
  } catch (err) {
    console.error("Error fetching QR codes:", err);
    cartQRCodesDiv.innerHTML = "<p>Failed to load QR codes</p>";
  }
}

loadCart();

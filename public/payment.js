// payment.js
const paymentContainer = document.getElementById("payment-products");

// Get selected products from cart
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];
let total = 0;

if(selectedProducts.length === 0){
  paymentContainer.innerHTML = "<p style='text-align:center;'>No products selected. Go back to cart.</p>";
}

// Render selected products
selectedProducts.forEach(product => {
  total += product.price;

  const div = document.createElement("div");
  div.className = "product-card";

  div.innerHTML = `
    <h3>${product.name}</h3>
    <img src="${product.image}" alt="${product.name}">
    <p>Price: ₹${product.price}</p>

    <div class="payment-section">
      <h4>Pay via Google Pay / UPI</h4>
      <img src="${product.qr}" alt="Scan to pay" style="width:150px;">
      <p>Scan QR to pay ₹${product.price}</p>

      <h4>Cash on Delivery</h4>
      <a href="thankyou.html"><button>Pay with Cash</button></a>
    </div>
  `;

  paymentContainer.appendChild(div);
});

document.getElementById("total").innerText = total;

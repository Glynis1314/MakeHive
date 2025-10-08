const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");

// Add product to cart
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.cart) user.cart = [];

    let productData = { productId, quantity };

    // Fetch product info from DB
    const product = await Product.findById(productId);
    if (product) {
      productData.name = product.name;
      productData.price = product.price;
      productData.image = product.image;
    }

    // If product already exists in cart
    const index = user.cart.findIndex(item => item.productId === productId);
    if (index > -1) {
      user.cart[index].quantity += quantity;
    } else {
      user.cart.push(productData);
    }

    await user.save();
    res.json({ msg: "✅ Product added to cart", cart: user.cart });
  } catch (err) {
    console.error("Cart POST error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get cart
// GET /api/cart
// Get cart
router.get("/", async (req, res) => {
  try {
    // Replace your old code here with this
    const user = await User.findById(req.user.id).populate("cart.productId");

    if (!user) return res.status(404).json({ error: "User not found" });

    // Map cart items to include full product info
    const cart = user.cart.map(item => {
      const prod = item.productId; // populated Product document
      return {
        productId: prod?._id,
        name: prod?.name || "Unnamed Product",
        price: prod?.price || 0,
        image: prod?.image || "images/default-banner.jpg",
        quantity: item.quantity || 1
      };
    });

    res.json(cart);

  } catch (err) {
    console.error("Cart GET error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Remove product from cart
router.delete("/:productId", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart.filter(item => item.productId !== req.params.productId);
    await user.save();

    res.json({ msg: "✅ Product removed", cart: user.cart });
  } catch (err) {
    console.error("Cart DELETE error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


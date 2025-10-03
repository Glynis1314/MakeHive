const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");

// Add product to cart
router.post("/", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.replace("Bearer ", "");
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = "supersecretkey"; // must match server.js

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { productId, quantity } = req.body;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.cart) user.cart = [];

    const index = user.cart.findIndex(item => item.productId.toString() === productId);
    if (index > -1) {
      user.cart[index].quantity += quantity || 1;
    } else {
      user.cart.push({ productId, quantity: quantity || 1 });
    }

    await user.save();
    res.json({ msg: "✅ Product added to cart", cart: user.cart });
  } catch (err) {
    console.error("Cart POST error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's cart with full product info
router.get("/", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.replace("Bearer ", "");
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = "supersecretkey";

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.id).populate("cart.productId");
    if (!user) return res.status(404).json({ error: "User not found" });

    const cartWithDetails = user.cart.map(item => ({
      _id: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image || "",
      quantity: item.quantity
    }));

    res.json(cartWithDetails);
  } catch (err) {
    console.error("Cart GET error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
router.delete("/:productId", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.replace("Bearer ", "");
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = "supersecretkey";

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart.filter(item => item.productId.toString() !== req.params.productId);
    await user.save();

    res.json({ msg: "✅ Product removed", cart: user.cart });
  } catch (err) {
    console.error("Cart DELETE error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

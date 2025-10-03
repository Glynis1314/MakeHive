const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order"); // optional, if you track orders

// Example: get all products in cart for payment (backend)
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id; // auth middleware must set req.user
    const user = await User.findById(userId).populate("cart.productId");
    if (!user || !user.cart) return res.json({ products: [] });

    // Return cart items for frontend to render
    res.json({
      products: user.cart.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Example: confirm payment for selected products
router.post("/confirm", async (req, res) => {
  try {
    const userId = req.user.id;
    const { products } = req.body; // array of product IDs
    if (!products || !products.length) return res.status(400).json({ error: "No products selected" });

    // Optional: create an order in DB
    await Order.create({
      user: userId,
      products,
      status: "Paid",
      paidAt: new Date()
    });

    // You can also remove these products from user's cart here
    const user = await User.findById(userId);
    user.cart = user.cart.filter(item => !products.includes(item.productId.toString()));
    await user.save();

    res.json({ success: true, msg: "Payment confirmed and cart updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;

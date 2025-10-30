const express = require("express");
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../email'); // We will create this helper

// Create a new order
router.post("/", async (req, res) => {
  try {
    const { products, amount, transactionId, status } = req.body;
    if (!products || products.length === 0) {
      return res.status(400).json({ error: "No products in order" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newOrder = new Order({
      user: req.user.id,
      products: products.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        price: p.price
      })),
      amount,
      transactionId,
      status
    });

    const savedOrder = await newOrder.save();
    
    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(user, savedOrder);
    } catch (emailError) {
      // Log the email error but don't fail the order creation
      console.error("Failed to send order confirmation email:", emailError);
    }

    // Clear cart after successful order
    user.cart = [];
    await user.save();
    console.log(`Cart cleared for user ${user.id}`);

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get user's orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("user", "username")
      .populate("products.productId", "name price image imageUrl") // Ensure image fields are populated
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Clear all orders for a user
router.delete("/all", async (req, res) => {
  try {
    // Find all orders for the logged-in user and delete them
    await Order.deleteMany({ user: req.user.id });
    res.json({ message: "All orders have been cleared successfully." });
  } catch (err) {
    console.error("Clear orders error:", err);
    res.status(500).json({ error: "Failed to clear order history." });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const pendingApprovals = await Seller.countDocuments({ isVerified: false });

    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      pendingApprovals
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// GET /api/admin/orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "username")
      .populate("products.productId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Admin fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Admin fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/admin/products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Admin fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/admin/sellers
router.get("/sellers", async (req, res) => {
  try {
    const sellers = await Seller.find({}).populate('user', 'username email').sort({ createdAt: -1 });
    res.json(sellers);
  } catch (err) {
    console.error("Admin fetch sellers error:", err);
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
});

// PUT /api/admin/sellers/:id/approve
router.put("/sellers/:id/approve", async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }
    res.json({ message: "Seller approved successfully", seller });
  } catch (err) {
    console.error("Admin approve seller error:", err);
    res.status(500).json({ error: "Failed to approve seller" });
  }
});

module.exports = router;
const express = require("express");
const connectDB = require("./db");
const User = require("./models/User");
const Seller = require("./models/Seller");
const Product = require("./models/Product");
const Order = require("./models/Order"); // ✅ NEW
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Connect database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const JWT_SECRET = "supersecretkey";

// ==========================
// Auth Middleware
// ==========================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ==========================
// Multer Setups
// ==========================
const createStorage = (folderName, prefix) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `./uploads/${folderName}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}_${req.user.id}_${Date.now()}${ext}`);
    },
  });

const upload = multer({ storage: createStorage("", "profile") });
const sellerUpload = multer({ storage: createStorage("sellers", "seller") });
const productUpload = multer({ storage: createStorage("products", "product") });

// ==========================
// Test Route
// ==========================
app.get("/", (req, res) => {
  res.send("🚀 Express + MongoDB + Auth + Fake Store API server is running!");
});

// ==========================
// Fake Store API Routes
// ==========================
app.get("/products/fake", async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get("https://fakestoreapi.com/products");
    let products = response.data;

    if (q) {
      products = products.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase())
      );
    }

    res.json(products);
  } catch (err) {
    console.error("Fake Store API Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch products",
      details: err.message,
    });
  }
});

// ==========================
// Auth Routes
// ==========================
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ msg: "✅ User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ msg: "✅ Login successful!", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Profile Routes
// ==========================
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/profile",
  authMiddleware,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const { username, email, phone } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (username) user.username = username;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (req.file) user.profilePicUrl = `/uploads/${req.file.filename}`;

      await user.save();
      res.json({
        msg: "✅ Profile updated!",
        profilePicUrl: user.profilePicUrl || null,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ==========================
// Seller Routes
// ==========================
app.post(
  "/seller",
  authMiddleware,
  sellerUpload.single("bannerPic"),
  async (req, res) => {
    try {
      const { businessName, description, gstNumber, paymentDetails } = req.body;
      const existing = await Seller.findOne({ userId: req.user.id });
      if (existing)
        return res.status(400).json({
          error: "You already applied as a seller",
          isVerified: existing.isVerified,
        });

      const seller = new Seller({
        userId: req.user.id,
        businessName,
        description,
        gstNumber,
        paymentDetails: paymentDetails ? JSON.parse(paymentDetails) : {},
        bannerPicUrl: req.file ? `/uploads/sellers/${req.file.filename}` : null,
      });

      await seller.save();
      res.json({
        msg: "✅ Seller application submitted!",
        sellerId: seller._id,
        isVerified: seller.isVerified,
        seller,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/seller", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id }).select("-__v");
    if (!seller) return res.status(404).json({ error: "No seller info found" });
    res.json({
      businessName: seller.businessName,
      description: seller.description,
      gstNumber: seller.gstNumber,
      isVerified: seller.isVerified,
      paymentDetails: seller.paymentDetails,
      bannerPicUrl: seller.bannerPicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Product Routes
// ==========================
app.post(
  "/products",
  authMiddleware,
  productUpload.single("image"),
  async (req, res) => {
    try {
      const seller = await Seller.findOne({ userId: req.user.id });
      if (!seller || !seller.isVerified)
        return res
          .status(403)
          .json({ error: "Only verified sellers can add products" });

      const { name, description, price } = req.body;
      const product = new Product({
        sellerId: seller._id,
        name,
        description,
        price,
        imageUrl: req.file ? `/uploads/products/${req.file.filename}` : null,
      });
      await product.save();
      res.json({ msg: "✅ Product added!", product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/products", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller || !seller.isVerified)
      return res
        .status(403)
        .json({ error: "Only verified sellers can view products" });

    const products = await Product.find({ sellerId: seller._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/products/:id",
  authMiddleware,
  productUpload.single("image"),
  async (req, res) => {
    try {
      const seller = await Seller.findOne({ userId: req.user.id });
      if (!seller || !seller.isVerified)
        return res
          .status(403)
          .json({ error: "Only verified sellers can edit products" });

      const product = await Product.findOne({
        _id: req.params.id,
        sellerId: seller._id,
      });
      if (!product) return res.status(404).json({ error: "Product not found" });

      const { name, description, price } = req.body;
      if (name) product.name = name;
      if (description) product.description = description;
      if (price) product.price = price;
      if (req.file) product.imageUrl = `/uploads/products/${req.file.filename}`;

      await product.save();
      res.json({ msg: "✅ Product updated!", product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller || !seller.isVerified)
      return res
        .status(403)
        .json({ error: "Only verified sellers can delete products" });

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      sellerId: seller._id,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({ msg: "✅ Product deleted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Order Routes (NEW)
// ==========================
app.post("/orders", authMiddleware, async (req, res) => {
  try {
    const {
      items,
      subtotal,
      shipping = 0,
      tax = 0,
      total,
      payment,
      deliveryAddress,
      notes,
    } = req.body;

    if (!items || !items.length)
      return res.status(400).json({ error: "Order items required" });
    if (!total) return res.status(400).json({ error: "Order total required" });

    const order = new Order({
      userId: req.user.id,
      items,
      subtotal,
      shipping,
      tax,
      total,
      payment,
      deliveryAddress,
      notes,
      status: payment?.status === "paid" ? "paid" : "created",
    });

    await order.save();
    res
      .status(201)
      .json({ msg: "✅ Order created", orderId: order._id, order });
  } catch (err) {
    console.error("Create order error:", err);
    res
      .status(500)
      .json({ error: "Failed to create order", details: err.message });
  }
});

app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch orders", details: err.message });
  }
});

app.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });
    res.json(order);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch order", details: err.message });
  }
});

app.get("/seller/orders", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) return res.status(403).json({ error: "Not a seller" });

    const orders = await Order.find({ "items.sellerId": seller._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch seller orders", details: err.message });
  }
});

app.put("/orders/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = [
      "created",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (!valid.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const seller = await Seller.findOne({ userId: req.user.id });

    if (seller) {
      const ownsItem = order.items.some(
        it => it.sellerId?.toString() === seller._id.toString()
      );
      if (!ownsItem)
        return res.status(403).json({ error: "You cannot update this order" });
    } else {
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    order.status = status;
    await order.save();
    res.json({ msg: "✅ Order status updated", order });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update order status", details: err.message });
  }
});

// ==========================
// Admin / Debug
// ==========================
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Start Server
// ==========================
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

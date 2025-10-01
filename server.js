const express = require("express");
const connectDB = require("./db");
const User = require("./models/User");
const Seller = require("./models/Seller");
const Product = require("./models/Product");
const Order = require("./models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Connect database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

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
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
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

    const hashedPassword = await bcrypt.hash(password, 10);
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
// Password Reset Routes
// ==========================
app.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${process.env.FRONTEND_URL}?token=${token}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "✅ Password reset email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ msg: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ msg: "✅ Password reset successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Profile, Seller, Product, Order routes
// (Keep everything from first server.js)
// ==========================
// ... [include all routes from the first server.js exactly here] ...

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

require("dotenv").config();

const mockProducts = require("./mockProducts");
const express = require("express");
const connectDB = require("./db");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const cartRouter = require("./routes/cart");
const upiRouter = require("./routes/upi");
const Product = require("./models/Product");
const axios = require("axios");

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// JWT secret
const JWT_SECRET = "supersecretkey";

// ==========================
// 🔹 Auth Middleware
// ==========================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ==========================
// 🔹 Routes
// ==========================

// Test
app.get("/", (req, res) => res.send("🚀 Server running!"));

app.get("/test-db", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ msg: "✅ User registered!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signin
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

// Protected profile
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 🔹 Forgot Password
// ==========================
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    const frontendURL = "http://127.0.0.1:5500/MakeHive";
    const resetLink = `${frontendURL}/reset-password.html?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: "glynisdarryldmello@gmail.com", 
        pass: "fzftikfwqhxrygog"
      }
    });

    const mailOptions = {
      from: '"MakeHive" <glynisdarryldmello@gmail.com>',
      to: email,
      subject: "Password Reset Request",
      html: `<p>Hi ${user.username},</p>
             <p>Click the link below to reset your password. This link will expire in 15 minutes:</p>
             <a href="${resetLink}">${resetLink}</a>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "✅ Reset link sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and password required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ error: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ msg: "✅ Password reset successful!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// ==========================
// 🔹 Search products (static + dynamic)
// ==========================
app.get("/api/products/search", async (req, res) => {
  try {
    const query = req.query.query || "";

    // Static mock products
    const staticResults = mockProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    // Dynamic products from MongoDB
    const dynamicResults = await Product.find({
      name: { $regex: query, $options: "i" }
    });

    res.json([...staticResults, ...dynamicResults]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ==========================
// 🔹 Cart & Payment
// ==========================
app.use("/api/cart", authMiddleware, cartRouter);
app.use("/api/upi", authMiddleware, upiRouter);

// ==========================
// 🔹 Start server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

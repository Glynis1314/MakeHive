const express = require("express");
const connectDB = require("./db");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

// Routes
const cartRouter = require("./routes/cart");
const upiRouter = require("./routes/upi");

// Initialize app
const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(cors()); // allow cross-origin requests
app.use(express.json());

// JWT secret key
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

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Server running!");
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

// Protected profile route
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
// 🔹 Cart & Payment Routes
// ==========================
app.use("/api/cart", authMiddleware, cartRouter);
app.use("/api/upi", authMiddleware, upiRouter);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

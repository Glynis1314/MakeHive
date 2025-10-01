const express = require("express");
const connectDB = require("./db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const upiRouter = require("./routes/upi");

const app = express();

// connect database
connectDB();

// middlewares
app.use(cors()); // allow frontend requests
app.use(express.json());

// JWT secret key (keep it safe in env variables in production!)
const JWT_SECRET = "supersecretkey";

// ==========================
// 🔹 Auth Middleware
// ==========================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // store user info in request
    next(); // proceed to route
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ==========================
// 🔹 Routes
// ==========================

// test route
app.get("/", (req, res) => {
  res.send("🚀 Express + MongoDB + Auth server is running!");
});

// ✅ SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ msg: "✅ User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN
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

// ✅ GET PROFILE
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE PROFILE
app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ msg: "✅ Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all users (protected - admin/debug)
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 🔹 UPI Routes
// ==========================
app.use("/api", upiRouter);

// ==========================
// 🔹 Start Server
// ==========================
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

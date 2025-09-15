const express = require("express");
const connectDB = require("./db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");   // 🔑 add this

const app = express();

// connect database
connectDB();

// middlewares
app.use(express.json());
app.use(cors());  // 🔑 allow cross-origin requests

// test route
app.get("/", (req, res) => {
  res.send("🚀 Express + MongoDB server is working!");
});

// ✅ Sign Up
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ msg: "✅ User registered successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Sign In
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "❌ Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "❌ Invalid credentials" });
    }

    // generate JWT
    const token = jwt.sign({ id: user._id }, "mysecretkey", {
      expiresIn: "1h",
    });

    res.json({ msg: "✅ Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all users (for testing only)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// run server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

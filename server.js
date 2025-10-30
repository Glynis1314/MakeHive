require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const upload = require('./middleware/upload'); // Import shared upload middleware
// Models & routers
const User = require("./models/User");
const Product = require("./models/Product");
const Seller = require("./models/Seller"); // Import the new Seller model
const mockProducts = require("./src/mockProducts.js");
const cartRouter = require("./routes/cart");
const upiRouter = require("./routes/upi");
const adminRouter = require("./routes/admin"); // New admin router
const orderRouter = require("./routes/orders"); // New order router
const productRouter = require("./routes/products"); // New product router

// Initialize app
const app = express();

// Load environment variables
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "makehiveSuperSecretKey2025";

// Middlewares
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.url} Origin:${req.headers.origin || '-'} Auth:${req.headers.authorization ? 'yes' : 'no'}`);
  next();
});
// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// Add root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MakeHive API is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// (404 handler will be added after all routes)

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
// 🔹 Admin Middleware
// ==========================
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Admin access required" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error during admin check" });
  }
};
// ==========================
// 🔹 Routes
// ==========================

// Auth Routes
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

    // Check if the user is also a seller
    const seller = await Seller.findOne({ user: user._id });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ 
      msg: "✅ Login successful!", 
      token, role: user.role, 
      isSeller: !!seller  // Add isSeller flag to the response
    });
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
// ==========================
// 🔹 Forgot Password Route
// ==========================
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Generate a 15-minute JWT token
    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });

    // Use the actual frontend URL where reset.html is served
    const frontendURL = "http://127.0.0.1:5500"; // replace with your hosted URL when deployed
    const resetLink = `${frontendURL}/reset.html?token=${resetToken}`;

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: "glynisdarryldmello@gmail.com", 
        pass: "fzftikfwqhxrygog" // use App Password if 2FA enabled
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
// 🔹 Seller Routes
// ==========================

// GET seller info for the logged-in user
app.get("/seller", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found for this user." });
    }
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching seller data." });
  }
});

// GET orders for a specific seller
app.get("/seller/orders", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(404).json({ error: "Seller not found" });

    // Find products belonging to the seller
    const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id);

    // Find orders containing any of the seller's products
    const orders = await Order.find({ 'products.productId': { $in: sellerProductIds } }).populate('user', 'username');
    res.json(orders);
  } catch (err) {
    console.error("Fetch seller orders error:", err);
    res.status(500).json({ error: "Failed to fetch seller orders" });
  }
});

// GET products for a specific seller
app.get("/seller/products", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    const products = await Product.find({ sellerId: seller._id });
    res.json(products);
  } catch (err) {
    console.error("Fetch seller products error:", err);
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
});

// POST (create) a new product for a seller
app.post("/seller/products", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const seller = await Seller.findOne({ user: req.user.id });

    if (!seller) {
      return res.status(403).json({ error: "Only sellers can add products." });
    }
    if (!seller.isVerified) {
      return res.status(403).json({ error: "Your seller account is pending verification. You cannot add products yet." });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/images/default-banner.jpg';

    const newProduct = new Product({
      name,
      description,
      sellerId: seller._id,
      price,
      category: category || 'General',
      imageUrl
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// DELETE a product for a seller
app.delete("/seller/products/:productId", authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(403).json({ error: "You are not a seller." });

    const product = await Product.findOneAndDelete({ _id: req.params.productId, sellerId: seller._id });
    if (!product) return res.status(404).json({ error: "Product not found or you do not have permission to delete it." });

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// ==========================
// 🔹 Order Routes
// ==========================

// ==========================
// 🔹 Cart & Payment
// ==========================
app.use("/api/orders", authMiddleware, orderRouter); // Use the new order router
app.use("/api/cart", authMiddleware, cartRouter);
app.use("/api/products", productRouter); // Use the product router
app.use("/api/upi", authMiddleware, upiRouter);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRouter); // New admin routes

// Search products (should be placed after specific API routes)
app.get("/products", async (req, res) => {
  try {
    const query = req.query.q;
    let dbProducts = [];

    if (query) {
      // Search the database for matching products
      dbProducts = await Product.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } }
        ]
      }).lean();

      // Filter mock products by query
      const queryLower = query.toLowerCase();
      const filteredMockProducts = mockProducts.filter(product =>
        product.name.toLowerCase().includes(queryLower) ||
        (product.category && product.category.toLowerCase().includes(queryLower)) ||
        (product.seller && product.seller.toLowerCase().includes(queryLower))
      );
      // Ensure mock products have an _id for consistency with DB products
      const mockProductsWithId = filteredMockProducts.map(p => ({ 
        ...p,
        _id: p._id || p.id,
        imageUrl: p.imageUrl // Ensure imageUrl is explicitly carried over
      }));

      // Combine filtered DB products and filtered mock products
      // Explicitly ensure imageUrl is present for all products before sending
      const finalResults = [...dbProducts, ...mockProductsWithId].map(p => ({
        ...p,
        imageUrl: p.imageUrl || 'images/default-banner.jpg' // Fallback if imageUrl is somehow missing
      }));
      res.json(finalResults);

    } else {
      // If no query, fetch all products from the database
      dbProducts = await Product.find({}).lean();
      // Combine all database products with all mock products for a comprehensive list
      const allProducts = [...dbProducts, ...mockProducts.map(p => ({ ...p, _id: p._id || p.id, imageUrl: p.imageUrl || 'images/default-banner.jpg' }))]; // Ensure imageUrl is present
      res.json(allProducts);
    }
  } catch (err) {
    console.error("Product search error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ==========================
// 🔹 Review Routes
// ==========================
app.post('/api/products/:id/reviews', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user.id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ error: 'You have already reviewed this product.' });
      }

      const user = await User.findById(req.user.id);

      const review = {
        name: user.username,
        rating: Number(rating),
        comment,
        user: req.user.id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ error: 'Server error while submitting review.' });
  }
});

// 404 handler (after all routes)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling middleware (after routes)
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==========================
// 🔹 Start server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

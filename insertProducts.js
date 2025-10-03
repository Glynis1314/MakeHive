require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product"); // adjust path if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

// Sample products with actual names and sellers
const products = [
  { name: "Crochet Tote Bag", sellerName: "KnotAndNest", price: 799, image: "/images/crochet1.jpg" },
  { name: "Handmade Rakhi", sellerName: "SweetStore", price: 199, image: "/images/rakhi1.jpg" },
  { name: "Clay Pottery Vase", sellerName: "CraftyHands", price: 499, image: "/images/pottery1.jpg" },
  { name: "Handloom Scarf", sellerName: "FashionHub", price: 1299, image: "/images/scarf1.jpg" },
  { name: "Eco-friendly Tote Bag", sellerName: "EcoGoods", price: 699, image: "/images/tote1.jpg" },
  // ... add more products up to 100
];

// Insert products
async function insertProducts() {
  try {
    await Product.insertMany(products);
    console.log("✅ Products inserted successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

insertProducts();

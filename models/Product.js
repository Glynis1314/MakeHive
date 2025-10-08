// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  seller: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);

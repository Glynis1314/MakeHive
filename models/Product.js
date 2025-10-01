const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },  // keep this if needed
  qr: { type: String },        // seller-uploaded QR
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);

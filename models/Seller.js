const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessName: { type: String, required: true },
  description: { type: String },
  gstNumber: { type: String },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  paymentDetails: { type: Object } // for storing bank account / UPI info
});

module.exports = mongoose.model("Seller", SellerSchema);

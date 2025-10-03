const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const QRCode = require("qrcode");
const Order = require("../models/Order"); // optional, if you have an order model

// Route 1: Generate QR codes for selected products
// Body: { products: [productId1, productId2, ...] }
router.post("/", async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !products.length) {
      return res.status(400).json({ error: "No products selected" });
    }

    // Fetch products and populate seller info
    const productList = await Product.find({ _id: { $in: products } }).populate("seller");

    // Group products by seller
    const sellerMap = {};
    productList.forEach((prod) => {
      const sellerId = prod.seller._id.toString();
      if (!sellerMap[sellerId]) {
        sellerMap[sellerId] = {
          sellerName: prod.seller.username,
          upiId: prod.seller.upiId,
          total: 0,
          productList: []
        };
      }
      sellerMap[sellerId].total += prod.price;
      sellerMap[sellerId].productList.push({ name: prod.name, price: prod.price });
    });

    // Generate QR code per seller
    const result = [];
    for (const sellerId in sellerMap) {
      const seller = sellerMap[sellerId];
      const qrString = `upi://pay?pa=${seller.upiId}&pn=${seller.sellerName}&am=${seller.total}&cu=INR`; // <--- FIXED
      const qrCode = await QRCode.toDataURL(qrString);
      result.push({
        sellerId,
        sellerName: seller.sellerName,
        total: seller.total,
        qrCode,
        products: seller.productList
      });
    }

    res.json(result); // send all QR codes and product details
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Route 2: Confirm payment after QR scan
// Body: { sellerId, products: [productId1, productId2, ...] }
router.post("/confirm", async (req, res) => {
  try {
    const { sellerId, products } = req.body;
    if (!sellerId || !products || !products.length) {
      return res.status(400).json({ error: "Incomplete payment info" });
    }

    // Optional: create order in DB
    // await Order.create({ seller: sellerId, products, status: "Paid", paidAt: new Date() });

    res.json({ success: true, message: "Payment confirmed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const QRCode = require("qrcode");

// Body: { products: [productId1, productId2, ...] }
router.post("/", async (req, res) => {
  try {
    const { products } = req.body; // array of product IDs

    if (!products || !products.length) {
      return res.status(400).json({ error: "No products selected" });
    }

    // Fetch products and populate seller info
    const productList = await Product.find({ _id: { $in: products } }).populate("seller");

    // Group by seller
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
      const qrString = `upi://pay?pa=${seller.upiId}&pn=${seller.sellerName}&am=${seller.total}&cu=INR`;
      const qrCode = await QRCode.toDataURL(qrString);
      result.push({
        sellerId,
        sellerName: seller.sellerName,
        total: seller.total,
        qrCode,
        products: seller.productList
      });
    }

    res.json(result); // send all QR codes and details
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;

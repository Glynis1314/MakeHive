// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const mockProducts = require("../mockProducts");

// Search products (static + dynamic)
router.get("/search", async (req, res) => {
  const query = req.query.query?.toLowerCase() || "";

  // Filter static products
  const staticResults = mockProducts.filter(p => 
    p.name.toLowerCase().includes(query)
  );

  // Fetch dynamic products from DB
  const dynamicResults = await Product.find({
    name: { $regex: query, $options: "i" } // case-insensitive
  });

  // Combine results
  const combined = [...staticResults, ...dynamicResults];

  res.json(combined);
});

module.exports = router;

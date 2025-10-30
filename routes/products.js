const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

// GET a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('sellerId', 'businessName');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a review for a product
router.post('/:id/reviews', authMiddleware, async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Check if user has purchased this product
        const hasPurchased = await Order.findOne({ user: req.user.id, 'products.productId': productId });
        if (!hasPurchased) {
            return res.status(403).json({ message: 'You can only review products you have purchased.' });
        }

        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user.id.toString());
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        const review = {
            user: req.user.id,
            username: req.user.username, // Assuming username is on req.user
            rating: Number(rating),
            comment,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();

        // Update seller's average rating
        const seller = await Seller.findById(product.sellerId);
        if (seller) {
            const sellerProducts = await Product.find({ sellerId: seller._id });
            const totalReviews = sellerProducts.reduce((acc, p) => acc + p.numReviews, 0);
            const totalRating = sellerProducts.reduce((acc, p) => acc + (p.rating * p.numReviews), 0);
            
            seller.numReviews = totalReviews;
            seller.rating = totalReviews > 0 ? totalRating / totalReviews : 0;
            await seller.save();
        }

        res.status(201).json({ message: 'Review added successfully' });

    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
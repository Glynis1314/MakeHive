const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    businessName: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    gstNumber: { type: String },
    paymentDetails: { type: Object },
    bannerPicUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    rating: {
        type: Number,
        required: true,
        default: 0,
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Seller', sellerSchema);
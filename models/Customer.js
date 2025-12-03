const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    favoriteItems: [{
        name: String,
        count: Number
    }],
    pushSubscription: {
        type: Object,
        sparse: true
    }
}, {
    timestamps: true
});

// Indexes for optimized queries
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model('Customer', CustomerSchema);
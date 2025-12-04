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
        // Now required for login
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
    orderHistory: [{
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        items: [{
            name: String,
            quantity: Number,
            price: Number
        }],
        total: Number,
        status: String,
        orderDate: {
            type: Date,
            default: Date.now
        },
        pickupTime: String
    }],
    pushSubscription: {
        type: Object,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastOrder: {
        type: Date
    }
});

// Add index for faster phone lookups
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model('Customer', CustomerSchema);
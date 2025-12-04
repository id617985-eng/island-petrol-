const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        // Customer ID is optional for guest orders
    },
    items: [{
        name: String,
        price: Number,
        quantity: Number
    }],
    total: {
        type: Number,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled']
    },
    loyaltyPointsEarned: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for formatted order date
orderSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Static method to get orders by customer
orderSchema.statics.findByCustomer = function(customerId) {
    return this.find({ customerId }).sort({ createdAt: -1 });
};

// Instance method to mark as completed
orderSchema.methods.markAsCompleted = function() {
    this.status = 'completed';
    return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
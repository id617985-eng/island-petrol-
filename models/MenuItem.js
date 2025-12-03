const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['nachos', 'desserts', 'drinks', 'appetizers', 'main course', 'sides', 'specials'],
        default: 'nachos'
    },
    ingredients: [{
        type: String,
        trim: true
    }],
    preparationTime: {
        type: String,
        default: '10-15 minutes'
    },
    imageUrl: {
        type: String,
        default: '/images/default-food.jpg'
    },
    active: {
        type: Boolean,
        default: true
    },
    popular: {
        type: Boolean,
        default: false
    },
    special: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Update timestamp before saving
menuItemSchema.pre('save', function(next) {
    if (this.isModified()) {
        this.updatedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
    description: String,
    ingredients: String,
    
    category: {
        type: String,
        enum: ["nachos", "desserts", "drinks", "specials"], // ALL 4 CATEGORIES
        required: true
    },

    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);
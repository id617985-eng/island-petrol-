const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    available: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        default: 'nachos'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Availability', availabilitySchema);
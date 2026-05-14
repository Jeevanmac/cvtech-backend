const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    adminSupportEmail: {
        type: String,
        default: 'cvtechindia18@gmail.com'
    },
    adminPhoneNumber: {
        type: String,
        default: '+91 9876543210'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);

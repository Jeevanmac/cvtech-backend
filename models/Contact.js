const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Identity is required for synchronization.']
    },
    email: {
        type: String,
        required: [true, 'Contact email is required.'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email node.']
    },
    phone: {
        type: String
    },
    interest: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: [true, 'Strategic intent summary is required.'],
        maxlength: [2000, 'Payload exceeds buffer limits.']
    },
    status: {
        type: String,
        enum: ['new', 'processing', 'resolved'],
        default: 'new'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);

const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['welcome', 'otp', 'purchase', 'password_reset', 'payment_failed', 'generic'],
        default: 'generic',
        index: true
    },
    status: {
        type: String,
        enum: ['delivered', 'failed'],
        required: true,
        index: true
    },
    error: String,
    messageId: String,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);

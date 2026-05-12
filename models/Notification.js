const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Target user, or admin if specifically flagged
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['order', 'message', 'system', 'security'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);

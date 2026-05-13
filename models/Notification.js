const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional if role-based (like 'admin')
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    type: {
        type: String,
        enum: [
            'message', 
            'contact', 
            'application', 
            'application_update', 
            'job_posted', 
            'approval', 
            'alert', 
            'system'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: false
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// Indexing for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

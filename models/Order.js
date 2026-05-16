const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Multiple projects can be purchased
        projects: [
            {
                projectId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Project',
                    required: true
                },
                priceAtPurchase: {
                    type: Number,
                    required: true
                }
            }
        ],
        razorpayOrderId: {
            type: String,
            required: true
        },
        razorpayPaymentId: {
            type: String
        },
        razorpaySignature: {
            type: String
        },
        totalAmount: {
            type: Number,
            required: true
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        couponCode: {
            type: String,
            uppercase: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending'
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        maxDownloads: {
            type: Number,
            default: 5
        },
        // Tracking details for security profiling
        logs: [
            {
                ipAddress: { type: String },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

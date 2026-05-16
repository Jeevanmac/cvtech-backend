const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema(
    {
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        userEmail: {
            type: String,
            required: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        projectIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project'
            }
        ],
        discountApplied: {
            type: Number,
            required: true
        },
        originalPrice: {
            type: Number,
            required: true
        },
        finalPrice: {
            type: Number,
            required: true
        },
        ipAddress: {
            type: String
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('CouponUsage', couponUsageSchema);

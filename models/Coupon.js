const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon alphanumeric code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        campaignName: {
            type: String,
            required: [true, 'Campaign name is required'],
            trim: true
        },
        discountPercentage: {
            type: Number,
            required: [true, 'Discount percentage is required'],
            min: [1, 'Minimum discount is 1%'],
            max: [100, 'Maximum discount is 100%']
        },
        createdByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        usageLimit: {
            type: Number,
            default: 100 // Total times this coupon can be used across all users
        },
        usedCount: {
            type: Number,
            default: 0
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiration date is required'],
            index: true
        },
        minimumPurchase: {
            type: Number,
            default: 0
        },
        applicableProjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project'
            }
        ],
        isGlobal: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for remaining count
couponSchema.virtual('remainingCount').get(function() {
    return Math.max(0, this.usageLimit - this.usedCount);
});

// Virtual for status check
couponSchema.virtual('status').get(function() {
    const now = new Date();
    if (!this.isActive) return 'Disabled';
    if (now > this.expiryDate) return 'Expired';
    if (this.usedCount >= this.usageLimit) return 'Exhausted';
    return 'Active';
});

module.exports = mongoose.model('Coupon', couponSchema);

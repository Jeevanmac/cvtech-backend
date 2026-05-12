const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon alphanumeric code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [7, 'Code must be exactly 7 characters'],
            maxlength: [7, 'Code must be exactly 7 characters'],
            match: [/^[A-Z0-9]{7}$/, 'Must be a 7-character alphanumeric string']
        },
        discountPercentage: {
            type: Number,
            required: [true, 'Discount percentage is required'],
            min: [1, 'Minimum discount is 1%'],
            max: [100, 'Maximum discount is 100%']
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration date is required']
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);

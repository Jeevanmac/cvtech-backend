const Coupon = require('../models/Coupon');

/**
 * @desc    Validate a 7-character coupon code logic
 * @route   POST /api/coupons/validate
 * @access  Private 
 */
const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code || code.length !== 7) {
            return res.status(400).json({ success: false, message: 'Invalid format. Promo architectures mathematically require exactly 7 characters.' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Promotional index missing.' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon token has been revoked manually.' });
        }

        const now = new Date();
        if (now > coupon.expiresAt) {
            return res.status(400).json({ success: false, message: 'The temporal constraints of this token expired.' });
        }

        res.status(200).json({ 
            success: true, 
            discountPercentage: coupon.discountPercentage,
            message: `Validated. Applied ${coupon.discountPercentage}% deduction.`
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Promo engine verification failure.' });
    }
};

/**
 * @desc    Deploy a new promotional parameter
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expiresAt } = req.body;

        const newCoupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercentage,
            expiresAt
        });

        res.status(201).json({ success: true, newCoupon });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Engine failure writing promo schema.' });
    }
};

module.exports = {
    validateCoupon,
    createCoupon
};

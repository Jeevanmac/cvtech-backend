const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Project = require('../models/Project');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * @desc    Generate a random unique coupon code
 * @returns {string} e.g., CVTECH-A1B2-C3D4
 */
const generateCode = (prefix = 'CVTECH') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
    const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${part1}-${part2}`;
};

/**
 * @desc    Admin: Create a new coupon campaign
 * @route   POST /api/admin/coupons/create
 */
const createCoupon = async (req, res) => {
    try {
        const { 
            campaignName, 
            discountPercentage, 
            usageLimit, 
            expiryDate, 
            minimumPurchase, 
            applicableProjects, 
            isGlobal,
            totalToGenerate = 1,
            customPrefix 
        } = req.body;

        const coupons = [];
        for (let i = 0; i < totalToGenerate; i++) {
            const code = generateCode(customPrefix || 'CVTECH');
            coupons.push({
                code,
                campaignName,
                discountPercentage,
                usageLimit,
                expiryDate,
                minimumPurchase,
                applicableProjects,
                isGlobal,
                createdByAdmin: req.user._id
            });
        }

        const createdCoupons = await Coupon.insertMany(coupons);
        logger.info(`[ADMIN] Generated ${createdCoupons.length} coupons for campaign: ${campaignName}`);
        
        res.status(201).json({ success: true, coupons: createdCoupons });
    } catch (err) {
        logger.error(`Coupon creation error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Promotional engine failed to ignite.' });
    }
};

/**
 * @desc    Admin: Get all coupons with analytics
 * @route   GET /api/admin/coupons
 */
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('createdByAdmin', 'firstName lastName')
            .sort({ createdAt: -1 });

        // Calculate global analytics
        const totalDiscountsGiven = await CouponUsage.aggregate([
            { $group: { _id: null, total: { $sum: "$discountApplied" } } }
        ]);

        res.status(200).json({ 
            success: true, 
            coupons,
            analytics: {
                totalDiscounts: totalDiscountsGiven[0]?.total || 0,
                activeCount: coupons.filter(c => c.status === 'Active').length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Registry retrieval failure.' });
    }
};

/**
 * @desc    Admin: Toggle coupon status
 * @route   PATCH /api/admin/coupons/:id/toggle
 */
const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.status(200).json({ success: true, coupon });
    } catch (err) {
        res.status(500).json({ success: false, message: 'State transition fault.' });
    }
};

/**
 * @desc    Admin: Delete coupon (soft delete by marking inactive or hard delete if no usage)
 * @route   DELETE /api/admin/coupons/:id
 */
const deleteCoupon = async (req, res) => {
    try {
        const usage = await CouponUsage.findOne({ couponId: req.params.id });
        if (usage) {
            return res.status(400).json({ 
                success: false, 
                message: 'Coupon has historical usage logs. Suggest disabling instead of purging.' 
            });
        }

        await Coupon.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Coupon purged from registry.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Purge sequence failure.' });
    }
};

/**
 * @desc    Admin: Get users who used a specific coupon
 * @route   GET /api/admin/coupons/:id/users
 */
const getCouponUsers = async (req, res) => {
    try {
        const usage = await CouponUsage.find({ couponId: req.params.id })
            .populate('userId', 'firstName lastName email')
            .populate('projectIds', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, usage });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Usage log extraction failure.' });
    }
};

/**
 * @desc    User: Validate coupon code for current cart/project
 * @route   POST /api/coupons/validate
 */
const validateCoupon = async (req, res) => {
    try {
        const { code, projectIds, subtotal } = req.body;

        if (!code) return res.status(400).json({ success: false, message: 'No code provided.' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });

        // Basic validations
        if (!coupon.isActive) return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
        if (new Date() > coupon.expiryDate) return res.status(400).json({ success: false, message: 'This coupon has expired.' });
        if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });

        // Financial validation
        if (subtotal < coupon.minimumPurchase) {
            return res.status(400).json({ 
                success: false, 
                message: `Minimum purchase of ₹${coupon.minimumPurchase} required for this coupon.` 
            });
        }

        // Project eligibility validation
        if (!coupon.isGlobal) {
            const isEligible = projectIds.some(pid => coupon.applicableProjects.includes(pid));
            if (!isEligible) {
                return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected projects.' });
            }
        }

        // Check if user has already used this coupon
        const existingUsage = await CouponUsage.findOne({ couponId: coupon._id, userId: req.user._id });
        if (existingUsage) {
            return res.status(400).json({ success: false, message: 'You have already redeemed this coupon.' });
        }

        res.status(200).json({ 
            success: true, 
            discountPercentage: coupon.discountPercentage,
            couponId: coupon._id,
            message: 'Coupon applied successfully!' 
        });
    } catch (err) {
        logger.error(`Validation error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Validation engine crash.' });
    }
};

module.exports = {
    createCoupon,
    getAllCoupons,
    toggleCouponStatus,
    deleteCoupon,
    getCouponUsers,
    validateCoupon
};

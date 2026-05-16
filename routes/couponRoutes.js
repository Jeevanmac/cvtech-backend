const express = require('express');
const router = express.Router();
const { 
    createCoupon, 
    getAllCoupons, 
    toggleCouponStatus, 
    deleteCoupon, 
    getCouponUsers, 
    validateCoupon 
} = require('../controllers/couponController');
const { protect, isAdmin } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// User Routes
router.post('/validate', protect, strictLimiter, validateCoupon);

// Admin Routes
router.use(protect, isAdmin);
router.get('/', getAllCoupons);
router.post('/create', createCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);
router.get('/:id/users', getCouponUsers);

module.exports = router;

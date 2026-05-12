const express = require('express');
const router = express.Router();
const { validateCoupon, createCoupon } = require('../controllers/couponController');
const { protect, isAdmin } = require('../middleware/auth');

// Public facing 
router.post('/validate', protect, validateCoupon);

// Configuration overrides securely isolated
router.post('/', protect, isAdmin, createCoupon);

module.exports = router;

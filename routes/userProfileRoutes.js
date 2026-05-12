const express = require('express');
const router = express.Router();
const { toggleWishlist, addToCart, removeFromCart, getDashboardStats } = require('../controllers/userProfileController');
const { protect } = require('../middleware/auth');

// All Profile interaction bounds demand authentication mapping
router.use(protect);

router.post('/wishlist/toggle', toggleWishlist);
router.post('/cart/add', addToCart);
router.post('/cart/remove', removeFromCart);
router.get('/dashboard', getDashboardStats);

module.exports = router;

const User = require('../models/User');
const Project = require('../models/Project');
const generateSignedUrl = require('../utils/generateSignedUrl');

/**
 * @desc    Toggle project in User Wishlist (If exists, remove. If missing, add)
 * @route   POST /api/profile/wishlist/toggle
 * @access  Private
 */
const toggleWishlist = async (req, res) => {
    try {
        const { projectId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ success: false, message: 'Identity missing' });

        const isFavorited = user.wishlist.some(id => id.toString() === projectId);

        if (isFavorited) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== projectId);
        } else {
            user.wishlist.push(projectId);
        }

        await user.save();
        res.status(200).json({ success: true, wishlist: user.wishlist });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Wishlist update failed.' });
    }
};

/**
 * @desc    Add project to Cart
 * @route   POST /api/profile/cart/add
 * @access  Private
 */
const addToCart = async (req, res) => {
    try {
        const { projectId } = req.body;
        const user = await User.findById(req.user._id);

        if (user.cart.some(id => id.toString() === projectId)) {
            return res.status(400).json({ success: false, message: 'Asset already docked in your deployment cart.' });
        }
        
        user.cart.push(projectId);
        await user.save();
        
        res.status(200).json({ success: true, cart: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Cart update blocked.' });
    }
};

/**
 * @desc    Remove project from Cart
 * @route   POST /api/profile/cart/remove
 * @access  Private
 */
const removeFromCart = async (req, res) => {
    try {
        const { projectId } = req.body;
        const user = await User.findById(req.user._id);

        user.cart = user.cart.filter(id => id.toString() !== projectId);
        await user.save();

        res.status(200).json({ success: true, cart: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Cart removal failed.' });
    }
};

/**
 * @desc    Get complete Profile Dashboard context (Purchases w/ Project Metadata)
 * @route   GET /api/profile/dashboard
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
    try {
        // Deep populate the nested projectId in the purchases array
        const user = await User.findById(req.user._id)
                               .populate('purchases.projectId', 'title images imageKeys category techStack documentationUrl')
                               .select('-password');
                               
        if (!user) return res.status(404).json({ success: false, message: 'User configuration lost.' });

        // Generate signed URLs for all purchased projects
        const purchases = await Promise.all(user.purchases.map(async (purchase) => {
            const purchaseObj = purchase.toObject();
            if (purchaseObj.projectId && purchaseObj.projectId.imageKeys) {
                purchaseObj.projectId.imageUrls = await Promise.all(
                    purchaseObj.projectId.imageKeys.map(key => generateSignedUrl(key))
                );
            } else if (purchaseObj.projectId) {
                purchaseObj.projectId.imageUrls = [];
            }
            return purchaseObj;
        }));

        res.status(200).json({ success: true, purchases, userProfile: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed fetching dashboard telemetrics.' });
    }
};

/**
 * @desc    Delete a purchase from user library (Permanent unless repurchased)
 * @route   DELETE /api/profile/purchases/:purchaseId
 * @access  Private
 */
const deletePurchase = async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ success: false, message: 'Identity missing' });

        // Filter out the purchase record
        user.purchases = user.purchases.filter(p => p._id.toString() !== purchaseId);
        await user.save();

        res.status(200).json({ success: true, message: 'Asset removed from library.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Purge sequence failed.' });
    }
};

module.exports = {
    toggleWishlist,
    addToCart,
    removeFromCart,
    getDashboardStats,
    deletePurchase
};

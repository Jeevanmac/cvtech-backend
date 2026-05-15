const { protect, isAdmin } = require('./auth');

/**
 * Convenience wrapper for administrative access control.
 * Re-exports core auth logic to satisfy architectural requirements.
 */
module.exports = {
    protect,
    admin: isAdmin
};

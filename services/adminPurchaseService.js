const User = require('../models/User');

/**
 * Service to handle administrative purchase operations
 */
const getUserPurchases = async (userId) => {
    return await User.findById(userId)
        .select('firstName lastName email role createdAt purchases')
        .populate('purchases.projectId', 'title images price category imageKeys');
};

const updatePurchaseStatus = async (purchaseId, updateData) => {
    const user = await User.findOne({ 'purchases._id': purchaseId });
    if (!user) return null;

    const purchaseIndex = user.purchases.findIndex(p => p._id.toString() === purchaseId);
    if (purchaseIndex === -1) return null;

    // Apply updates to the specific purchase subdocument
    Object.keys(updateData).forEach(key => {
        user.purchases[purchaseIndex][key] = updateData[key];
    });

    await user.save();
    return user.purchases[purchaseIndex];
};

const removePurchaseRecord = async (purchaseId) => {
    const user = await User.findOne({ 'purchases._id': purchaseId });
    if (!user) return false;

    user.purchases = user.purchases.filter(p => p._id.toString() !== purchaseId);
    await user.save();
    return true;
};

module.exports = {
    getUserPurchases,
    updatePurchaseStatus,
    removePurchaseRecord
};

const adminPurchaseService = require('../services/adminPurchaseService');
const logger = require('../utils/logger');
const generateSignedUrl = require('../utils/generateSignedUrl');

/**
 * @desc    Get all purchases for a specific user with full project details
 * @route   GET /api/admin/users/:id/purchases
 * @access  Private/Admin
 */
const getUserPurchases = async (req, res) => {
    try {
        const user = await adminPurchaseService.getUserPurchases(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const totalPurchases = user.purchases.length;
        const totalDownloads = user.purchases.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

        // Generate signed URLs for all projects in the purchases
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

        res.status(200).json({ 
            success: true, 
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                totalPurchases,
                totalDownloads
            },
            purchases: purchases 
        });
    } catch (error) {
        logger.error(`Error fetching user purchases for admin: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Revoke access to a specific project purchase
 * @route   PATCH /api/admin/purchases/:purchaseId/revoke
 * @access  Private/Admin
 */
const revokePurchaseAccess = async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const { reason } = req.body;

        logger.info(`[ADMIN] Revoking purchase access for ID: ${purchaseId}...`);

        const purchase = await adminPurchaseService.updatePurchaseStatus(purchaseId, {
            accessRevoked: true,
            revokedAt: Date.now(),
            revokedBy: req.user._id,
            revokeReason: reason || 'Administrative revocation'
        });

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase record not found' });
        }

        logger.info(`[ADMIN] Purchase ${purchaseId} revoked successfully. User access removed.`);

        res.status(200).json({ 
            success: true, 
            message: 'Access revoked successfully',
            purchase
        });
    } catch (error) {
        logger.error(`Error revoking purchase access: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Restore access to a previously revoked project purchase
 * @route   PATCH /api/admin/purchases/:purchaseId/restore
 * @access  Private/Admin
 */
const restorePurchaseAccess = async (req, res) => {
    try {
        const { purchaseId } = req.params;

        logger.info(`[ADMIN] Restoring purchase access for ID: ${purchaseId}...`);

        const purchase = await adminPurchaseService.updatePurchaseStatus(purchaseId, {
            accessRevoked: false,
            revokedAt: null,
            revokedBy: null,
            revokeReason: null
        });

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase record not found' });
        }

        logger.info(`[ADMIN] Purchase ${purchaseId} restored successfully.`);

        res.status(200).json({ 
            success: true, 
            message: 'Access restored successfully',
            purchase
        });
    } catch (error) {
        logger.error(`Error restoring purchase access: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Flag a purchase for suspicious activity
 * @route   PATCH /api/admin/purchases/:purchaseId/flag
 * @access  Private/Admin
 */
const flagPurchase = async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const { flag } = req.body;

        const purchase = await adminPurchaseService.updatePurchaseStatus(purchaseId, {
            suspiciousFlag: flag !== undefined ? flag : true
        });

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase record not found' });
        }

        res.status(200).json({ 
            success: true, 
            message: `Purchase ${purchase.suspiciousFlag ? 'flagged' : 'unflagged'} successfully`,
            purchase
        });
    } catch (error) {
        logger.error(`Error flagging purchase: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Permanently delete a purchase record
 * @route   DELETE /api/admin/purchases/:purchaseId
 * @access  Private/Admin
 */
const deletePurchase = async (req, res) => {
    try {
        const { purchaseId } = req.params;

        logger.info(`[ADMIN] Permanently deleting purchase record: ${purchaseId}...`);

        const success = await adminPurchaseService.removePurchaseRecord(purchaseId);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Purchase record not found' });
        }

        logger.info(`[ADMIN] Purchase record ${purchaseId} deleted successfully.`);

        res.status(200).json({ success: true, message: 'Purchase record deleted permanently' });
    } catch (error) {
        logger.error(`Error deleting purchase record: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUserPurchases,
    revokePurchaseAccess,
    restorePurchaseAccess,
    flagPurchase,
    deletePurchase
};

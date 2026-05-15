const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const Project = require('../models/Project');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Admin manually overrides user tracking to grant a complete project purchase record.
 * @route   POST /api/admin/grant-access
 * @access  Private/Admin
 */
const grantAccess = async (req, res) => {
    try {
        const { userId, projectId, orderIdObj } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Identity missing.'});

        user.purchases.push({
            projectId: projectId,
            orderId: orderIdObj || `admin_grant_${Date.now()}`,
            downloadCount: 0
        });

        await user.save();
        res.status(200).json({ success: true, message: `Access forcibly mapped into Monolith for target User.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Authorization overriding failure.' });
    }
};

/**
 * @desc    Admin forcibly rewrites user array to revoke active project access keys.
 * @route   POST /api/admin/revoke-access
 * @access  Private/Admin
 */
const revokeAccess = async (req, res) => {
    try {
        const { userId, projectId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Identity missing.'});

        user.purchases = user.purchases.filter(p => p.projectId.toString() !== projectId);
        
        await user.save();
        res.status(200).json({ success: true, message: `Project token permissions severed.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Revocation parameter fault.' });
    }
};

/**
 * @desc    Admin selectively overrides S3 extraction bounds for user constraints tracking.
 * @route   POST /api/admin/reset-downloads
 * @access  Private/Admin
 */
const resetDownloadCount = async (req, res) => {
    try {
        const { userId, projectId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Identity missing.'});

        const purchaseIndex = user.purchases.findIndex(p => p.projectId.toString() === projectId);
        if (purchaseIndex === -1) {
            return res.status(404).json({ success: false, message: 'Purchase registry missing for this entity.' });
        }

        // Hard reset
        user.purchases[purchaseIndex].downloadCount = 0;
        await user.save();

        res.status(200).json({ success: true, message: `Download quota artificially renewed.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Metric configuration rewriting failed.' });
    }
};

/**
 * @desc    Get macro administrative analytics including revenues and suspicious anomalies
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res) => {
    try {
        const totalSalesObj = await Order.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        const revenue = totalSalesObj[0] ? totalSalesObj[0].totalRevenue : 0;
        const totalSales = totalSalesObj[0] ? totalSalesObj[0].count : 0;

        const totalUsers = await User.countDocuments();
        const activeProjects = await Project.countDocuments();

        const popularProjects = await Project.find().sort({ purchaseCount: -1 }).limit(5).select('title purchaseCount category price');
        
        const failedPayments = await Order.find({ status: 'failed' }).populate('userId', 'email').limit(10);
        
        // Find suspicious activity checking orders where logs map multiple IPs (basic heuristic)
        const suspiciousActivity = await Order.aggregate([
            { $match: { status: 'success' } },
            { $project: { userId: 1, logs: 1, ipCount: { $size: { $setUnion: "$logs.ipAddress" } } } },
            { $match: { ipCount: { $gt: 2 } } }
        ]).limit(10);

        // Recent successful activity
        const recentActivity = await Order.find({ status: 'success' })
            .populate('userId', 'name email')
            .populate('projects.projectId', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            revenue,
            totalSales,
            totalUsers,
            activeProjects,
            popularProjects,
            failedPayments,
            suspiciousActivity,
            recentActivity
        });
    } catch (err) {
        logger.error(`Analytics map failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Aggregation failure' });
    }
};

/**
 * @desc    Fetch all user message threads meant for admin support
 * @route   GET /api/admin/messages
 * @access  Private/Admin
 */
const getAdminMessages = async (req, res) => {
    try {
        // Fetch all messages involving the support channel (receiverId is null) or sent by admins
        const messages = await Message.find({
            $or: [
                { receiverId: null },
                { senderId: req.user._id } // Or any admin really, but for now simple structure
            ]
        }).populate('senderId', 'firstName lastName email role').populate('receiverId', 'firstName lastName email role').sort({ createdAt: -1 });

        // Group messages by user
        const threads = {};
        messages.forEach(msg => {
            const userRef = msg.receiverId === null ? msg.senderId : msg.receiverId;
            if (!userRef || userRef._id.toString() === req.user._id.toString()) return; // Skip if self

            const userIdStr = userRef._id.toString();
            if (!threads[userIdStr]) {
                threads[userIdStr] = {
                    user: userRef,
                    messages: [],
                    lastMessageAt: msg.createdAt
                };
            }
            threads[userIdStr].messages.push(msg);
        });

        res.status(200).json({ success: true, threads: Object.values(threads) });
    } catch (err) {
        logger.error(`Admin message fetch failed: ${err.message}`);
        res.status(500).json({ success: false, message: 'Message thread extraction failed.' });
    }
};

/**
 * @desc    Fetch internal raw Winston Server Logs natively
 * @route   GET /api/admin/logs
 * @access  Private/Admin
 */
const getSystemLogs = async (req, res) => {
    try {
        const errorLogPath = path.join(__dirname, '../logs/error.log');
        let logs = [];
        if (fs.existsSync(errorLogPath)) {
            const rawLogs = fs.readFileSync(errorLogPath, 'utf8');
            // Split trailing newlines map 
            logs = rawLogs.trim().split('\n').map(line => JSON.parse(line)).slice(-50); // Last 50 lines
        }
        res.status(200).json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: 'File mapping failed natively.' });
    }
};

/**
 * @desc    Elevate or demote user identities (SuperUser only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/SuperUser
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid target role tier.' });
        }

        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: 'Identity node not found.' });
        }

        if (userToUpdate.role === 'superuser' || userToUpdate.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Root identities cannot be modified.' });
        }

        userToUpdate.role = role;
        await userToUpdate.save();

        res.status(200).json({
            success: true,
            message: `Identity tier updated to ${role} for ${userToUpdate.email}`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Role mapping failure.' });
    }
};

/**
 * @desc    Fetch all registered identities in the monolithic core
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort('-createdAt');
        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Identity registry retrieval failure.' });
    }
};

/**
 * @desc    Super Admin creates an administrative user securely.
 * @route   POST /api/admin/create-admin
 * @access  Private/SuperAdmin
 */
const createAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing fields for manual administrative genesis.' });
        }
        
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already mapped to an identity.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        res.status(201).json({ success: true, message: `Administrator deployed: ${newAdmin.email}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Admin generation failed.' });
    }
};

/**
 * @desc    Super Admin elevates standard user to admin
 * @route   PATCH /api/admin/promote/:userId
 * @access  Private/SuperAdmin
 */
const promoteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User completely missing.' });

        if (user.role === 'superadmin' || user.role === 'superuser') return res.status(403).json({ success: false, message: 'Protection bounding prevents root escalation.' });

        user.role = 'admin';
        await user.save();
        res.status(200).json({ success: true, message: `Identity ${user.email} escalated to Administrator.`});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Promotion failure.' });
    }
};

/**
 * @desc    Super Admin demotes admin back to standard user
 * @route   PATCH /api/admin/demote/:userId
 * @access  Private/SuperAdmin
 */
const demoteAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User missing from central schema.' });

        if (user.role === 'superadmin' || user.role === 'superuser') return res.status(403).json({ success: false, message: 'Cannot demote the root entity.' });

        user.role = 'user';
        await user.save();
        res.status(200).json({ success: true, message: `Administrator ${user.email} safely demoted.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Demotion mapping fault.' });
    }
};

/**
 * @desc    Fetch all transaction logs in the monolith (Admin only)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'firstName lastName email')
            .populate('projects.projectId', 'title price')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, orders });
    } catch (err) {
        logger.error(`Admin order fetch failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Registry extraction failed.' });
    }
};


/**
 * @desc    Delete a single transaction log entry
 * @route   DELETE /api/admin/orders/:id
 * @access  Private/Admin
 */
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        await Order.findByIdAndDelete(req.params.id);
        logger.info(`[ADMIN] ${req.user.email} deleted transaction log: ${req.params.id}`);
        
        res.status(200).json({ success: true, message: 'Transaction log purged.' });
    } catch (err) {
        logger.error(`Order deletion failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Registry erasure fault.' });
    }
};

/**
 * @desc    Clear all transaction logs (Admin only)
 * @route   DELETE /api/admin/orders
 * @access  Private/Admin
 */
const clearAllOrders = async (req, res) => {
    try {
        await Order.deleteMany({});
        logger.warn(`[ADMIN] ${req.user.email} WIPED ALL TRANSACTION LOGS`);
        
        res.status(200).json({ success: true, message: 'All transaction logs permanently cleared.' });
    } catch (err) {
        logger.error(`Bulk order deletion failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Mass registry erasure fault.' });
    }
};

/**
 * @desc    Permanently erase a user identity and all associated data
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
async function deleteUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Identity not found.' });

        // Safety check: Cannot delete superuser or self
        if (user.role === 'superuser' || user.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Root identities are immutable.' });
        }
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Self-termination not allowed via this interface.' });
        }

        await User.findByIdAndDelete(req.params.id);
        
        logger.info(`[ADMIN] ${req.user.email} permanently deleted user ${user.email}`);
        
        res.status(200).json({ success: true, message: 'User permanently deleted' });
    } catch (err) {
        logger.error(`User deletion failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Identity erasure fault.' });
    }
}

/**
 * @desc    Toggle suspension status for a user
 * @route   PATCH /api/admin/users/:id/suspend
 * @access  Private/Admin
 */
async function toggleSuspendUser(req, res) {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Identity not found.' });

        if (user.role === 'superuser' || user.role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Root identities cannot be suspended.' });
        }

        user.isSuspended = !user.isSuspended;
        if (user.isSuspended) {
            user.suspendedReason = reason || 'Administrative suspension';
        } else {
            user.suspendedReason = null;
        }

        await user.save();
        
        logger.info(`[ADMIN] ${req.user.email} ${user.isSuspended ? 'suspended' : 'reinstated'} user ${user.email}`);
        
        res.status(200).json({ 
            success: true, 
            message: `User ${user.isSuspended ? 'suspended' : 'reinstated'} successfully`,
            isSuspended: user.isSuspended
        });
    } catch (err) {
        logger.error(`Suspension toggle failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Suspension state mapping fault.' });
    }
}

module.exports = {
    grantAccess,
    revokeAccess,
    resetDownloadCount,
    getAnalytics,
    getAdminMessages,
    getSystemLogs,
    updateUserRole,
    getAllUsers,
    createAdmin,
    promoteUser,
    demoteAdmin,
    getOrders,
    deleteOrder,
    clearAllOrders,
    deleteUser,
    toggleSuspendUser
};

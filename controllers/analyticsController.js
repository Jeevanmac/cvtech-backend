const User = require('../models/User');
const Order = require('../models/Order');
const Project = require('../models/Project');
const EmailLog = require('../models/EmailLog');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const logger = require('../utils/logger');
const os = require('os');

/**
 * @desc    Get Comprehensive Strategic Matrix Analytics
 * @route   GET /api/admin/analytics/matrix
 * @access  Private/Admin
 */
const getMatrixAnalytics = async (req, res) => {
    try {
        const { range = '30d' } = req.query;
        
        // Define time boundary
        const now = new Date();
        let startDate = new Date();
        if (range === '24h') startDate.setHours(now.getHours() - 24);
        else if (range === '7d') startDate.setDate(now.getDate() - 7);
        else startDate.setDate(now.getDate() - 30);

        // 1. KPI Aggregations
        const [
            userCount,
            totalRevenueObj,
            totalPurchases,
            activeCoupons,
            emailStats,
            totalDownloadsObj
        ] = await Promise.all([
            User.countDocuments(),
            Order.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.countDocuments({ status: 'success' }),
            Coupon.countDocuments({ status: 'Active' }),
            EmailLog.aggregate([
                { $group: { 
                    _id: "$status", 
                    count: { $sum: 1 } 
                } }
            ]),
            User.aggregate([
                { $unwind: "$purchases" },
                { $group: { _id: null, total: { $sum: "$purchases.downloadCount" } } }
            ])
        ]);

        const revenue = totalRevenueObj[0]?.total || 0;
        const downloads = totalDownloadsObj[0]?.total || 0;
        
        // Map email stats
        const deliveredEmails = emailStats.find(s => s._id === 'delivered')?.count || 0;
        const failedEmails = emailStats.find(s => s._id === 'failed')?.count || 0;

        // 2. Revenue Over Time (Area Chart)
        const revenueOverTime = await Order.aggregate([
            { $match: { status: 'success', createdAt: { $gte: startDate } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$totalAmount" }
            } },
            { $sort: { "_id": 1 } }
        ]);

        // 3. User Growth (Line Chart)
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            } },
            { $sort: { "_id": 1 } }
        ]);

        // 4. System Metrics (Process & OS)
        const systemMetrics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuLoad: os.loadavg(),
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            nodeVersion: process.version,
            platform: process.platform
        };

        // 5. Email breakdown
        const emailBreakdown = await EmailLog.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        // 6. Recent Activity Feed
        // We'll combine recent orders, new users, and email logs
        const [recentOrders, recentUsers, recentEmails] = await Promise.all([
            Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'email firstName lastName'),
            User.find().sort({ createdAt: -1 }).limit(5),
            EmailLog.find().sort({ createdAt: -1 }).limit(5)
        ]);

        const activityFeed = [
            ...recentOrders.map(o => ({ type: 'purchase', user: o.userId?.email || 'Guest', amount: o.totalAmount, status: o.status, time: o.createdAt })),
            ...recentUsers.map(u => ({ type: 'registration', user: u.email, status: 'success', time: u.createdAt })),
            ...recentEmails.filter(e => e.status === 'failed').map(e => ({ type: 'email_failure', user: e.to, status: 'failed', time: e.createdAt }))
        ].sort((a, b) => b.time - a.time).slice(0, 10);

        res.status(200).json({
            success: true,
            kpis: {
                totalUsers: userCount,
                totalRevenue: revenue,
                totalPurchases,
                activeCoupons,
                totalDownloads: downloads,
                emailsSent: deliveredEmails + failedEmails,
                emailsDelivered: deliveredEmails,
                emailsFailed: failedEmails,
                successRate: deliveredEmails > 0 ? ((deliveredEmails / (deliveredEmails + failedEmails)) * 100).toFixed(1) : 100
            },
            charts: {
                revenue: revenueOverTime,
                users: userGrowth,
                emailBreakdown
            },
            system: systemMetrics,
            activityFeed
        });

    } catch (err) {
        logger.error(`Matrix Analytics Fault: ${err.message}`);
        res.status(500).json({ success: false, message: 'Intelligence extraction failure.' });
    }
};

module.exports = {
    getMatrixAnalytics
};

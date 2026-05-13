const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
    try {
        const query = {
            $or: [
                { recipient: req.user._id },
                { recipientRole: req.user.role }
            ]
        };

        const rawNotifications = await Notification.find(query)
            .sort('-createdAt')
            .limit(50);

        const notifications = rawNotifications.map(n => {
            const nObj = n.toObject();
            nObj.isRead = (n.readBy && Array.isArray(n.readBy)) ? n.readBy.includes(req.user._id) : false;
            return nObj;
        });

        const unreadCount = await Notification.countDocuments({ 
            ...query, 
            readBy: { $ne: req.user._id } 
        });

        res.status(200).json({ 
            success: true, 
            notifications,
            unreadCount 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Notification retrieval fault.' });
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { 
                _id: req.params.id,
                $or: [
                    { recipient: req.user._id },
                    { recipientRole: req.user.role }
                ]
            },
            { $addToSet: { readBy: req.user._id } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        const nObj = notification.toObject();
        nObj.isRead = true;

        res.status(200).json({ success: true, notification: nObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sync failure.' });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { 
                $or: [
                    { recipient: req.user._id },
                    { recipientRole: req.user.role }
                ],
                readBy: { $ne: req.user._id }
            },
            { $addToSet: { readBy: req.user._id } }
        );

        res.status(200).json({ success: true, message: 'Registry synchronized.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Mass update fault.' });
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { recipient: req.user._id },
                { recipientRole: req.user.role }
            ]
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification already purged.' });
        }

        res.status(200).json({ success: true, message: 'Notification purged.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Purge sequence failure.' });
    }
};

/**
 * @desc    Delete all notifications for the user
 * @route   DELETE /api/notifications/purge-all
 * @access  Private
 */
const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({
            $or: [
                { recipient: req.user._id },
                { recipientRole: req.user.role }
            ]
        });

        res.status(200).json({ success: true, message: 'All notifications purged from the registry.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Mass purge sequence failed.' });
    }
};

/**
 * Helper to create a notification (Internal use)
 */
const createNotification = async ({ recipient, recipientRole, type, title, message, link, metadata }) => {
    try {
        const notification = await Notification.create({
            recipient,
            recipientRole,
            type,
            title,
            message,
            link,
            metadata
        });

        // If we have global socket access, we would emit here
        // For now, we rely on polling/frontend logic or a global emitter
        if (global.io) {
            const room = recipient ? recipient.toString() : recipientRole;
            const nObj = notification.toObject();
            nObj.isRead = false;
            global.io.to(room).emit('new_notification', nObj);
        }

        return notification;
    } catch (error) {
        console.error('Notification creation failed', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification
};

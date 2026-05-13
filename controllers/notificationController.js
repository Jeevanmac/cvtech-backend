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

        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .limit(50);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

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
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        res.status(200).json({ success: true, notification });
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
                isRead: false
            },
            { isRead: true }
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
            global.io.to(room).emit('new_notification', notification);
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
    createNotification
};

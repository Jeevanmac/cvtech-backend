const Message = require('../models/Message');

/**
 * @desc    Send a secure text to the monolith architecture (Admin scope implicitly targetted if receiver null)
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
    try {
        const { text, receiverId } = req.body;
        
        if (!text) return res.status(400).json({ success: false, message: 'String payload cannot be null.' });

        const message = await Message.create({
            senderId: req.user._id,
            receiverId: receiverId || null, // Null indicates sending a query directly to System Admins collectively
            text
        });

        // Real-time Emission & Persistent Notification
        const { notifyUser, notifyAdmins } = require('../socket/socketHandler');
        const { createNotification } = require('./notificationController');

        if (receiverId) {
            notifyUser(receiverId, 'new_message', message);
            await createNotification({
                recipient: receiverId,
                type: 'message',
                title: '📩 New Secure Message',
                message: `${req.user.name || 'A user'} sent you a message.`,
                link: '/messages'
            });
        } else {
            // If no receiver, it's for admins
            notifyAdmins('new_message', { ...message.toObject(), sender: req.user });
            await createNotification({
                recipientRole: 'admin',
                type: 'message',
                title: '📩 New User Query',
                message: `${req.user.name || req.user.email} sent a message to the support stream.`,
                link: '/admin/messages'
            });
        }

        res.status(201).json({ success: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Transmission failure.' });
    }
};

/**
 * @desc    Pull user message threads natively.
 * @route   GET /api/messages
 * @access  Private
 */
const getMessages = async (req, res) => {
    try {
        // Find messages where the current user is either sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Routing thread extraction failed.' });
    }
};

module.exports = {
    sendMessage,
    getMessages
};

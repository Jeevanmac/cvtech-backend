const Contact = require('../models/Contact');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

/**
 * @desc    Submit a contact inquiry
 * @route   POST /api/contact
 * @access  Public
 */
const submitInquiry = async (req, res) => {
    try {
        const inquiry = await Contact.create(req.body);
        
        logger.info(`🚨 New Contact Inquiry: ${inquiry.fullName} - ${inquiry.interest}`);

        // Notify Admin Collective Instantly
        await createNotification({
            recipientRole: 'admin',
            type: 'contact',
            title: '📡 New Contact Inquiry',
            message: `${inquiry.fullName} initiated a sync request regarding ${inquiry.interest}.`,
            link: '/admin/messages' // Or a specific contact management page if it exists
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry successfully transmitted to the engineering hub.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Transmission failure.' });
    }
};

module.exports = { submitInquiry };

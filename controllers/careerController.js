const Application = require('../models/Application');
const logger = require('../utils/logger');

/**
 * @desc    Submit a new career application
 * @route   POST /api/careers/apply
 * @access  Public
 */
const applyForRole = async (req, res) => {
    try {
        const { role, firstName, lastName, email, portfolioUrl, githubUrl, linkedinUrl, message } = req.body;

        if (!role || !firstName || !lastName || !email || !portfolioUrl) {
            return res.status(400).json({ success: false, message: 'Strategic identity fields are missing.' });
        }

        const application = await Application.create({
            role, firstName, lastName, email, portfolioUrl, githubUrl, linkedinUrl, message
        });

        logger.info(`🚨 New Application Received: ${firstName} ${lastName} for role ${role}`);

        res.status(201).json({
            success: true,
            message: 'Identity successfully transmitted to the recruitment hub. We will review your node shortly.'
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({ success: false, message: 'Transmission failure in the recruitment pipeline.' });
    }
};

/**
 * @desc    Get all applications for admin review
 * @route   GET /api/careers/applications
 * @access  Private/Admin
 */
const getApplications = async (req, res) => {
    try {
        const applications = await Application.find().sort('-createdAt');
        res.status(200).json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registry retrieval fault.' });
    }
};

module.exports = {
    applyForRole,
    getApplications
};

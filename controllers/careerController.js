const Application = require('../models/Application');
const logger = require('../utils/logger');
const { generateUploadUrl, generateDownloadUrl } = require('../utils/s3');
const { createNotification } = require('./notificationController');

/**
 * @desc    Submit a new career application
 * @route   POST /api/careers/apply
 * @access  Public
 */
const applyForRole = async (req, res) => {
    try {
        const { role, firstName, lastName, email, portfolioUrl, githubUrl, linkedinUrl, message, resumeKey } = req.body;

        if (!role || !firstName || !lastName || !email) {
            return res.status(400).json({ success: false, message: 'Strategic identity fields are missing.' });
        }

        const application = await Application.create({
            userId: req.user?._id || null,
            role, firstName, lastName, email, portfolioUrl, githubUrl, linkedinUrl, message, resumeKey
        });

        logger.info(`🚨 New Application Received: ${firstName} ${lastName} for role ${role}`);
        
        // Notify Admin Collective
        await createNotification({
            recipientRole: 'admin',
            type: 'application',
            title: '💼 New Job Application',
            message: `${firstName} ${lastName} submitted an application for ${role}.`,
            link: '/admin/careers'
        });

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
        const rawApplications = await Application.find().sort('-createdAt');
        
        const applications = await Promise.all(rawApplications.map(async (app) => {
            const appObj = app.toObject();
            if (appObj.resumeKey) {
                appObj.resumeUrl = await generateDownloadUrl(appObj.resumeKey);
            }
            return appObj;
        }));

        res.status(200).json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registry retrieval fault.' });
    }
};

/**
 * @desc    Generate a pre-signed URL for direct resume upload
 * @route   GET /api/careers/upload-url?fileName=resume.pdf&fileType=application/pdf
 * @access  Public
 */
const getResumeUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.query;
        if (!fileName || !fileType) {
            return res.status(400).json({ success: false, message: 'FileName and FileType are required.' });
        }

        const { signedUrl, key } = await generateUploadUrl(fileName, fileType, 'resumes');

        res.status(200).json({
            success: true,
            uploadUrl: signedUrl,
            key: key
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to generate secure upload channel.' });
    }
};

/**
 * @desc    Update application status
 * @route   PATCH /api/careers/applications/:id/status
 * @access  Private/Admin
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'reviewing', 'interviewing', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status tier.' });
        }

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application node not found.' });
        }

        // Notify applicant if they have an account
        if (application.userId) {
            await createNotification({
                recipient: application.userId,
                type: 'application_update',
                title: '💼 Application Status Updated',
                message: `Your application for ${application.role} has been updated to: ${status.toUpperCase()}.`,
                link: '/dashboard'
            });
        }

        res.status(200).json({ success: true, application });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status update fault.' });
    }
};

/**
 * @desc    Permanently delete an application
 * @route   DELETE /api/careers/applications/:id
 * @access  Private/Admin
 */
const deleteApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application node already purged.' });
        }

        // Note: S3 file deletion could be added here if needed using application.resumeKey
        
        res.status(200).json({ success: true, message: 'Identity permanently purged from the registry.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Deletion sequence failed.' });
    }
};

module.exports = {
    applyForRole,
    getApplications,
    getResumeUploadUrl,
    updateApplicationStatus,
    deleteApplication
};

const Job = require('../models/Job');
const logger = require('../utils/logger');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create a new job role
 * @route   POST /api/jobs
 * @access  Private/Admin
 */
const createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        logger.info(`🚨 New Job Created: ${job.title} in ${job.department}`);

        // Notify Users about new opportunity
        await createNotification({
            recipientRole: 'user',
            type: 'job_posted',
            title: '🚀 New Opportunity Available',
            message: `${job.title} role is now live in the ${job.department} department.`,
            link: '/careers'
        });

        res.status(201).json({ success: true, job });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all jobs for admin
 * @route   GET /api/jobs
 * @access  Private/Admin
 */
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort('-priority -createdAt');
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registry retrieval fault.' });
    }
};

/**
 * @desc    Get active jobs for public
 * @route   GET /api/jobs/active
 * @access  Public
 */
const getActiveJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'active' }).sort('-priority -createdAt');
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch active nodes.' });
    }
};

/**
 * @desc    Update a job role
 * @route   PUT /api/jobs/:id
 * @access  Private/Admin
 */
const updateJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job node not found.' });
        }

        res.status(200).json({ success: true, job });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a job role
 * @route   DELETE /api/jobs/:id
 * @access  Private/Admin
 */
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job node already purged.' });
        }

        res.status(200).json({ success: true, message: 'Job permanently purged from the registry.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Purge sequence failed.' });
    }
};

module.exports = {
    createJob,
    getJobs,
    getActiveJobs,
    updateJob,
    deleteJob
};

const express = require('express');
const router = express.Router();
const { 
    applyForRole, 
    getApplications, 
    getResumeUploadUrl,
    updateApplicationStatus,
    deleteApplication
} = require('../controllers/careerController');
const { protect, isAdmin } = require('../middleware/auth');

// Public application endpoint
router.post('/apply', applyForRole);
router.get('/upload-url', getResumeUploadUrl);

// Admin-only application review
router.get('/applications', protect, isAdmin, getApplications);
router.patch('/applications/:id/status', protect, isAdmin, updateApplicationStatus);
router.delete('/applications/:id', protect, isAdmin, deleteApplication);

module.exports = router;

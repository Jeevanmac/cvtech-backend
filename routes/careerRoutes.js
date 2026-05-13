const express = require('express');
const router = express.Router();
const { 
    applyForRole, 
    getApplications, 
    getResumeUploadUrl,
    updateApplicationStatus,
    deleteApplication
} = require('../controllers/careerController');
const { protect, isAdmin, optionalProtect } = require('../middleware/auth');

// Public application endpoint (with optional identity capture)
router.post('/apply', optionalProtect, applyForRole);
router.get('/upload-url', optionalProtect, getResumeUploadUrl);

// Admin-only application review
router.get('/applications', protect, isAdmin, getApplications);
router.patch('/applications/:id/status', protect, isAdmin, updateApplicationStatus);
router.delete('/applications/:id', protect, isAdmin, deleteApplication);

module.exports = router;

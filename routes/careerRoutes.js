const express = require('express');
const router = express.Router();
const { applyForRole, getApplications } = require('../controllers/careerController');
const { protect, isAdmin } = require('../middleware/auth');

// Public application endpoint
router.post('/apply', applyForRole);

// Admin-only application review
router.get('/applications', protect, isAdmin, getApplications);

module.exports = router;

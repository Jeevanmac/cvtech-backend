const express = require('express');
const router = express.Router();
const { getPresignedUploadUrl, createProject, getAllProjects, getProjectById, getRecommendations } = require('../controllers/projectController');
const { protect, isAdmin } = require('../middleware/auth');

// Public Access
router.get('/', getAllProjects);

// Admin-Only Protected Routes
router.get('/config/upload-url', protect, isAdmin, getPresignedUploadUrl);
router.post('/', protect, isAdmin, createProject);

// Basic Protected Routes
router.get('/hub/recommendations', protect, getRecommendations);

// Wildcard ID Route (MUST be last)
router.get('/:id', getProjectById);

module.exports = router;

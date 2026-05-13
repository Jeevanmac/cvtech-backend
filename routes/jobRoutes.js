const express = require('express');
const router = express.Router();
const { 
    createJob, 
    getJobs, 
    getActiveJobs, 
    updateJob, 
    deleteJob 
} = require('../controllers/jobController');
const { protect, isAdmin } = require('../middleware/auth');

// Public route to fetch active recruitment nodes
router.get('/active', getActiveJobs);

// Administrative routes protected by identity verification
router.route('/')
    .get(protect, isAdmin, getJobs)
    .post(protect, isAdmin, createJob);

router.route('/:id')
    .put(protect, isAdmin, updateJob)
    .delete(protect, isAdmin, deleteJob);

module.exports = router;

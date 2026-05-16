const express = require('express');
const router = express.Router();
const { getMatrixAnalytics } = require('../controllers/analyticsController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

router.get('/matrix', getMatrixAnalytics);

module.exports = router;

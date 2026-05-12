const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, generateDownloadToken, executeSecureDownload, webhookPayment, getMyOrders } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Payment Creation and Verification Endpoints
router.post('/create-order', strictLimiter, protect, createOrder);
router.post('/verify', strictLimiter, protect, verifyPayment);

// Standard Secure Download Route
router.get('/downloads/token/:projectId', strictLimiter, protect, generateDownloadToken);
router.post('/downloads/execute', strictLimiter, protect, executeSecureDownload);
router.get('/my-orders', strictLimiter, protect, getMyOrders);

// Webhook Boundary
router.post('/webhook', express.raw({ type: 'application/json' }), webhookPayment);

module.exports = router;

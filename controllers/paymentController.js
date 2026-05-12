const Order = require('../models/Order');
const Project = require('../models/Project');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { generateDownloadUrl } = require('../utils/s3');
const logger = require('../utils/logger');
const axios = require('axios');

// Internal verification
const verifyRecaptcha = async (token) => {
    if (!token) return false;
    try {
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`);
        return response.data.success;
    } catch(err) {
        return false;
    }
};

// Initialize Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

/**
 * @desc    Establish a pending order and secure a Razorpay Intent
 * @route   POST /api/payments/create-order
 * @access  Private 
 */
const createOrder = async (req, res) => {
    try {
        const { projectIds, recaptchaToken } = req.body;
        
        if (!projectIds || projectIds.length === 0 || !recaptchaToken) {
            return res.status(400).json({ success: false, message: 'No projects provided or ReCAPTCHA absent.' });
        }

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            logger.warn(`Bot detected attempting fake Razorpay Intent spanning User: ${req.user._id}`);
            return res.status(403).json({ success: false, message: 'ReCAPTCHA Verification drop.' });
        }

        // Calculate total strictly on backend to avoid tampering
        let totalAmount = 0;
        const projectReferences = [];
        
        for (let pid of projectIds) {
            const proj = await Project.findById(pid);
            if (!proj) return res.status(404).json({ success: false, message: `Project ${pid} not found` });
            totalAmount += proj.price;
            projectReferences.push({ projectId: proj._id, priceAtPurchase: proj.price });
        }

        // Create Order intent in Razorpay (Amount format requires smallest currency subunit i.e. paise/cents)
        const options = {
            amount: totalAmount * 100, 
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        };

        const rzpOrder = await razorpay.orders.create(options);

        if (!rzpOrder) return res.status(500).json({ success: false, message: 'Razorpay initialization failed' });

        // Build database shell
        const newOrder = await Order.create({
            userId: req.user._id,
            projects: projectReferences,
            razorpayOrderId: rzpOrder.id,
            totalAmount: totalAmount,
            status: 'pending'
        });

        res.status(200).json({ success: true, orderId: rzpOrder.id, amount: rzpOrder.amount, dbOrderId: newOrder._id });

    } catch (error) {
        logger.error(`Checkout transaction crash: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Issue during cart checkout' });
    }
};

/**
 * @desc    Mathematically Verify Razorpay signature mapping & complete assignment logic.
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Construct Expected Signature based on SHA256 HMAC hash structure defined natively by Razorpay spec
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
                                        .update(body.toString())
                                        .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
            return res.status(400).json({ success: false, message: 'Payment mathematical signature mismatch. Invalidated.' });
        }

        // Check for idempotency to prevent duplicate purchase analytics
        const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (existingOrder && existingOrder.status === 'success') {
            return res.status(200).json({ success: true, message: 'Transaction already verified.', order: existingOrder });
        }

        // Successfully Validated!
        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { 
                status: 'success', 
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature 
            },
            { new: true }
        );

        // Bind purchases securely to the tracking model of the user to build their dashboard later
        for (let projInfo of order.projects) {
            await User.findByIdAndUpdate(req.user._id, {
                $push: { 
                    purchases: { 
                        projectId: projInfo.projectId, 
                        orderId: order._id,
                        downloadCount: 0
                    } 
                }
            });
        }

        // Increment Global Purchase Counts dynamically for Fallback Heuristics Native Analytics
        for (let projInfo of order.projects) {
            await Project.findByIdAndUpdate(projInfo.projectId, { $inc: { purchaseCount: 1 } });
        }

        // Generate Admin Notifications
        const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'superuser'] } });
        const Notification = require('../models/Notification');
        
        for (let admin of admins) {
            await Notification.create({
                userId: admin._id,
                title: 'New Revenue Generated',
                message: `${req.user.firstName} purchased ${order.projects.length} project(s) for ₹${order.totalAmount}`,
                type: 'order',
                metadata: { orderId: order._id }
            });
        }

        logger.info(`Razorpay sequence successful map over Order ${order._id}`);
        res.status(200).json({ success: true, message: 'Transaction Verified Securely. Monolith files accessible.', order });

    } catch (error) {
        logger.error(`Frontend payment validation structural error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failure enforcing confirmation logs' });
    }
};

/**
 * @desc    Generate 30-sec JWT single-use nonce wrapper dynamically
 * @route   GET /api/payments/downloads/token/:projectId
 * @access  Private
 */
const generateDownloadToken = async (req, res) => {
    try {
        const { projectId } = req.params;

        const validOrder = await Order.findOne({ userId: req.user._id, 'projects.projectId': projectId, status: 'success' });
        if (!validOrder) return res.status(403).json({ success: false, message: 'Transaction missing or invalid.' });

        if (validOrder.downloadCount >= validOrder.maxDownloads) {
            logger.warn(`Excessive execution attempt natively bounded on tracking map User ${req.user._id}`);
            return res.status(403).json({ success: false, message: 'Maximum extractions achieved.' });
        }

        // Generate one-time cryptographic nonce constraint
        const nonce = crypto.randomBytes(16).toString('hex');
        
        const payload = {
            userId: req.user._id.toString(),
            projectId: projectId,
            orderId: validOrder._id.toString(),
            nonce
        };

        const downloadToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30s' });
        res.status(200).json({ success: true, downloadToken });

    } catch (err) {
        logger.error(`Pre-signed JWT bounds failure: ${err.message}`);
        res.status(500).json({ success: false, message: 'Token generation issue' });
    }
};

/**
 * @desc    Verify single-use token structurally and execute standard 60-second S3 URI logic hooks.
 * @route   POST /api/payments/downloads/execute
 * @access  Private
 */
const executeSecureDownload = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token missing globally' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId, projectId, orderId, nonce } = decoded;

        if (userId !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Token identity mismatch.' });

        const validOrder = await Order.findById(orderId);
        if (!validOrder || validOrder.status !== 'success') return res.status(403).json({ success: false, message: 'Invalid deployment mapping.' });

        // Idempotency: Has this 30s token nonce been natively consumed mathematically?
        const nonceUsed = validOrder.logs.some(log => log.nonce === nonce);
        if (nonceUsed) {
            logger.warn(`Potential replay attack natively intercepted on nonce ${nonce}`);
            return res.status(403).json({ success: false, message: 'Single-use cryptographic envelope already consumed.' });
        }

        const project = await Project.findById(projectId);
        if (!project || !project.zipFileKey) return res.status(404).json({ success: false, message: 'Cloud Object unavailable.' });

        // Generate the 60s payload URL from S3
        const secureUrl = await generateDownloadUrl(project.zipFileKey);

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        validOrder.downloadCount += 1;
        validOrder.logs.push({ ipAddress: clientIp, timestamp: Date.now(), nonce });
        await validOrder.save();

        logger.info(`AWS Execution extraction permitted natively via validated nonce for User: ${userId}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Architectural core accessed safely.',
            downloadUrl: secureUrl
        });

    } catch (error) {
        logger.error(`Secure download failure bounds: ${error.message}`);
        res.status(500).json({ success: false, message: 'Cryptographic object violation or core server crash' });
    }
};

/**
 * @desc    Razorpay Server-To-Server Webhook Mapping Idempotency securely
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const webhookPayment = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const razorpaySignature = req.headers['x-razorpay-signature'];
        
        const expectedSignature = crypto.createHmac('sha256', secret)
                                        .update(JSON.stringify(req.body))
                                        .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            logger.error('Webhook native identity validation dropped!');
            return res.status(400).json({ success: false });
        }

        const event = req.body.event;
        const payloadObject = req.body.payload.payment.entity;

        if (event === 'payment.captured' || event === 'order.paid') {
            const rzpOrderId = payloadObject.order_id;
            const rzpPaymentId = payloadObject.id;

            const orderToUpdate = await Order.findOne({ razorpayOrderId: rzpOrderId });
            
            // Replay duplicate validation 
            if (orderToUpdate && orderToUpdate.status !== 'success') {
                 orderToUpdate.status = 'success';
                 orderToUpdate.razorpayPaymentId = rzpPaymentId;
                 orderToUpdate.logs.push({ ipAddress: 'WEBHOOK_NODE', timestamp: Date.now() });

                 await orderToUpdate.save();

                 for (let projInfo of orderToUpdate.projects) {
                    await User.findByIdAndUpdate(orderToUpdate.userId, {
                        $push: { purchases: { projectId: projInfo.projectId, orderId: orderToUpdate._id, downloadCount: 0 } }
                    });
                    
                    await Project.findByIdAndUpdate(projInfo.projectId, { $inc: { purchaseCount: 1 } });
                 }
                 logger.info(`Webhook structurally solidified order identity ${rzpOrderId}`);

                 // Generate Admin Notifications for Webhook
                 const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'superuser'] } });
                 const Notification = require('../models/Notification');
                 const customer = await User.findById(orderToUpdate.userId);
                 
                 for (let admin of admins) {
                     await Notification.create({
                         userId: admin._id,
                         title: 'S2S Revenue Capture',
                         message: `${customer?.firstName || 'User'} purchased ${orderToUpdate.projects.length} project(s) via Webhook`,
                         type: 'order',
                         metadata: { orderId: orderToUpdate._id }
                     });
                 }
            }
        } else if (event === 'payment.failed') {
            const rzpOrderId = payloadObject.order_id;
            await Order.findOneAndUpdate({ razorpayOrderId: rzpOrderId }, { status: 'failed' });
            logger.info(`Webhook correctly registered dynamic failure constraints cleanly over order ${rzpOrderId}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error(`Webhook processing fault explicitly dropped: ${error.message}`);
        res.status(500).send('Network Failure');
    }
};

/**
 * @desc    Fetch all successful orders for the logged-in user
 * @route   GET /api/payments/my-orders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id, status: 'success' })
            .populate('projects.projectId', 'title images category')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, orders });
    } catch (error) {
        logger.error(`Error fetching user orders: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to retrieve order history' });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    generateDownloadToken,
    executeSecureDownload,
    webhookPayment,
    getMyOrders
};

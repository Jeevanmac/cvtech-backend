require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const careerRoutes = require('./routes/careerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const couponRoutes = require('./routes/couponRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Helmet Content Security Overrides mapping HTTPS and anti-XSS constraints
app.use(helmet());

// Winston and Morgan API Request Log Stream
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Global Rate Limiter removed to only apply strict limits to bounded routes

// CORS configuration to allow credentials (cookies)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? (process.env.FRONTEND_PROD_URL || 'https://chandu-test-web.web.app') // Force strict production node targeting natively
        : (process.env.FRONTEND_URL || 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'CV TECH Monolith API is running seamlessly.' });
});

// Serve Frontend Static Assets Mapping 
app.use(express.static(path.join(__dirname, 'public')));

// Root Navigation Wildcard for SPA (Deep Linking)
// Using regex to ensure absolute compatibility with Express 5 routing engine
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Critical Native Fault: ${err.message}`, { trace: err.stack });
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal Architecture Crash' : err.message
    });
});

// Database Connection & Server Initialization
const PORT = process.env.PORT || 5000;
const http = require('http');
const { initSocket } = require('./socket/socketHandler');

const mongoOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
    .then(() => {
        logger.info('✅ MongoDB Atlas Connected Successfully.');
        console.log('✅ MongoDB Atlas Connected Successfully.');
        
        const server = http.createServer(app);
        initSocket(server);
        
        server.listen(PORT, () => {
            console.log(`🚀 CV TECH Monolith running on http://localhost:${PORT}`);
            logger.info(`CV TECH Monolith running on port ${PORT}`);
        });
    })
    .catch(err => {
        logger.error(`❌ MongoDB Connection Failed: ${err.message}`);
        console.error('❌ MongoDB Connection Failed:', err.message);
        console.error('👉 Fix: Go to cloud.mongodb.com → Network Access → Add IP Address → Allow your current IP or 0.0.0.0/0 for dev.');
        process.exit(1);
    });

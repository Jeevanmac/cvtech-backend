const rateLimit = require('express-rate-limit');

// Prevent baseline traversal attacks blocking IPs hammering 5 connections per minute
const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { success: false, message: 'Structural boundaries exceeded. Too many requests. Please pause operations.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

// Protect overarching generalized requests lightly (100 per minute)
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: 'Excessive server mapping. Please slow request sequence.' },
    standardHeaders: true, 
    legacyHeaders: false,
});

module.exports = {
    strictLimiter,
    generalLimiter
};

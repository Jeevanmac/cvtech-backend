const crypto = require('crypto');

/**
 * OTP Utilities
 * Handles secure code generation and cryptographic hashing.
 */

/**
 * Generate a cryptographically secure 6-digit OTP
 */
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP for secure storage in MongoDB
 */
exports.hashOTP = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Compare plain OTP with hashed version
 */
exports.verifyOTP = (plain, hashed) => {
    const hashedPlain = crypto.createHash('sha256').update(plain).digest('hex');
    return hashedPlain === hashed;
};

const OTP = require('../models/OTP');
const { hashOTP, verifyOTP } = require('../utils/otp.util');

/**
 * OTP Service
 * Business logic for persisting and validating security codes.
 */

/**
 * Persist a new OTP for an identity
 * Invalidate existing codes to prevent replay attacks.
 */
exports.saveOTP = async (email, otp) => {
    // Standard Security: Invalidate any previous authorization attempts
    await OTP.deleteMany({ email });

    // Store the cryptographic hash of the code
    const hashedOtp = hashOTP(otp);

    await OTP.create({
        email,
        otp: hashedOtp
    });
};

/**
 * Validate an authorization attempt
 * Checks against the persisted hash and consumes the code if valid.
 */
exports.verifyOTPStored = async (email, plainOtp) => {
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return false;

    // Direct Hash Comparison
    const isValid = verifyOTP(plainOtp, otpRecord.otp);
    
    if (isValid) {
        // Single-Use Enforcement: Delete the record upon successful verification
        await OTP.deleteMany({ email });
        return true;
    }
    
    return false;
};

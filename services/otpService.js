const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.saveOTP = async (email, otp) => {
    // Hash the OTP before saving as per security requirements
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Remove any existing OTPs for this email to prevent spam/confusion
    await OTP.deleteMany({ email });

    await OTP.create({
        email,
        otp: hashedOtp
    });
};

exports.verifyOTP = async (email, otp) => {
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return false;

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (isValid) {
        // Delete the OTP once it's used
        await OTP.deleteMany({ email });
        return true;
    }
    return false;
};

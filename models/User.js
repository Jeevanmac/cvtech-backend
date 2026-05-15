const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Professional email is required'],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false // Avoid returning the password by default in queries
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superuser', 'superadmin'],
            default: 'user'
        },
        // Track the user's purchased projects
        purchases: [
            {
                projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
                orderId: { type: String },
                purchaseDate: { type: Date, default: Date.now },
                downloadCount: { type: Number, default: 0 },
                lastDownloadedAt: { type: Date },
                accessRevoked: { type: Boolean, default: false },
                revokedAt: { type: Date },
                revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                revokeReason: { type: String },
                suspiciousFlag: { type: Boolean, default: false }
            }
        ],
        cart: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }],
        wishlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

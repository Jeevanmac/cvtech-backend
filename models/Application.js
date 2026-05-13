const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    role: {
        type: String,
        required: [true, 'Role context is required for identity mapping.']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required.']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required.']
    },
    email: {
        type: String,
        required: [true, 'Contact email is required.'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Provide a valid cryptographic email address.']
    },
    portfolioUrl: {
        type: String,
        required: false
    },
    githubUrl: {
        type: String
    },
    linkedinUrl: {
        type: String
    },
    resumeKey: {
        type: String
    },
    message: {
        type: String,
        maxlength: [1000, 'Strategic intent summary too long.']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'interviewing', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);

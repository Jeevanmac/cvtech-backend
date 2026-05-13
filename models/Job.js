const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required for recruitment node identification.']
    },
    department: {
        type: String,
        enum: ['Engineering', 'AI', 'Design', 'DevOps', 'Marketing', 'Management'],
        required: [true, 'Department classification is required.']
    },
    type: {
        type: String,
        enum: ['Freelance', 'Full Time', 'Part Time', 'Internship', 'Contract'],
        required: [true, 'Employment type is required.']
    },
    location: {
        type: String,
        enum: ['Remote', 'Hybrid', 'Onsite'],
        required: [true, 'Work location architecture is required.']
    },
    description: {
        type: String,
        required: [true, 'Job description summary is required.']
    },
    duration: {
        type: String,
        default: 'Ongoing'
    },
    salary: {
        type: String, // Stored as ₹ values as requested
        required: [true, 'Compensation data is required for node synchronization.']
    },
    skills: [{
        type: String
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'draft'],
        default: 'draft'
    },
    applyButtonText: {
        type: String,
        default: 'Apply Now'
    },
    accentColor: {
        type: String,
        default: '#8a2be2' // Default CV TECH Purple
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);

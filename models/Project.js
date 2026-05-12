const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Project description is required']
        },
        price: {
            type: Number,
            required: [true, 'Project price is required'],
            min: 0
        },
        category: {
            type: String,
            required: [true, 'Category is required'] // e.g., 'Web App', 'AI Model', 'Mobile'
        },
        techStack: [{
            type: String,
            required: true
        }],
        difficulty: {
            type: String,
            enum: ['Entry Level', 'Intermediate', 'Senior Engineer'],
            default: 'Intermediate'
        },
        imageKeys: [{
            type: String // S3 object keys (e.g., 'images/uuid-filename.png')
        }],
        // Direct AWS S3 Storage Hooks
        zipFileKey: {
            type: String,
            required: [true, 'Core Monolith ZIP Object Key is mandatory for the architecture']
        },
        documentationUrl: {
            type: String
        },
        pptUrl: {
            type: String
        },
        demoVideoUrl: {
            type: String
        },
        purchaseCount: {
            type: Number,
            default: 0 // Baseline AI fallback heuristics rank metric tracking
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);

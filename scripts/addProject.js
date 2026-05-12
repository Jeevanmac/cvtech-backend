const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Project = require('../models/Project');

// Usage: node scripts/addProject.js "Title" "Description" 49.99 "Category" "React,Node" "Intermediate" "zip-key-on-s3" "image-url-1,image-url-2"

const addProject = async () => {
    try {
        const [title, desc, price, cat, tech, diff, zipKey, imgs] = process.argv.slice(2);

        if (!title || !desc || !price || !cat || !tech || !zipKey) {
            console.log('Usage: node scripts/addProject.js "Title" "Description" Price "Category" "Tech1,Tech2" "Difficulty" "zip-key" "img1,img2"');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        const project = await Project.create({
            title,
            description: desc,
            price: parseFloat(price),
            category: cat,
            techStack: tech.split(','),
            difficulty: diff || 'Intermediate',
            zipFileKey: zipKey,
            images: imgs ? imgs.split(',') : []
        });

        console.log('✅ Project added successfully:', project._id);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding project:', err.message);
        process.exit(1);
    }
};

addProject();

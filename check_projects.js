const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./models/Project');

dotenv.config();

const checkProjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Database...');

        const projects = await Project.find({});
        console.log('Total Projects:', projects.length);

        projects.forEach(p => {
            console.log(`Project: ${p.title}`);
            console.log(`Images:`, p.images);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkProjects();

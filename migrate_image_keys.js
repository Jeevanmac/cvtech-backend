const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./models/Project');

dotenv.config();

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Database...');

        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects to check.`);

        for (const project of projects) {
            // Check if it has the old 'images' field (via lean or toObject)
            const projectObj = project.toObject();
            const oldImages = projectObj.images || [];
            
            if (oldImages.length > 0 && (!project.imageKeys || project.imageKeys.length === 0)) {
                console.log(`Migrating project: ${project.title}`);
                
                const keys = oldImages.map(url => {
                    if (url.includes('.amazonaws.com/')) {
                        return url.split('.amazonaws.com/')[1];
                    }
                    return url; // Keep as is if not a standard URL
                });

                project.imageKeys = keys;
                // Clear old images if you want to be strict, but schema rename already handles it mostly
                await project.save();
                console.log(`Successfully migrated ${keys.length} keys for ${project.title}`);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
};

migrateData();

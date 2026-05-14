const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('./models/Settings');

dotenv.config();

const seedSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const existingSettings = await Settings.findOne();
        if (!existingSettings) {
            await Settings.create({
                adminSupportEmail: process.env.CONTACT_RECEIVER_EMAIL || 'cvtechindia18@gmail.com',
                adminPhoneNumber: '+91 9876543210'
            });
            console.log('Settings seeded successfully');
        } else {
            console.log('Settings already exist');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding settings:', error);
        process.exit(1);
    }
};

seedSettings();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        console.log('Initiating Database Connection mapped from Monolith standard...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connection initialized.');

        const email = process.env.ADMIN_EMAIL;
        const rawPassword = process.env.ADMIN_PASSWORD;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const adminUser = await User.findOneAndUpdate(
            { email },
            {
                firstName: 'System',
                lastName: 'Admin',
                email: email,
                password: hashedPassword,
                role: 'admin'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Core Administrative Node established. ID: ${adminUser._id}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Deep architectural fault locating admin:', err);
        process.exit(1);
    }
};

seedAdmin();

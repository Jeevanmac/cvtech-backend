const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const recoverAdmin = async () => {
    try {
        console.log('🔄 Initiating Administrative Recovery Sequence...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas.');

        const email = 'admin@123.in';
        const rawPassword = 'Admin123@';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Upsert Admin User (Create or Update)
        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                firstName: 'System',
                lastName: 'Admin',
                password: hashedPassword,
                role: 'admin'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Admin account strictly reset: ${email}`);
        console.log(`✅ ID mapping: ${updatedUser._id}`);
        console.log('---');
        console.log('Use these credentials to log in:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Recovery Fault:', err);
        process.exit(1);
    }
};

recoverAdmin();

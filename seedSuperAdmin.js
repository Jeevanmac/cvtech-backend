const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Database for SuperAdmin Generation...');

        const email = process.env.SUPERADMIN_EMAIL;
        const password = process.env.SUPERADMIN_PASSWORD;
        const firstName = process.env.SUPERADMIN_FIRSTNAME;
        const lastName = process.env.SUPERADMIN_LASTNAME;

        // Check if an entity already exists with the superadmin role
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin && existingSuperAdmin.email !== email) {
            console.log(`⚠️ A SuperAdmin already exists (${existingSuperAdmin.email}).`);
            console.log('Bypassing initialization to protect core integrity.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdminUser = await User.findOneAndUpdate(
            { email },
            {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: 'superadmin'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Super Admin Identity Established: ${superAdminUser.email}`);
        console.log('Role Tier: superadmin');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Identity Injection Failure:', err.message);
        process.exit(1);
    }
};

seedSuperAdmin();

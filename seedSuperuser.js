const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedSuperuser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Monolithic Core for Identity Injection...');

        const email = process.env.SUPERUSER_EMAIL;
        const password = process.env.SUPERUSER_PASSWORD;
        const hashedPassword = await bcrypt.hash(password, 10);

        const superuser = await User.findOneAndUpdate(
            { email },
            {
                firstName: 'Super',
                lastName: 'Admin',
                email,
                password: hashedPassword,
                role: 'superuser'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ SuperUser Identity Established: ${superuser.email}`);
        console.log('Role Tier: Superuser');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Identity Injection Failure:', err.message);
        process.exit(1);
    }
};

seedSuperuser();

require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 })
    .then(() => {
        console.log('✅ SUCCESS: MongoDB Atlas Connected!');
        process.exit(0);
    })
    .catch(e => {
        console.log('❌ FAIL:', e.message);
        process.exit(1);
    });

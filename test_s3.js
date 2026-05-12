const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { generateUploadUrl } = require('./utils/s3');

(async () => {
    try {
        console.log("Testing AWS S3 connection...");
        const res = await generateUploadUrl('test.zip', 'application/zip', 'projects');
        console.log("Success! Generated URL:", res.signedUrl.substring(0, 50) + "...");
    } catch (err) {
        console.error("Failed:", err);
    }
})();

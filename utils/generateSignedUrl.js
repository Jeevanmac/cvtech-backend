const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME;

/**
 * Generates a temporary signed URL for an S3 object key.
 * @param {string} key - The S3 object key (e.g., 'images/uuid-filename.png')
 * @returns {Promise<string|null>} - The signed URL or null if failed
 */
const generateSignedUrlHelper = async (key) => {
    if (!key) return null;

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        // URL valid for 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        console.log(`[S3] Generated signed URL for key: ${key}`);
        return signedUrl;
    } catch (err) {
        console.error(`[S3] Error generating signed URL for key: ${key}`, err.message);
        return null;
    }
};

module.exports = generateSignedUrlHelper;

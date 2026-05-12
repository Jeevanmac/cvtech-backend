const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
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
 * Generate a pre-signed URL for direct upload.
 */
const generateUploadUrl = async (fileName, contentType = 'application/zip', folder = 'projects') => {
    // Sanitize fileName to avoid character issues in Keys
    const sanitizedName = fileName.replace(/\s+/g, '-').toLowerCase();
    const key = `${folder}/${Date.now()}-${sanitizedName}`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType
    });

    // Valid for 10 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    
    return { signedUrl, key };
};

/**
 * Basic downloader for secure assets (ZIPs).
 */
const generateDownloadUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 60 });
};

module.exports = {
    generateUploadUrl,
    generateDownloadUrl
};

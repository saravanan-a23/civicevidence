const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists for local fallback
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Dynamically load AWS SDK if available
let s3ClientInstance = null;
let s3Commands = null;

if (process.env.STORAGE_MODE === 's3') {
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3ClientInstance = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      s3Commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
      console.log('AWS S3 Storage service initialized successfully.');
    } else {
      console.warn('AWS credentials missing. Falling back to local storage.');
    }
  } catch (err) {
    console.warn('@aws-sdk/client-s3 not installed or failed to load. Falling back to local storage.');
  }
} else {
  console.log('Storage Mode set to Local. Local files will be saved in backend/uploads/.');
}

/**
 * Helper to stream S3 response to buffer
 */
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/**
 * Upload Encrypted File
 * Returns the storage url/key
 */
const uploadFile = async (fileBuffer, originalFilename) => {
  const uniqueName = `${Date.now()}-${originalFilename}`;

  if (process.env.STORAGE_MODE === 's3' && s3ClientInstance && s3Commands) {
    try {
      const { PutObjectCommand } = s3Commands;
      const bucketName = process.env.S3_BUCKET_NAME || 'civicevidence-secure-bucket';
      
      await s3ClientInstance.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueName,
          Body: fileBuffer,
          ContentType: 'application/octet-stream', // Always binary for encrypted
        })
      );
      
      // Return S3 URI / key
      return `s3://${bucketName}/${uniqueName}`;
    } catch (error) {
      console.error('S3 Upload failed. Saving locally instead.', error);
      // Fallback
    }
  }

  // Local storage fallback
  const filePath = path.join(UPLOADS_DIR, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);
  return `local://${uniqueName}`;
};

/**
 * Download Encrypted File
 * Returns the file buffer
 */
const downloadFile = async (fileURL) => {
  if (fileURL.startsWith('s3://') && s3ClientInstance && s3Commands) {
    try {
      const { GetObjectCommand } = s3Commands;
      const bucketAndKey = fileURL.replace('s3://', '');
      const slashIndex = bucketAndKey.indexOf('/');
      const bucketName = bucketAndKey.substring(0, slashIndex);
      const key = bucketAndKey.substring(slashIndex + 1);

      const response = await s3ClientInstance.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      
      return await streamToBuffer(response.Body);
    } catch (error) {
      console.error('S3 Download failed, attempting local search fallback.', error);
    }
  }

  // Parse local key
  const key = fileURL.includes('://') ? fileURL.split('://')[1] : fileURL;
  const filePath = path.join(UPLOADS_DIR, key);

  if (!fs.existsSync(filePath)) {
    throw new Error('Requested file could not be found in storage.');
  }

  return fs.readFileSync(filePath);
};

/**
 * Delete Encrypted File
 */
const deleteFile = async (fileURL) => {
  if (fileURL.startsWith('s3://') && s3ClientInstance && s3Commands) {
    try {
      const { DeleteObjectCommand } = s3Commands;
      const bucketAndKey = fileURL.replace('s3://', '');
      const slashIndex = bucketAndKey.indexOf('/');
      const bucketName = bucketAndKey.substring(0, slashIndex);
      const key = bucketAndKey.substring(slashIndex + 1);

      await s3ClientInstance.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      console.error('S3 Delete failed:', error);
    }
  }

  const key = fileURL.includes('://') ? fileURL.split('://')[1] : fileURL;
  const filePath = path.join(UPLOADS_DIR, key);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
};

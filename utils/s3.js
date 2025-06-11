const AWS = require('aws-sdk');

// Configuring AWS SDK
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Helper to generate upload URL
exports.generateUploadURL = async (regNumber, extension = '.jpg') => {
  const key = `students/${regNumber}${extension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60 * 5, // 5 minutes validity
    ContentType: getMimeType(extension),
  };

  const uploadURL = await s3.getSignedUrlPromise('putObject', params);
  return uploadURL;
};

// Helper to generate view (download) URL
exports.generateViewURL = async (regNumber, extension = '.jpg') => {
  const key = `students/${regNumber}${extension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60 * 60, // 1 hour validity for viewing
  };

  const viewURL = await s3.getSignedUrlPromise('getObject', params);
  return viewURL;
};

// Generate upload URL for gate pass images
exports.generateGatePassUploadURL = async (regNumber, passType, extension = '.jpg') => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const filename = `${regNumber}_${passType}_${hh}${mm}${ss}`;
  const key = `gatepasses/${filename}${extension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60 * 5, // 5 minutes validity
    ContentType: getMimeType(extension),
  };

  const uploadURL = await s3.getSignedUrlPromise('putObject', params);
  return {uploadURL, key};
};

// Generate view URL for gate pass images
exports.generateGatePassViewURL = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60 * 60, // 1 hour validity for viewing
  };

  const viewURL = await s3.getSignedUrlPromise('getObject', params);
  return viewURL;
};

// Helper to check if file exists
exports.fileExists = async (regNumber, extension = '.jpg') => {
  const key = `students/${regNumber}${extension}`;

  try {
    await s3.headObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();

    return true;
  } catch (err) {
    if (err.code === 'NotFound') {
      return false;
    }
    throw err;
  }
};

// Private Helper function to map extension -> MIME type
const getMimeType = (extension) => {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
};

//delete file from s3
exports.deleteFile = async (regNumber, extension = '.jpg') => {
  const key = `students/${regNumber}${extension}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key
  };

  await s3.deleteObject(params).promise();
};


const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs').promises;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

// Memory storage for multer (files will be buffered in memory)
const memoryStorage = multer.memoryStorage();

// Multer configuration using memory storage
const multerConfig = {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
};

const upload = multer({ storage: memoryStorage, ...multerConfig });

// Upload to Cloudinary helper
const uploadToCloudinary = async (fileBuffer, folder = 'green-guard') => {
  try {
    // Convert buffer to data URI
    const base64Data = `data:image/${path.extname(fileBuffer.originalname).slice(1)};base64,${fileBuffer.buffer.toString('base64')}`;
    
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'image',
      eager: [
        { width: 2000, height: 2000, crop: 'limit', quality: 'auto' }
      ]
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud');
  }
};

// Upload profile picture with specific transformations
const uploadProfileToCloudinary = async (fileBuffer) => {
  try {
    const base64Data = `data:image/${path.extname(fileBuffer.originalname).slice(1)};base64,${fileBuffer.buffer.toString('base64')}`;
    
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'green-guard/profiles',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto' }
      ]
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload profile picture');
  }
};

// Extract public_id from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    // Extract public_id from URL like: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Skip 'upload', 'v...', and get the rest
    const pathParts = parts.slice(uploadIndex + 2);
    if (pathParts.length === 0) return null;
    
    // Join the path and remove file extension
    let publicId = pathParts.join('/');
    const lastDotIndex = publicId.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      publicId = publicId.substring(0, lastDotIndex);
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (url) => {
  try {
    const publicId = extractPublicId(url);
    if (!publicId) {
      console.log('Could not extract public_id from URL:', url);
      return;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', publicId, result);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  uploadProfileToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};

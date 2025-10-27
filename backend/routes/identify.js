const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/authMiddleware');
const plantIdentification = require('../utils/plantIdentification');

const router = express.Router();

// Use memory storage for temporary file handling
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    
    // Save file temporarily for plant identification
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    tempFilePath = path.join(uploadDir, 'temp-identify-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname));
    fs.writeFileSync(tempFilePath, req.file.buffer);
    
    const result = await plantIdentification.identifyPlant(tempFilePath);
    
    // Clean up temp file
    try { fs.unlinkSync(tempFilePath); } catch (_) {}
    tempFilePath = null;
    
    return res.json(result);
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
    console.error('Identify error:', error);
    return res.status(500).json({ error: 'Failed to identify plant' });
  }
});

module.exports = router;



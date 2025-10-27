const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { identifyPlant } = require('../utils/plantnet');
const fs = require('fs').promises; // Using promise version for async/await

// List plants with optional status filter and pagination
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) {
      query.adoptionStatus = status;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Plant.find(query)
        .sort({ datePosted: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('postedBy', 'name username'),
      Plant.countDocuments(query)
    ]);
    res.json({
      plants: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in GET /plants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get plant by id
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .populate('postedBy', 'name username')
      .populate('adoptedBy', 'name username');
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (error) {
    console.error('Error in GET /plants/:id:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { speciesCommonName, speciesScientificName, lat, lng, description } = req.body;

    if (!lat || !lng || !req.file) {
      return res.status(400).json({ message: 'Location and image are required' });
    }

    // Upload image to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file, 'green-guard/plants');
    const imageUrl = cloudinaryResult.secure_url;

    let commonName = speciesCommonName;
    let scientificName = speciesScientificName;

    // If speciesCommonName is missing, identify it from image
    if (!commonName) {
      try {
        // Save file temporarily for plant identification
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(__dirname, '..', 'uploads', 'temp-plant-' + Date.now() + path.extname(req.file.originalname));
        fs.writeFileSync(tempPath, req.file.buffer);
        
        const identification = await identifyPlant(tempPath);
        
        // Clean up temp file
        fs.unlinkSync(tempPath);

        const topResult = identification.results && identification.results[0];
        if (topResult && topResult.species) {
          if (Array.isArray(topResult.species.commonNames) && topResult.species.commonNames.length > 0) {
            commonName = topResult.species.commonNames[0];
          }
          scientificName = topResult.species.scientificNameWithoutAuthor || scientificName;
        }
      } catch (e) {
        console.warn('Plant identification error:', e);
      }
    }

    // Ensure speciesCommonName is present at this point (fallback)
    if (!commonName) {
      commonName = "Unknown";
    }

    const plant = new Plant({
      speciesCommonName: commonName,
      speciesScientificName: scientificName,
      imageUrl: imageUrl,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      description,
      postedBy: req.user.userId,
    });

    const savedPlant = await plant.save();

    // Add plant ID to user's plantsPosted array
    await User.findByIdAndUpdate(req.user.userId, { $push: { plantsPosted: savedPlant._id } });

    res.status(201).json({
  ...savedPlant.toObject(),
  identification: {
    commonName,
    scientificName,
    // Optionally: score, and raw PlantNet response if you want to show confidence
  }
});


  } catch (error) {
    console.error('Error in /plants POST:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete plant (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    if (String(plant.postedBy) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // remove from user's posted list
    await User.findByIdAndUpdate(req.user.userId, { $pull: { plantsPosted: plant._id } });
    
    // delete image from Cloudinary if it's a Cloudinary URL
    if (plant.imageUrl && plant.imageUrl.startsWith('http')) {
      await deleteFromCloudinary(plant.imageUrl);
    }
    
    await Plant.findByIdAndDelete(plant._id);
    res.json({ message: 'Plant deleted' });
  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

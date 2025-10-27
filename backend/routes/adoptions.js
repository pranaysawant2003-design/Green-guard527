const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

// Request adoption
router.post('/:plantId/request', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    const userId = req.user.userId;

    const plant = await Plant.findById(plantId);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    if (String(plant.postedBy) === String(userId)) {
      return res.status(400).json({ message: 'You cannot adopt your own listing' });
    }

    // Prevent multiple adoptions
    if (plant.adoptionStatus === 'adopted') {
      return res.status(409).json({ message: 'Plant already adopted' });
    }

    if (plant.adoptionStatus === 'pending' && String(plant.adoptionRequestedBy) !== String(userId)) {
      return res.status(409).json({ message: 'Plant adoption is pending by another user' });
    }

    plant.adoptionStatus = 'pending';
    plant.adoptionRequestedBy = userId;
    plant.adoptionRequestedAt = new Date();
    plant.adoptionHistory.push({ user: userId, action: 'requested' });

    await plant.save();

    // Track on user for history
    await User.findByIdAndUpdate(userId, { $addToSet: { plantsAdopted: plant._id } });

    // Notify owner
    await Notification.create({
      user: plant.postedBy,
      type: 'adoption_requested',
      title: 'New adoption request',
      body: 'Someone requested to adopt your plant',
      plant: plant._id,
      data: { plantId: plant._id, requesterId: userId }
    });

    res.json({ message: 'Adoption requested', status: plant.adoptionStatus, plantId: plant._id });
  } catch (err) {
    console.error('Adoption request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel adoption within 24 hours
router.post('/:plantId/cancel', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    const userId = req.user.userId;
    const plant = await Plant.findById(plantId);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    if (plant.adoptionStatus !== 'pending' || String(plant.adoptionRequestedBy) !== String(userId)) {
      return res.status(400).json({ message: 'No pending adoption to cancel for this user' });
    }

    const now = Date.now();
    const requestedAt = plant.adoptionRequestedAt ? plant.adoptionRequestedAt.getTime() : 0;
    const within24h = now - requestedAt <= 24 * 60 * 60 * 1000;
    if (!within24h) {
      return res.status(403).json({ message: 'Cancellation window (24h) has passed' });
    }

    plant.adoptionHistory.push({ user: userId, action: 'cancelled' });
    plant.adoptionStatus = 'available';
    plant.adoptionRequestedBy = undefined;
    plant.adoptionRequestedAt = undefined;

    await plant.save();
    // Notify owner
    await Notification.create({
      user: plant.postedBy,
      type: 'adoption_cancelled',
      title: 'Adoption request cancelled',
      body: 'The adoption request has been cancelled',
      plant: plant._id,
      data: { plantId: plant._id, requesterId: userId }
    });

    res.json({ message: 'Adoption cancelled', status: plant.adoptionStatus });
  } catch (err) {
    console.error('Adoption cancel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm adoption (owner action)
router.post('/:plantId/confirm', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    const ownerId = req.user.userId;
    const plant = await Plant.findById(plantId);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    if (String(plant.postedBy) !== String(ownerId)) {
      return res.status(403).json({ message: 'Only the owner can confirm adoption' });
    }

    if (plant.adoptionStatus !== 'pending' || !plant.adoptionRequestedBy) {
      return res.status(400).json({ message: 'No pending adoption to confirm' });
    }

    plant.adoptionStatus = 'adopted';
    plant.adoptedBy = plant.adoptionRequestedBy;
    plant.adoptedAt = new Date();
    plant.adoptionHistory.push({ user: plant.adoptedBy, action: 'adopted' });

    await plant.save();
    // Notify adopter
    await Notification.create({
      user: plant.adoptedBy,
      type: 'adoption_confirmed',
      title: 'Adoption confirmed',
      body: 'Your adoption request was confirmed',
      plant: plant._id,
      data: { plantId: plant._id }
    });

    res.json({ message: 'Adoption confirmed', status: plant.adoptionStatus });
  } catch (err) {
    console.error('Adoption confirm error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption status for a plant
router.get('/:plantId/status', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    const plant = await Plant.findById(plantId).select('adoptionStatus adoptionRequestedBy adoptedBy');
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    console.error('Adoption status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption history for the current user
router.get('/history/me', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const plants = await Plant.find({ 'adoptionHistory.user': userId })
      .select('speciesCommonName imageUrl adoptionHistory location postedBy adoptedBy adoptionStatus')
      .sort({ adoptedAt: -1, adoptionRequestedAt: -1 });
    res.json(plants);
  } catch (err) {
    console.error('Adoption history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



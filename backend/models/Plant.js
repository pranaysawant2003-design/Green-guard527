const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  speciesCommonName: { type: String, required: true },
  speciesScientificName: { type: String },
  imageUrl: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adoptionStatus: { type: String, enum: ['available', 'pending', 'adopted', 'unavailable'], default: 'available' },
  adoptionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adoptionRequestedAt: { type: Date },
  adoptedAt: { type: Date },
  adoptionHistory: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      action: { type: String, enum: ['requested', 'cancelled', 'adopted', 'reverted'] },
      at: { type: Date, default: Date.now }
    }
  ],
  datePosted: { type: Date, default: Date.now },
  description: { type: String }
});

module.exports = mongoose.model('Plant', plantSchema);

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Plant identification data
  plantData: {
    commonName: { type: String, required: true },
    scientificName: { type: String },
    confidence: { type: Number }, // AI identification confidence score
    family: { type: String },
    genus: { type: String }
  },
  
  // Post content
  caption: { type: String, maxLength: 500 },
  imageUrl: { type: String }, // legacy single image
  images: [{ type: String }], // new multi-image support
  
  // Location data
  location: {
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: { type: String },
    city: { type: String },
    country: { type: String }
  },
  
  // User interaction
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxLength: 200 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Post metadata
  isPublic: { type: Boolean, default: true },
  tags: [{ type: String }], // e.g., #houseplant, #garden, #rare
  isDraft: { type: Boolean, default: false },
  scheduledFor: { type: Date },

  // Adoption workflow on posts
  isUpForAdoption: { type: Boolean, default: false }, // NEW: Toggle for adoption availability
  adoptionStatus: { type: String, enum: ['available', 'pending', 'adopted', 'unavailable'], default: 'available' },
  adoptionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adoptionRequestedAt: { type: Date },
  adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adoptedAt: { type: Date },
  rejectedAdopters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who have been rejected
  adoptionHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['requested', 'cancelled', 'accepted', 'rejected', 'adopted', 'reverted'] },
    at: { type: Date, default: Date.now }
  }],
  
  // Plant care info (optional)
  careInfo: {
    wateringFrequency: { type: String },
    sunlightNeeds: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'] }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Index for geospatial queries (legacy placeholder, not used by GeoJSON here)

// Index for text search
postSchema.index({ 
  "plantData.commonName": "text", 
  "plantData.scientificName": "text", 
  "caption": "text",
  "tags": "text"
});

module.exports = mongoose.model('Post', postSchema);

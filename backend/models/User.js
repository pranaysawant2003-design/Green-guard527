const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  
  // Profile info
  bio: { type: String, maxLength: 160 },
  profilePicture: { type: String, default: '' },
  location: { type: String },
  website: { type: String },
  preferences: {
    plantTypes: { type: [String], default: [] },
    distanceKm: { type: Number, default: 25 },
    languages: { type: [String], default: ['en'] }
  },
  ratings: {
    score: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  
  // Social features
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }],
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }],
  
  // Legacy fields (keeping for backward compatibility)
  contactInfo: { type: String },
  plantsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant', default: [] }],
  plantsAdopted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant', default: [] }],
  adoptionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant', default: [] }],
  
  // Verification fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationOTP: { type: String },
  emailVerificationExpiry: { type: Date },
  phone: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  phoneVerificationOTP: { type: String },
  phoneVerificationExpiry: { type: Date },
  
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpiry: { type: Date },
  
  // Account settings
  isPrivate: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Virtual for post count
userSchema.virtual('postCount').get(function() {
  return this.posts ? this.posts.length : 0;
});

// Index for username search
userSchema.index({ username: 1 });
userSchema.index({ name: 'text', username: 'text', bio: 'text' });

module.exports = mongoose.model('User', userSchema);

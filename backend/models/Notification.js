const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives the notification
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who performed the action
  type: { 
    type: String, 
    enum: [
      'like', 
      'comment', 
      'follow', 
      'adoption_request',
      'adoption_accepted', 
      'adoption_rejected',
      'mention'
    ], 
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);



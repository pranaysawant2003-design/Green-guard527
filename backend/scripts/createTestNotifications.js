const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config();

async function createTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greenguardian');
    console.log('Connected to MongoDB');

    // Get the first user and second user
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in the database');
      process.exit(1);
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log(`User 1: ${user1.name} (${user1.username})`);
    console.log(`User 2: ${user2.name} (${user2.username})`);

    // Get a post from user1
    const post = await Post.findOne({ author: user1._id });

    // Create test notifications for user1 from user2
    const notifications = [];

    // Like notification
    notifications.push(await Notification.create({
      user: user1._id,
      actor: user2._id,
      type: 'like',
      post: post?._id
    }));

    // Comment notification
    notifications.push(await Notification.create({
      user: user1._id,
      actor: user2._id,
      type: 'comment',
      post: post?._id
    }));

    // Adoption request notification
    if (post) {
      notifications.push(await Notification.create({
        user: user1._id,
        actor: user2._id,
        type: 'adoption_request',
        post: post._id
      }));
    }

    console.log(`\n✅ Created ${notifications.length} test notifications for ${user1.name}`);
    
    // Show the notifications
    const allNotifs = await Notification.find({ user: user1._id })
      .populate('actor', 'name username')
      .populate('post', 'caption');
    
    console.log('\nNotifications in database:');
    allNotifs.forEach(n => {
      console.log(`- ${n.type}: ${n.actor?.name} (read: ${n.isRead})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestNotifications();

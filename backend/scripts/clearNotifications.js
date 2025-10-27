const mongoose = require('mongoose');
const Notification = require('../models/Notification');
require('dotenv').config();

async function clearNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greenguardian');
    console.log('Connected to MongoDB');

    // Delete all notifications
    const result = await Notification.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} notifications`);

    console.log('\n🎉 All notifications cleared!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearNotifications();

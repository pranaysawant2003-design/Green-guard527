const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function addUsernames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greenguardian');
    console.log('Connected to MongoDB');

    // Find all users without usernames
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`Found ${usersWithoutUsername.length} users without usernames`);

    for (const user of usersWithoutUsername) {
      // Generate username from name or email
      let baseUsername = user.name 
        ? user.name.toLowerCase().replace(/\s+/g, '')
        : user.email.split('@')[0].toLowerCase();

      // Ensure it's unique
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username, _id: { $ne: user._id } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user.username = username;
      await user.save();
      
      console.log(`✅ Updated user ${user.name} (${user.email}) -> username: ${username}`);
    }

    console.log('\n🎉 All users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUsernames();

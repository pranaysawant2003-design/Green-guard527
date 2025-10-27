const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, uploadProfileToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Check username availability (public - for registration)
router.get('/check-username-public/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if username is valid (lowercase, alphanumeric + underscore, min 3 chars)
    if (!/^[a-z0-9_]{3,}$/.test(username)) {
      return res.json({ available: false, error: 'Invalid username format' });
    }
    
    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

// Check username availability (authenticated - for profile edit)
router.get('/check-username/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;
    
    // Check if username is valid (lowercase, alphanumeric + underscore)
    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.json({ available: false, error: 'Invalid username format' });
    }
    
    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: currentUserId } 
    });
    
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

// Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    console.log('Backend: Profile request for username:', req.params.username);
    
    const user = await User.findOne({ username: req.params.username })
      .select('-passwordHash -emailVerificationOTP -phoneVerificationOTP -emailVerificationExpiry -phoneVerificationExpiry')
      .populate('posts', null, null, { sort: { createdAt: -1 } });

    console.log('Backend: User found:', !!user);
    if (user) {
      console.log('Backend: User details:', { id: user._id, name: user.name, username: user.username });
      console.log('Backend: User followers count:', user.followers ? user.followers.length : 0);
      console.log('Backend: User following count:', user.following ? user.following.length : 0);
    }

    if (!user) {
      console.log('Backend: User not found for username:', req.params.username);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts with full details
    const posts = await Post.find({ 
      author: user._id,
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } } // Include posts without isPublic field for backward compatibility
      ]
    })
      .populate('author', 'name username profilePicture isVerified')
      .sort({ createdAt: -1 });

    console.log('Backend: Found posts for user:', posts.length);

    // Ensure follower and following counts are included
    const userData = user.toObject();
    userData.followerCount = user.followers ? user.followers.length : 0;
    userData.followingCount = user.following ? user.following.length : 0;
    userData.postCount = posts.length;

    res.json({
      user: {
        ...userData,
        posts: posts
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, username, bio, location, website } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    
    // Handle username update
    if (username) {
      // Validate username format
      if (!/^[a-z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain lowercase letters, numbers, and underscores' });
      }
      
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      updateData.username = username;
    }

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if it exists
      const user = await User.findById(req.user.userId);
      if (user.profilePicture && user.profilePicture.startsWith('http')) {
        await deleteFromCloudinary(user.profilePicture);
      }
      
      // Upload new profile picture to Cloudinary
      const cloudinaryResult = await uploadProfileToCloudinary(req.file);
      updateData.profilePicture = cloudinaryResult.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-passwordHash -emailVerificationOTP -phoneVerificationOTP -emailVerificationExpiry -phoneVerificationExpiry');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Follow/Unfollow user
router.post('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    console.log('Follow request:', { targetUserId, currentUserId });

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.includes(targetUserId);
    console.log('Current following status:', isFollowing);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
      console.log('Unfollowing user');
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      console.log('Following user');
    }

    // Save without validation to avoid username requirement issues for old users
    await currentUser.save({ validateBeforeSave: false });
    await targetUser.save({ validateBeforeSave: false });

    console.log('Updated following count:', currentUser.following.length);
    console.log('Updated follower count:', targetUser.followers.length);

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length
    });

  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user' });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'followers',
        select: 'name username profilePicture isVerified followerCount',
        options: { skip, limit: parseInt(limit) }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      followers: user.followers,
      totalFollowers: user.followers.length
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get user's following
router.get('/:userId/following', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'following',
        select: 'name username profilePicture isVerified followerCount',
        options: { skip, limit: parseInt(limit) }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      following: user.following,
      totalFollowing: user.following.length
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { name: searchRegex },
        { bio: searchRegex }
      ]
    })
    .select('name username profilePicture bio isVerified followerCount postCount')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ followerCount: -1 }); // Sort by popularity

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        hasMore: users.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get suggested users to follow
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const followingIds = currentUser.following || [];
    
    // Find users not followed by current user, excluding themselves
    const suggestions = await User.find({
      _id: { 
        $nin: [...followingIds, req.user.userId] 
      }
    })
    .select('name username profilePicture bio isVerified followerCount postCount')
    .sort({ followerCount: -1, postCount: -1 })
    .limit(10);

    res.json({ suggestions });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch user suggestions' });
  }
});

// Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-passwordHash -emailVerificationOTP -phoneVerificationOTP -emailVerificationExpiry -phoneVerificationExpiry');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ 
      author: user._id,
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } }
      ]
    });

    // Ensure follower and following counts are included
    const userData = user.toObject();
    userData.followerCount = user.followers ? user.followers.length : 0;
    userData.followingCount = user.following ? user.following.length : 0;
    userData.postCount = postCount;

    res.json({ user: userData });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { plantTypes, distanceKm, languages } = req.body;
    const update = {};
    if (plantTypes !== undefined) update['preferences.plantTypes'] = plantTypes;
    if (distanceKm !== undefined) update['preferences.distanceKm'] = distanceKm;
    if (languages !== undefined) update['preferences.languages'] = languages;
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true })
      .select('-passwordHash -emailVerificationOTP -phoneVerificationOTP -emailVerificationExpiry -phoneVerificationExpiry');
    res.json({ message: 'Preferences updated', user });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Upload profile picture only
router.post('/upload-pfp', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Delete old profile picture if it exists
    const user = await User.findById(req.user.userId);
    if (user.profilePicture) {
      const oldImagePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload pfp error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Block user
router.post('/:userId/block', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.blockedUsers) {
      currentUser.blockedUsers = [];
    }

    if (currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    currentUser.blockedUsers.push(targetUserId);
    
    // Remove from following/followers
    if (currentUser.following) {
      currentUser.following.pull(targetUserId);
    }
    if (currentUser.followers) {
      currentUser.followers.pull(targetUserId);
    }

    await currentUser.save({ validateBeforeSave: false });

    // Remove current user from target's following/followers
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      if (targetUser.following) targetUser.following.pull(currentUserId);
      if (targetUser.followers) targetUser.followers.pull(currentUserId);
      await targetUser.save({ validateBeforeSave: false });
    }

    res.json({
      message: 'User blocked successfully',
      blockedUsers: currentUser.blockedUsers
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user
router.post('/:userId/unblock', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ error: 'User is not blocked' });
    }

    currentUser.blockedUsers.pull(targetUserId);
    await currentUser.save({ validateBeforeSave: false });

    res.json({
      message: 'User unblocked successfully',
      blockedUsers: currentUser.blockedUsers
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get blocked users list
router.get('/blocked', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('blockedUsers', 'name username profilePicture');

    res.json({
      blockedUsers: user.blockedUsers || []
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

module.exports = router;

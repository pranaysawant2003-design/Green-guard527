const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const plantIdentification = require('../utils/plantIdentification');

// Create a new post with plant identification (single image back-compat)
router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const { caption, latitude, longitude, address, city, country, tags, isUpForAdoption } = req.body;

    // Validate required location data
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Upload image to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file, 'green-guard/posts');
    const imageUrl = cloudinaryResult.secure_url;

    // Identify the plant from the uploaded image (best-effort)
    let plantData = { commonName: 'Plant', scientificName: '', confidence: undefined, family: '', genus: '' };
    try {
      // Save file temporarily for plant identification
      const fs = require('fs');
      const path = require('path');
      const tempPath = path.join(__dirname, '..', 'uploads', 'temp-' + Date.now() + path.extname(req.file.originalname));
      fs.writeFileSync(tempPath, req.file.buffer);
      
      const identificationResult = await plantIdentification.identifyPlant(tempPath);
      
      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      if (identificationResult && identificationResult.success && identificationResult.data) {
        plantData = identificationResult.data;
      } else {
        console.warn('Identification failed, proceeding with basic post:', identificationResult?.error);
      }
    } catch (e) {
      console.warn('Identification exception, proceeding with basic post');
    }

    // Create the post
    const post = new Post({
      plantData: {
        commonName: plantData.commonName,
        scientificName: plantData.scientificName,
        confidence: plantData.confidence,
        family: plantData.family,
        genus: plantData.genus
      },
      caption: caption || '',
      imageUrl: imageUrl,
      images: [imageUrl],
      location: {
        coordinates: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude)
        },
        address: address || '',
        city: city || '',
        country: country || ''
      },
      author: req.user.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isUpForAdoption: isUpForAdoption === 'true' || isUpForAdoption === true,
      careInfo: plantData.careInfo || {}
    });

    await post.save();

    console.log('Backend: Post created successfully:', {
      postId: post._id,
      author: post.author,
      caption: post.caption,
      plantData: post.plantData
    });

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { posts: post._id }
    });

    console.log('Backend: Post added to user posts array for user:', req.user.userId);

    // Populate author info for response
    await post.populate('author', 'name username profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post: post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Create post (multiple images, no identification)
router.post('/create-multi', authMiddleware, upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const { caption, latitude, longitude, address, city, country, tags, isDraft, scheduledFor, isUpForAdoption } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map(file => uploadToCloudinary(file, 'green-guard/posts'));
    const cloudinaryResults = await Promise.all(uploadPromises);
    const images = cloudinaryResults.map(result => result.secure_url);

    const post = new Post({
      plantData: {
        commonName: caption ? caption.slice(0, 40) : 'Plant'
      },
      caption: caption || '',
      images,
      location: {
        coordinates: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        address: address || '', city: city || '', country: country || ''
      },
      author: req.user.userId,
      tags: tags ? tags.split(',').map(t=>t.trim()) : [],
      isDraft: String(isDraft) === 'true',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      isUpForAdoption: isUpForAdoption === 'true' || isUpForAdoption === true
    });

    await post.save();
    await User.findByIdAndUpdate(req.user.userId, { $push: { posts: post._id } });
    await post.populate('author', 'name username profilePicture');
    res.status(201).json({ message: 'Post created', post });
  } catch (error) {
    console.error('Create multi post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Edit post
router.put('/:postId', authMiddleware, async (req, res) => {
  try {
    const { caption, tags, isPublic, isDraft, scheduledFor } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId) return res.status(403).json({ error: 'Not authorized' });

    if (caption !== undefined) post.caption = caption;
    if (tags !== undefined) post.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t=>t.trim());
    if (isPublic !== undefined) post.isPublic = Boolean(isPublic);
    if (isDraft !== undefined) post.isDraft = Boolean(isDraft);
    if (scheduledFor !== undefined) post.scheduledFor = scheduledFor ? new Date(scheduledFor) : undefined;

    await post.save();
    res.json({ message: 'Post updated', post });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});


// Get feed posts (timeline)
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findById(req.user.userId);
    const followingIds = user.following || [];
    
    // Include user's own posts and posts from people they follow
    const authorIds = [req.user.userId, ...followingIds];

    const posts = await Post.find({
      author: { $in: authorIds },
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } } // Include posts without isPublic field
      ]
    })
    .populate('author', 'name username profilePicture isVerified')
    .populate('comments.user', 'name username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    console.log('Backend: Feed posts found:', posts.length);
    console.log('Backend: Feed posts authors:', posts.map(p => ({ 
      postId: p._id, 
      authorId: p.author._id, 
      authorName: p.author.name, 
      authorUsername: p.author.username 
    })));

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(await Post.countDocuments({
          author: { $in: authorIds },
          $or: [
            { isPublic: true },
            { isPublic: { $exists: false } } // Include posts without isPublic field
          ]
        }) / limit)
      }
    });

  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get explore posts (discover new plants)
router.get('/explore', async (req, res) => {
  try {
    const { page = 1, limit = 20, plant, location, tag } = req.query;
    const skip = (page - 1) * limit;

    let query = { 
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } } // Include posts without isPublic field
      ]
    };

    // Filter by plant type if specified
    if (plant) {
      query.$or = [
        { 'plantData.commonName': { $regex: plant, $options: 'i' } },
        { 'plantData.scientificName': { $regex: plant, $options: 'i' } }
      ];
    }

    // Filter by tag if specified
    if (tag) {
      query.tags = { $regex: new RegExp(`^${tag}$`, 'i') }; // Exact tag match (case-insensitive)
    }

    const posts = await Post.find(query)
      .populate('author', 'name username profilePicture isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(await Post.countDocuments(query) / limit)
      }
    });

  } catch (error) {
    console.error('Explore error:', error);
    res.status(500).json({ error: 'Failed to fetch explore posts' });
  }
});

// Get all unique tags from posts
router.get('/tags', async (req, res) => {
  try {
    const tags = await Post.aggregate([
      {
        $match: {
          $or: [
            { isPublic: true },
            { isPublic: { $exists: false } }
          ],
          tags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 } // Top 20 tags
    ]);

    const tagList = tags.map(t => ({ tag: t._id, count: t.count }));
    res.json({ tags: tagList });

  } catch (error) {
    console.error('Tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get posts available for adoption within distance radius (for Adoption Map)
router.get('/adoption-map', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Find all posts marked as up for adoption
    const posts = await Post.find({
      isUpForAdoption: true,
      adoptionStatus: { $in: ['available', 'pending'] }, // Show available and pending
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } }
      ]
    })
    .populate('author', 'name username profilePicture isVerified')
    .sort({ createdAt: -1 });

    // Filter by distance using Haversine formula
    const postsWithinRadius = posts.filter(post => {
      const postLat = post.location.coordinates.lat;
      const postLng = post.location.coordinates.lng;
      
      const distance = calculateDistance(lat, lng, postLat, postLng);
      return distance <= radiusKm;
    }).map(post => {
      const distance = calculateDistance(lat, lng, post.location.coordinates.lat, post.location.coordinates.lng);
      return {
        ...post.toObject(),
        distance: parseFloat(distance.toFixed(2)) // Distance in km
      };
    });

    res.json({
      posts: postsWithinRadius,
      count: postsWithinRadius.length,
      radius: radiusKm
    });

  } catch (error) {
    console.error('Adoption map error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption map posts' });
  }
});

// Helper function: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Like/Unlike a post
router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.userId;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes.pull(userId);
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: post._id }
      });
      
      // Remove notification if exists
      await Notification.deleteOne({
        user: post.author,
        actor: userId,
        type: 'like',
        post: post._id
      });
    } else {
      // Like
      post.likes.push(userId);
      await User.findByIdAndUpdate(userId, {
        $push: { likedPosts: post._id }
      });
      
      // Create notification (don't notify yourself)
      if (userId.toString() !== post.author.toString()) {
        await Notification.create({
          user: post.author,
          actor: userId,
          type: 'like',
          post: post._id
        });
      }
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      likeCount: post.likes.length,
      isLiked: !isLiked
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like/unlike post' });
  }
});

// Add comment to post
router.post('/:postId/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      user: req.user.userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Create notification (don't notify yourself)
    if (req.user.userId.toString() !== post.author.toString()) {
      await Notification.create({
        user: post.author,
        actor: req.user.userId,
        type: 'comment',
        post: post._id,
        comment: post.comments[post.comments.length - 1]._id
      });
    }

    // Populate the new comment
    await post.populate('comments.user', 'name username profilePicture');

    res.status(201).json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get current user's posts (MUST be before /:postId to avoid route conflict)
router.get('/user', authMiddleware, async (req, res) => {
  try {
    console.log('Backend: Fetching posts for user ID:', req.user.userId);
    
    // Find posts by the current user, including those without isPublic field (for backward compatibility)
    const posts = await Post.find({ 
      author: req.user.userId,
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } } // Include posts without isPublic field
      ]
    })
      .populate('author', 'name username profilePicture isVerified')
      .sort({ createdAt: -1 });

    console.log('Backend: Found posts count:', posts.length);
    console.log('Backend: Posts:', posts.map(p => ({ id: p._id, caption: p.caption, author: p.author?.username })));

    res.json({ posts });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get single post details
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name username profilePicture isVerified followerCount')
      .populate('comments.user', 'name username profilePicture');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Adoption: request on a post
router.post('/:postId/adopt/request', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requesterId = req.user.userId;
    if (post.author.toString() === requesterId) {
      return res.status(400).json({ error: 'You cannot adopt your own post' });
    }

    // Check if user was previously rejected
    if (post.rejectedAdopters && post.rejectedAdopters.some(id => id.toString() === requesterId)) {
      return res.status(403).json({ error: 'Your previous adoption request was declined by the owner' });
    }

    if (post.adoptionStatus === 'adopted') {
      return res.status(409).json({ error: 'Already adopted' });
    }

    if (post.adoptionStatus === 'pending' && post.adoptionRequestedBy?.toString() !== requesterId) {
      return res.status(409).json({ error: 'Another request is already pending' });
    }

    post.adoptionStatus = 'pending';
    post.adoptionRequestedBy = requesterId;
    post.adoptionRequestedAt = new Date();
    post.adoptionHistory.push({ user: requesterId, action: 'requested' });
    await post.save();

    // Populate post data for DM
    await post.populate('plantData');

    // Notify owner
    await Notification.create({
      user: post.author,
      actor: requesterId,
      type: 'adoption_request',
      post: post._id
    });

    // Create DM conversation automatically
    const conversationId = Message.getConversationId(requesterId, post.author);
    const plantName = post.plantData?.commonName || 'plant';
    const messageContent = `Hi! I'm interested in adopting your ${plantName}. I've sent you an adoption request. 🌱`;

    await Message.create({
      sender: requesterId,
      receiver: post.author,
      content: messageContent,
      conversationId
    });

    res.json({ message: 'Adoption requested', status: post.adoptionStatus });
  } catch (error) {
    console.error('Post adopt request error:', error);
    res.status(500).json({ error: 'Failed to request adoption' });
  }
});

// Adoption: cancel own pending request (within 24h)
router.post('/:postId/adopt/cancel', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requesterId = req.user.userId;
    if (post.adoptionStatus !== 'pending' || post.adoptionRequestedBy?.toString() !== requesterId) {
      return res.status(400).json({ error: 'No pending request to cancel' });
    }

    const now = Date.now();
    const requestedAt = post.adoptionRequestedAt ? post.adoptionRequestedAt.getTime() : 0;
    if (now - requestedAt > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ error: 'Cancellation window passed' });
    }

    post.adoptionHistory.push({ user: requesterId, action: 'cancelled' });
    post.adoptionStatus = 'available';
    post.adoptionRequestedBy = undefined;
    post.adoptionRequestedAt = undefined;
    await post.save();

    try {
      await Notification.create({
        user: post.author,
        type: 'adoption_cancelled',
        title: 'Adoption request cancelled',
        body: 'The request was cancelled',
        post: post._id,
        data: { postId: post._id, requesterId }
      });
    } catch (_) {}

    res.json({ message: 'Cancelled', status: post.adoptionStatus });
  } catch (error) {
    console.error('Post adopt cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel adoption' });
  }
});

// Adoption: owner accepts
router.post('/:postId/adopt/accept', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId) return res.status(403).json({ error: 'Only owner can accept' });
    if (post.adoptionStatus !== 'pending' || !post.adoptionRequestedBy) return res.status(400).json({ error: 'No pending request' });

    post.adoptionStatus = 'adopted';
    post.adoptedBy = post.adoptionRequestedBy;
    post.adoptedAt = new Date();
    post.adoptionHistory.push({ user: post.adoptedBy, action: 'accepted' });
    await post.save();

    // Populate post data for DM
    await post.populate('plantData');

    // Create notification
    await Notification.create({
      user: post.adoptedBy,
      actor: req.user.userId,
      type: 'adoption_accepted',
      post: post._id
    });

    // Create DM conversation automatically
    const conversationId = Message.getConversationId(req.user.userId, post.adoptedBy);
    const plantName = post.plantData?.commonName || 'plant';
    const messageContent = `Great news! I've accepted your adoption request for my ${plantName}! 🎉 Congratulations on your new plant! 🌱`;

    await Message.create({
      sender: req.user.userId,
      receiver: post.adoptedBy,
      content: messageContent,
      conversationId
    });

    res.json({ message: 'Adoption accepted', status: post.adoptionStatus });
  } catch (error) {
    console.error('Post adopt accept error:', error);
    res.status(500).json({ error: 'Failed to accept adoption' });
  }
});

// Adoption: owner rejects
router.post('/:postId/adopt/reject', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId) return res.status(403).json({ error: 'Only owner can reject' });
    if (post.adoptionStatus !== 'pending' || !post.adoptionRequestedBy) return res.status(400).json({ error: 'No pending request' });

    const requesterId = post.adoptionRequestedBy;
    post.adoptionHistory.push({ user: requesterId, action: 'rejected' });
    
    // Add user to rejected adopters list
    if (!post.rejectedAdopters) {
      post.rejectedAdopters = [];
    }
    if (!post.rejectedAdopters.includes(requesterId)) {
      post.rejectedAdopters.push(requesterId);
    }
    
    post.adoptionStatus = 'available';
    post.adoptionRequestedBy = undefined;
    post.adoptionRequestedAt = undefined;
    await post.save();

    // Populate post data for DM
    await post.populate('plantData');

    // Create notification
    await Notification.create({
      user: requesterId,
      actor: req.user.userId,
      type: 'adoption_rejected',
      post: post._id
    });

    // Create DM conversation automatically
    const conversationId = Message.getConversationId(req.user.userId, requesterId);
    const plantName = post.plantData?.commonName || 'plant';
    const messageContent = `Thank you for your interest in my ${plantName}. Unfortunately, I'm unable to proceed with the adoption at this time. I appreciate your understanding. 🌿`;

    await Message.create({
      sender: req.user.userId,
      receiver: requesterId,
      content: messageContent,
      conversationId
    });

    res.json({ message: 'Adoption rejected', status: post.adoptionStatus });
  } catch (error) {
    console.error('Post adopt reject error:', error);
    res.status(500).json({ error: 'Failed to reject adoption' });
  }
});

// Adoption: lists for current user
router.get('/adoptions/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const requested = await Post.find({ adoptionRequestedBy: userId, adoptionStatus: 'pending' })
      .populate('author', 'name username profilePicture')
      .sort({ updatedAt: -1 });
    const adopted = await Post.find({ adoptedBy: userId, adoptionStatus: 'adopted' })
      .populate('author', 'name username profilePicture')
      .sort({ adoptedAt: -1 });
    const incoming = await Post.find({ author: userId, adoptionStatus: 'pending' })
      .populate('adoptionRequestedBy', 'name username profilePicture')
      .sort({ adoptionRequestedAt: -1 });

    res.json({ requested, adopted, incoming });
  } catch (error) {
    console.error('Post adoptions list error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption lists' });
  }
});

// Get liked posts for a user
router.get('/liked/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get liked posts
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts || [] } })
      .populate('author', 'name username profilePicture isVerified')
      .sort({ createdAt: -1 });
    
    // Add like status for current user
    const currentUserId = req.user.userId;
    const postsWithLikeStatus = likedPosts.map(post => ({
      ...post.toObject(),
      likeCount: post.likes ? post.likes.length : 0,
      commentCount: post.comments ? post.comments.length : 0,
      isLiked: post.likes && post.likes.includes(currentUserId)
    }));
    
    res.json({ posts: postsWithLikeStatus });
  } catch (error) {
    console.error('Get liked posts error:', error);
    res.status(500).json({ error: 'Failed to fetch liked posts' });
  }
});

// Delete post
router.delete('/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { posts: post._id }
    });

    // Delete images from Cloudinary
    const files = [];
    if (post.imageUrl) files.push(post.imageUrl);
    if (Array.isArray(post.images)) files.push(...post.images);
    
    // Delete each image from Cloudinary
    for (const fileUrl of files) {
      if (fileUrl && fileUrl.startsWith('http')) {
        await deleteFromCloudinary(fileUrl);
      }
    }

    // Delete the post
    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;

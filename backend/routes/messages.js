const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get all conversations for current user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name username profilePicture')
      .populate('receiver', 'name username profilePicture')
      .sort({ createdAt: -1 });

    // Group by conversation and get latest message for each
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      const conversationId = message.conversationId;
      
      if (!conversationsMap.has(conversationId)) {
        const otherUser = message.sender._id.toString() === userId.toString() 
          ? message.receiver 
          : message.sender;
        
        conversationsMap.set(conversationId, {
          conversationId,
          otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    // Count unread messages for each conversation
    for (let [conversationId, conversation] of conversationsMap) {
      const unreadCount = await Message.countDocuments({
        conversationId,
        receiver: userId,
        read: false
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());
    
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation
router.get('/conversation/:username', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { username } = req.params;

    // Find the other user
    const otherUser = await User.findOne({ username });
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversationId = Message.getConversationId(currentUserId, otherUser._id);

    // Get all messages in this conversation
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name username profilePicture')
      .populate('receiver', 'name username profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ messages, otherUser });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverUsername, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Find receiver
    const receiver = await User.findOne({ username: receiverUsername });
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversationId = Message.getConversationId(senderId, receiver._id);

    const message = new Message({
      sender: senderId,
      receiver: receiver._id,
      content: content.trim(),
      conversationId
    });

    await message.save();
    await message.populate('sender', 'name username profilePicture');
    await message.populate('receiver', 'name username profilePicture');

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark conversation as read
router.put('/mark-read/:username', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { username } = req.params;

    const otherUser = await User.findOne({ username });
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversationId = Message.getConversationId(currentUserId, otherUser._id);

    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;

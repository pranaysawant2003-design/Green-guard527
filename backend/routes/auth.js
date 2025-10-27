const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { generateOTP, sendEmailOTP, sendSMSOTP, verifyOTP } = require('../utils/otpUtils');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      // If user exists but email is not verified, allow resending verification
      if (!existing.isEmailVerified) {
        // Generate new OTP
        const emailOTP = generateOTP();
        const emailExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        existing.emailVerificationOTP = emailOTP;
        existing.emailVerificationExpiry = emailExpiry;
        await existing.save();
        
        // Send new email OTP
        const emailSent = await sendEmailOTP(email, emailOTP);
        if (!emailSent) {
          return res.status(500).json({ message: 'Failed to send verification email' });
        }
        
        return res.status(200).json({ 
          message: 'Verification code resent to your email.',
          userId: existing._id
        });
      } else {
        return res.status(400).json({ message: 'Email already registered and verified' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification OTP
    const emailOTP = generateOTP();
    const emailExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate username from name (lowercase, no spaces, unique)
    let username = name.toLowerCase().replace(/\s+/g, '');
    let counter = 1;
    let finalUsername = username;
    
    // Ensure username is unique
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Create user with verification data
    const user = new User({
      name,
      username: finalUsername,
      email,
      passwordHash,
      phone,
      emailVerificationOTP: emailOTP,
      emailVerificationExpiry: emailExpiry
    });
    await user.save();

    // Send email OTP
    const emailSent = await sendEmailOTP(email, emailOTP);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({ 
      message: 'Registration successful! Please check your email for verification code.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email first. Check your inbox for verification code.',
        needsVerification: true,
        userId: user._id
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
    res.json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify email OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isValid = verifyOTP(user.emailVerificationOTP, user.emailVerificationExpiry, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend email verification
router.post('/resend-email-verification', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new OTP
    const emailOTP = generateOTP();
    const emailExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = emailOTP;
    user.emailVerificationExpiry = emailExpiry;
    await user.save();

    // Send new email OTP
    const emailSent = await sendEmailOTP(user.email, emailOTP);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send phone verification OTP
router.post('/send-phone-verification', async (req, res) => {
  try {
    const { userId, phone } = req.body;
    if (!userId || !phone) {
      return res.status(400).json({ message: 'User ID and phone number are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate phone OTP
    const phoneOTP = generateOTP();
    const phoneExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.phone = phone;
    user.phoneVerificationOTP = phoneOTP;
    user.phoneVerificationExpiry = phoneExpiry;
    await user.save();

    // Send SMS OTP
    const smsSent = await sendSMSOTP(phone, phoneOTP);
    if (!smsSent) {
      return res.status(500).json({ message: 'Failed to send SMS verification' });
    }

    res.json({ message: 'Verification code sent to your phone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify phone OTP
router.post('/verify-phone', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isValid = verifyOTP(user.phoneVerificationOTP, user.phoneVerificationExpiry, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationOTP = undefined;
    user.phoneVerificationExpiry = undefined;
    await user.save();

    res.json({ message: 'Phone verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailSent = await sendEmailOTP(email, resetLink, 'password-reset');
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if token is expired
    if (user.passwordResetExpiry < new Date()) {
      return res.status(400).json({ message: 'Password reset token has expired' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Generate JWT token for testing (REMOVE IN PRODUCTION)
router.post('/generate-token', async (req, res) => {
  try {
    const { userId, expiresIn = '7d', customPayload } = req.body;
    
    if (!userId && !customPayload) {
      return res.status(400).json({ 
        message: 'Either userId or customPayload is required' 
      });
    }

    let token;
    if (customPayload) {
      // Generate token with custom payload
      token = jwt.sign(
        customPayload,
        process.env.JWT_SECRET,
        { expiresIn }
      );
    } else {
      // Generate token for specific user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn }
      );
    }

    res.json({ 
      token,
      expiresIn,
      payload: customPayload || { userId },
      message: 'JWT token generated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

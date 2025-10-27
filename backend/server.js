const path = require('path');
const fs = require('fs');

// Resolve .env file path
const envPath = path.join(__dirname, '.env');
console.log("Looking for .env at:", envPath);
console.log("File exists:", fs.existsSync(envPath));

// Load .env variables
require('dotenv').config({ path: envPath });
console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
console.log("Cloudinary configured for cloud:", process.env.CLOUDINARY_CLOUD_NAME);

const app = express();

// Middleware to enable CORS and parse JSON bodies
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization']
}));
app.use(express.json());

// Serve uploaded plant images statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import and use route files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/adoptions', require('./routes/adoptions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/identify', require('./routes/identify'));
app.use('/api/messages', require('./routes/messages'));


// Root route test
app.get('/', (req, res) => {
  res.send('Plant Social Platform API is running...');
});

// Final check before DB connect
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

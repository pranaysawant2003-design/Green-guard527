# Environment Variables Setup

## Important: Complete Your `.env` File

You need to create a `.env` file in the `backend` directory with your credentials.

## Steps:

### 1. Create the `.env` file

Create a file named `.env` in the `backend` directory.

### 2. Copy this template and fill in the values:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/green_guard

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=root
CLOUDINARY_API_KEY=834653391475672
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET_HERE
```

### 3. Get Your Cloudinary API Secret

You still need to get your Cloudinary API Secret:

1. Go to [https://cloudinary.com/console](https://cloudinary.com/console)
2. Login to your account
3. Click on the **Settings** tab (gear icon)
4. Scroll to **Security** section
5. Find **API Secret**
6. Click **Reveal** to view it
7. Copy the API Secret

### 4. Update `.env` file

Replace `YOUR_CLOUDINARY_API_SECRET_HERE` with your actual API Secret from Cloudinary.

### 5. Update MongoDB URI

If your MongoDB is running locally, update the connection string. If you're using MongoDB Atlas, use your Atlas connection string.

## Your Current Setup:

✅ **Cloudinary Cloud Name:** `root`  
✅ **Cloudinary API Key:** `834653391475672`  
⚠️ **Cloudinary API Secret:** *Need to get from Cloudinary dashboard*  
⚠️ **MongoDB URI:** *Need to configure*  
⚠️ **JWT Secret:** *Need to configure*

## Quick Test:

After setting up your `.env` file, run:

```bash
cd FINAL MAINPROJECT_1/MAINPROJECT/backend
npm run dev
```

You should see:
- ✅ MongoDB connected
- ✅ Cloudinary configured for cloud: root

## Security Note:

Never commit your `.env` file to version control!


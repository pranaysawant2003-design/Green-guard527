# Cloudinary Setup Guide

This application has been migrated to use Cloudinary for cloud-based image storage instead of local file storage.

## Why Cloudinary?

- **Scalability**: No local disk space limits
- **CDN**: Images are served from Cloudinary's global CDN for fast loading
- **Optimization**: Automatic image optimization and transformation
- **Hosting Ready**: Perfect for deploying to cloud platforms like Heroku, Vercel, Netlify, etc.

## Getting Started

### 1. Sign up for Cloudinary

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. After signing up, you'll be redirected to your dashboard

### 2. Get your API Credentials

From your Cloudinary dashboard:
1. Look for your **Cloud name** (shown at the top of the dashboard)
2. Go to the **Settings** tab (click the gear icon)
3. Scroll down to **Security** section
4. You'll find:
   - **Cloud name**
   - **API Key**
   - **API Secret** (click "Reveal" to view)

### 3. Add Environment Variables

Create or update your `.env` file in the backend directory with:

```env
# Existing environment variables
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# Add these Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace:
- `your_cloud_name` with your Cloudinary cloud name
- `your_api_key` with your Cloudinary API key
- `your_api_secret` with your Cloudinary API secret

### 4. Install Dependencies

The Cloudinary packages should already be installed. If not, run:

```bash
cd FINAL MAINPROJECT_1/MAINPROJECT/backend
npm install
```

### 5. Start Your Server

```bash
npm run dev
```

## What Changed?

### Files Modified:
- `backend/utils/cloudinary.js` - New Cloudinary configuration
- `backend/routes/posts.js` - Now uploads post images to Cloudinary
- `backend/routes/users.js` - Now uploads profile pictures to Cloudinary
- `backend/routes/plants.js` - Now uploads plant images to Cloudinary
- `backend/server.js` - Cloudinary initialization

### How It Works:
1. When users upload images, multer saves them to memory
2. Images are then uploaded to Cloudinary
3. Cloudinary returns a secure HTTPS URL
4. The URL is stored in the database instead of local file paths

### Image Folders in Cloudinary:
- **Posts**: `green-guard/posts/`
- **Profiles**: `green-guard/profiles/`
- **Plants**: `green-guard/plants/`

## Benefits

### For Development:
- No need to manage local uploads folder
- Images persist even when code changes
- Faster uploads and retrieval

### For Production:
- Automatic image optimization
- Global CDN delivery
- Unlimited storage (on free tier: 25GB)
- Transform images on the fly (resize, crop, format conversion)
- Backup and secure storage

## Free Tier Limits (Cloudinary)

- **Storage**: 25GB
- **Bandwidth**: 25GB per month
- **Transformations**: Unlimited
- **Uploads**: 25GB per month

This is usually sufficient for most applications.

## Troubleshooting

### Images not uploading?
- Check your `.env` file has correct Cloudinary credentials
- Verify credentials in Cloudinary dashboard
- Check console logs for error messages

### Old local images?
Images uploaded before the migration will still be in your `uploads/` folder. You can:
1. Keep serving them from local storage (existing routes still work)
2. Or migrate them to Cloudinary using the Cloudinary dashboard

### Need to migrate existing images?

You can use Cloudinary's upload widget or CLI to migrate existing images:

```bash
npm install -g cloudinary-cli
cd uploads
cloudinary upload-dir <folder_name>
```

## Security

- Never commit your `.env` file to version control
- API Secret should be kept private
- Cloudinary URLs are secure by default (HTTPS)
- You can configure upload restrictions in Cloudinary dashboard

## Next Steps

1. Add Cloudinary credentials to your `.env` file
2. Test image uploads in your application
3. Check your Cloudinary dashboard to see uploaded images
4. Monitor usage in the Cloudinary dashboard

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Image Transformations](https://cloudinary.com/documentation/image_transformations)


# Green Guard 🌱

A comprehensive plant identification and gardening management application built with React and Node.js.

## Features

- **Plant Identification**: Upload images to identify plants using AI
- **Garden Management**: Track and manage your plants
- **Community Features**: Share and discover plants with other gardeners
- **AR Scanner**: Augmented reality plant scanning capabilities
- **User Authentication**: Secure user accounts and profiles

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Multer (file uploads)
- PlantNet API integration

## Project Structure

```
MAINPROJECT/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── assets/        # Static assets
│   │   └── ...
│   └── public/        # Public assets
├── backend/           # Node.js server
│   ├── routes/        # API routes
│   ├── models/        # Database models
│   ├── middleware/    # Custom middleware
│   └── utils/         # Utility functions
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd GREEN-GUARD/MAINPROJECT
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
Create `.env` files in the backend directory with your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the development servers
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/identify` - Plant identification
- `GET /api/plants` - Get user's plants
- `POST /api/plants` - Add new plant

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 
import React from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/Profile';
import Navigation from '../components/Navigation';

const ProfilePage = ({ isOwnProfile = false }) => {
  const { username } = useParams();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Profile username={username} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
};

export default ProfilePage;

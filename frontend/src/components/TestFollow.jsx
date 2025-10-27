import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestFollow = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get current user
      const currentUserResponse = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(currentUserResponse.data.user);

      // Get all users (for testing)
      const usersResponse = await axios.get('/api/users/search?q=&limit=10');
      setUsers(usersResponse.data.users.filter(user => user._id !== currentUserResponse.data.user._id));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Follow response:', response.data);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Follow Test</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Current User:</h3>
        <p>Name: {currentUser?.name}</p>
        <p>Username: {currentUser?.username}</p>
        <p>Following: {currentUser?.following?.length || 0}</p>
        <p>Followers: {currentUser?.followers?.length || 0}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Other Users:</h3>
        {users.map(user => (
          <div key={user._id} className="border p-3 mb-2 rounded">
            <p>Name: {user.name}</p>
            <p>Username: {user.username}</p>
            <p>Followers: {user.followerCount || 0}</p>
            <button
              onClick={() => handleFollow(user._id)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestFollow;

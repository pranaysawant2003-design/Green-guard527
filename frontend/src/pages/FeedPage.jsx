import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Feed from '../components/Feed';
import Navigation from '../components/Navigation';

const FeedPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightPostId = params.get('post');

  useEffect(() => {
    // Scroll to highlighted post after a short delay
    if (highlightPostId) {
      setTimeout(() => {
        const postElement = document.getElementById(`post-${highlightPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-50');
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            postElement.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [highlightPostId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-green-800 mb-6">My Feed</h1>
        <Feed highlightPostId={highlightPostId} />
      </div>
    </div>
  );
};

export default FeedPage;

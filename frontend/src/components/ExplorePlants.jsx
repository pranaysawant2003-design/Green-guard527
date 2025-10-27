import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';

const ExplorePlants = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    fetchTags();
    fetchExplorePosts();
  }, [searchQuery, activeFilter]);

  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await axios.get('/api/posts/tags');
      setAvailableTags(response.data.tags || []);
      setTagsLoading(false);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTagsLoading(false);
    }
  };

  const fetchExplorePosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20
      });

      if (searchQuery) {
        params.append('plant', searchQuery);
      }

      // Add tag filter
      if (activeFilter && activeFilter !== 'latest') {
        params.append('tag', activeFilter);
      }

      const response = await axios.get(`/api/posts/explore?${params}`);
      
      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }

      setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExplorePosts(nextPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExplorePosts(1);
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setPage(1);
    // Don't set searchQuery, we'll use the category filter instead
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to like posts');
        return;
      }

      const response = await axios.post(`/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, likeCount: response.data.likeCount, isLiked: response.data.isLiked }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to comment');
        return;
      }

      const response = await axios.post(`/api/posts/${postId}/comment`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, response.data.comment] }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🌿 Explore Plants</h1>
          <p className="text-gray-600">Discover amazing plants from around the world</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <form onSubmit={handleSearch} className="flex space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for plants (e.g., Monstera, Rose, Cactus)..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              🔍 Search
            </button>
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-x-auto">
          <div className="flex space-x-1 p-2">
            {/* Latest Filter */}
            <button
              onClick={() => handleFilterChange('latest')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 ${
                activeFilter === 'latest'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              🆕 Latest
            </button>

            {/* Dynamic Tag Filters */}
            {tagsLoading ? (
              <div className="px-4 py-2 text-gray-400">Loading tags...</div>
            ) : (
              availableTags.map((tagData) => (
                <button
                  key={tagData.tag}
                  onClick={() => handleFilterChange(tagData.tag)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeFilter === tagData.tag
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  #{tagData.tag} <span className="text-xs opacity-75">({tagData.count})</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && posts.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post._id} className="transform hover:scale-105 transition-transform duration-200">
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  compact={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && posts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Loading...' : 'Load More Plants'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              {searchQuery ? `No plants found for "${searchQuery}"` : 'No plants to explore yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try searching for different plant names or types'
                : 'Be the first to share a plant discovery!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  fetchExplorePosts(1);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                View All Plants
              </button>
            )}
          </div>
        )}

        {/* No extra categories section */}
      </div>
    </div>
  );
};

export default ExplorePlants;

import React, { useState } from 'react';

const Community = ({ showMessage }) => {
  const [posts, setPosts] = useState([
    { id: 1, author: "Jane Doe", avatar: "JD", time: "2 hours ago", content: "My little oak sapling just sprouted its first new leaves! So proud of its progress. #GreenGuard #PlantParent", likes: 15, comments: 3, liked: false },
    { id: 2, author: "Alex M.", avatar: "AM", time: "1 day ago", content: "Just adopted a new mangrove seedling! Excited to contribute to coastal restoration. 🌊 #MangroveLove #Conservation", likes: 28, comments: 7, liked: false },
    { id: 3, author: "Chris P.", avatar: "CP", time: "3 days ago", content: "My indoor herb garden is flourishing! Fresh basil for dinner tonight. 🌿 Anyone else growing herbs? #HomeGarden #Herbs", likes: 10, comments: 2, liked: false }
  ]);

  const [newPost, setNewPost] = useState({ content: '', author: '' });

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLiked = !post.liked;
        const newLikes = newLiked ? post.likes + 1 : post.likes - 1;
        showMessage(newLiked ? "Liked!" : "Unliked!", newLiked ? 'success' : 'info');
        return { ...post, liked: newLiked, likes: newLikes };
      }
      return post;
    }));
  };

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (newPost.content.trim()) {
      const post = {
        id: posts.length + 1,
        author: newPost.author || 'Anonymous Guardian',
        avatar: (newPost.author || 'Anonymous Guardian').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        time: "Just now",
        content: newPost.content,
        likes: 0,
        comments: 0,
        liked: false
      };
      setPosts([post, ...posts]);
      setNewPost({ content: '', author: '' });
      showMessage("Your post has been shared!", 'success');
    } else {
      showMessage("Please write something to post.", 'error');
    }
  };

  return (
    <section id="community" className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-gray-900">
            Connect with <span className="text-emerald-600">Guardians</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Share your journey, celebrate milestones, and get inspired by a global community of nature lovers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="fade-in-up">
            <h3 className="text-3xl font-bold mb-6 text-gray-900">Community Feed</h3>
            <div className="community-feed">
              {posts.map(post => (
                <div key={post.id} className="community-post flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                    {post.avatar}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">{post.author} <span className="text-sm text-gray-500 font-normal">- {post.time}</span></p>
                    <p className="text-gray-700 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                                    <button 
                                onClick={() => handleLike(post.id)}
                                className={`like-button flex items-center gap-1 hover:text-red-500 transition-colors ${post.liked ? 'liked' : ''}`}
                              >
                                                                  <svg className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} fill={post.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                <span className="like-count">{post.likes}</span> Likes
                              </button>
                                                    <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                               </svg>
                                <span>{post.comments} Comments</span>
                              </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-in-up">
            <h3 className="text-3xl font-bold mb-6 text-gray-900">Share Your Story</h3>
            <div className="glass-card p-8 rounded-2xl">
              <form onSubmit={handleSubmitPost}>
                <div className="mb-4">
                  <label htmlFor="post-content" className="block text-gray-700 text-lg font-semibold mb-2">What's new in your garden?</label>
                  <textarea 
                    id="post-content"
                    rows="5" 
                    className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm text-gray-800"
                    placeholder="Share your plant's progress, a new adoption, or an inspiring thought..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="post-author" className="block text-gray-700 text-lg font-semibold mb-2">Your Name</label>
                  <input 
                    type="text" 
                    id="post-author"
                    className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm text-gray-800"
                    placeholder="Anonymous Guardian"
                    value={newPost.author}
                    onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-1 transition-all duration-300"
                >
                  Post to Community
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community; 
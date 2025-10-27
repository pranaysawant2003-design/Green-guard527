import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function AdoptionHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('requested');
  const [lists, setLists] = useState({ requested: [], adopted: [], incoming: [] });
  const [loading, setLoading] = useState(true);

  // Check URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['requested', 'incoming', 'adopted'].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [location.search]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await fetch('http://localhost:5000/api/posts/adoptions/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');
      setLists(data);
    } catch (e) {
      console.error('Failed loading adoption lists', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);

  const buildThumb = (p) => {
    const raw = p?.imageUrl || (Array.isArray(p?.images) ? p.images[0] : '');
    if (!raw) return 'https://via.placeholder.com/80x80?text=Plant';
    const cleaned = String(raw).replace(/\\\\/g, '/').replace(/\\/g, '/');
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    const withoutLeading = cleaned.replace(/^\/+/, '');
    return `http://localhost:5000/${withoutLeading}`;
  };

  const handleAccept = async (postId) => {
    try {
      // Find the post to get requester info
      const post = lists.incoming?.find(p => p._id === postId);
      
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${postId}/adopt/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to accept');
      
      const requesterUsername = post?.adoptionRequestedBy?.username || post?.author?.username;
      const plantName = post?.plantData?.commonName || 'plant';
      
      // Show success message with DM link
      if (window.confirm(`🎉 Adoption accepted!\n\nA congratulations message has been sent to the new owner.\n\nWould you like to view the conversation?`)) {
        navigate(`/messages/${requesterUsername}`);
      } else {
        fetchLists();
      }
    } catch (e) {
      console.error('Accept request failed', e);
      alert('Failed to accept adoption request');
    }
  };

  const handleReject = async (postId) => {
    try {
      // Find the post to get requester info
      const post = lists.incoming?.find(p => p._id === postId);
      
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${postId}/adopt/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to reject');
      
      const requesterUsername = post?.adoptionRequestedBy?.username || post?.author?.username;
      const plantName = post?.plantData?.commonName || 'plant';
      
      // Show info message
      if (window.confirm(`Adoption request declined.\n\nA polite message has been sent to the requester.\n\nWould you like to view the conversation?`)) {
        navigate(`/messages/${requesterUsername}`);
      } else {
        fetchLists();
      }
    } catch (e) {
      console.error('Reject request failed', e);
      alert('Failed to reject adoption request');
    }
  };

  const Card = ({ post }) => {
    const isAdopted = tab === 'adopted';
    const isPending = tab === 'incoming';
    
    return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className="relative">
        <img 
          src={buildThumb(post)} 
          alt={post?.plantData?.commonName} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
          {post?.plantData?.scientificName ? '🌿 Identified' : '🌱 Plant'}
        </div>
        {isAdopted && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ✅ Adopted
          </div>
        )}
        {isPending && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ⏳ Pending
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">
          {post?.plantData?.commonName || post.caption || 'Beautiful Plant'}
        </h3>
        {post?.plantData?.scientificName && (
          <p className="text-sm text-gray-600 italic mb-2">{post?.plantData?.scientificName}</p>
        )}
        
        {/* Author / Owner Info */}
        <Link 
          to={`/profile/${(isAdopted && isPending) ? post?.adoptionRequestedBy?.username : post?.author?.username}`}
          className="flex items-center gap-2 mb-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition group/author"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center border-2 border-emerald-200 group-hover/author:border-emerald-400 transition">
            <span className="text-sm font-bold text-emerald-700">
              {(isPending ? post?.adoptionRequestedBy?.name : post?.author?.name)?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 group-hover/author:text-emerald-700 transition">
                {isPending ? post?.adoptionRequestedBy?.name : post?.author?.name}
              </p>
              {isAdopted && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Original Owner
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              @{isPending ? post?.adoptionRequestedBy?.username : post?.author?.username}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover/author:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        
        {/* Caption */}
        {post?.caption && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.caption}</p>
        )}
        
        {/* Adopted Date */}
        {isAdopted && post?.adoptedAt && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <span>🎉</span>
              <span className="font-medium">Adopted on {new Date(post.adoptedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        {tab === 'incoming' ? (
          <div className="flex gap-2">
            <button 
              onClick={() => handleReject(post._id)} 
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              ❌ Reject
            </button>
            <button 
              onClick={() => handleAccept(post._id)} 
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transition shadow-md"
            >
              ✅ Accept
            </button>
          </div>
        ) : isAdopted ? (
          <div className="w-full px-4 py-3 text-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md font-medium text-sm">
            <span className="inline-flex items-center gap-2">
              <span>🌿</span>
              <span>Your Adopted Plant</span>
              <span>✨</span>
            </span>
          </div>
        ) : (
          <Link 
            to={`/profile/${post?.author?.username}`}
            className="block text-center px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
          >
            View Profile →
          </Link>
        )}
      </div>
    </div>
    );
  };

  const stats = {
    requested: lists.requested?.length || 0,
    incoming: lists.incoming?.length || 0,
    adopted: lists.adopted?.length || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Back Button */}
            <button
              onClick={() => navigate('/feed')}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  🌱 Plant Adoptions
                </h1>
                <p className="text-gray-600">
                  Manage your adoption requests and discover new plant friends
                </p>
              </div>
            <button
              onClick={() => navigate('/adoption-map')}
              className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all duration-300 hover:scale-105"
            >
              <span>🗺️</span>
              <span>Find Plants Nearby</span>
            </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.requested}</div>
              <div className="text-xs text-blue-600 font-medium">Requested</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{stats.incoming}</div>
              <div className="text-xs text-amber-600 font-medium">Pending</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">{stats.adopted}</div>
              <div className="text-xs text-emerald-600 font-medium">Adopted</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'requested', label: '📤 Requested', color: 'blue' },
              { id: 'incoming', label: '📥 Incoming', color: 'amber' },
              { id: 'adopted', label: '✅ Adopted', color: 'emerald' }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)} 
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  tab === t.id 
                    ? `bg-gradient-to-r from-${t.color}-600 to-${t.color}-700 text-white shadow-lg scale-105` 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Map Button */}
        <button
          onClick={() => navigate('/adoption-map')}
          className="sm:hidden w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all duration-300 mb-6"
        >
          <span>🗺️</span>
          <span>Find Plants Nearby</span>
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
            <p className="text-gray-600">Loading your plants...</p>
          </div>
        ) : (
          <>
            {(lists[tab] || []).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  {tab === 'requested' && '📤'}
                  {tab === 'incoming' && '📥'}
                  {tab === 'adopted' && '🌿'}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tab === 'requested' && 'No adoption requests yet'}
                  {tab === 'incoming' && 'No pending requests'}
                  {tab === 'adopted' && 'No adopted plants yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {tab === 'requested' && 'Browse the map to find plants to adopt'}
                  {tab === 'incoming' && 'When someone requests your plants, they\'ll appear here'}
                  {tab === 'adopted' && 'Start adopting plants to build your collection'}
                </p>
                <button
                  onClick={() => navigate('/adoption-map')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition"
                >
                  <span>🗺️</span>
                  <span>Explore Adoption Map</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(lists[tab] || []).map(p => (
                  <Card key={p._id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



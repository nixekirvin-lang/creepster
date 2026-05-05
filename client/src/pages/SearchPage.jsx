import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import Icons from '../components/Icons';

export default function SearchPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {}
    setLoading(false);
  }, [api]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(query);
  };

  const handleFollow = async (e, username) => {
    e.stopPropagation();
    try {
      await api(`/api/users/${username}/follow`, { method: 'POST' });
      setResults(prev => ({
        ...prev,
        users: prev.users.map(u => u.username === username ? { ...u, isFollowing: !u.isFollowing } : u)
      }));
    } catch {}
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search whispers, users, hashtags..."
              autoFocus
            />
          </div>
        </div>

        {searched && (
          <div className="search-type-tabs">
            {['all', 'users', 'posts'].map(tab => (
              <button
                key={tab}
                className={`search-type-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : searched ? (
          <div className="search-results">
            {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {activeTab === 'all' && <h3 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Users</h3>}
                {results.users.map(u => (
                  <div key={u.id} className="user-list-item" onClick={() => navigate(`/profile/${u.username}`)}>
                    <Avatar user={u} size={44} />
                    <div className="user-list-item-info">
                      <div style={{ fontWeight: 700 }}>{u.display_name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{u.username}</div>
                      {u.bio && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                    </div>
                    <button
                      className={`btn btn-sm ${u.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={(e) => handleFollow(e, u.username)}
                    >
                      {u.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
              <div>
                {activeTab === 'all' && <h3 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Whispers</h3>}
                {results.posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {results.hashtags?.length > 0 && activeTab === 'all' && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hashtags</h3>
                {results.hashtags.map(h => (
                  <div key={h.tag} className="trending-item" onClick={() => navigate(`/hashtag/${h.tag}`)}>
                    <div className="trending-tag">#{h.tag}</div>
                    <div className="trending-count">{h.post_count} whispers</div>
                  </div>
                ))}
              </div>
            )}

            {(!results.users?.length && !results.posts?.length && !results.hashtags?.length) && (
              <div className="empty-state">
                <h3>Nothing found in the static.</h3>
                <p>Try different search terms.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <h3>Search the void</h3>
            <p>Find whispers, users, and hashtags.</p>
          </div>
        )}
      </main>
    </div>
  );
}

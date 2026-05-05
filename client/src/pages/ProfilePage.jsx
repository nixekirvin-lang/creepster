import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import TrendingSection from '../components/TrendingSection';
import Icons from '../components/Icons';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, api } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [following, setFollowing] = useState(false);
  const sentinelRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/api/users/${username}`);
      setProfile(data);
      setFollowing(data.isFollowing);
    } catch { navigate('/'); }
    setLoading(false);
  }, [username, api, navigate]);

  const fetchPosts = useCallback(async (c = null) => {
    try {
      const endpoint = activeTab === 'likes' ? 'likes' : activeTab === 'replies' ? 'replies' : 'posts';
      const url = `/api/users/${username}/${endpoint}?${c ? `cursor=${encodeURIComponent(c)}` : ''}`;
      const data = await api(url);
      if (c) setPosts(prev => [...prev, ...data.posts]);
      else setPosts(data.posts);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {}
  }, [username, activeTab, api]);

  useEffect(() => { fetchProfile(); }, [username]);
  useEffect(() => { setPosts([]); setCursor(null); fetchPosts(); }, [activeTab, username]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && cursor) fetchPosts(cursor);
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore]);

  const handleFollow = async () => {
    try {
      const data = await api(`/api/users/${username}/follow`, { method: 'POST' });
      setFollowing(data.following);
      setProfile(prev => ({
        ...prev,
        followers: prev.followers + (data.following ? 1 : -1)
      }));
    } catch {}
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  };

  const handleDM = () => {
    navigate(`/messages/${profile.id}`);
  };

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="loading-spinner"><div className="spinner" /></div>
      </main>
    </div>
  );

  if (!profile) return null;

  const isOwnProfile = currentUser?.username === username;
  const joinDate = profile.join_date ? formatDistanceToNow(new Date(profile.join_date), { addSuffix: true }) : '';

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>{Icons.back}</button>
          <div>
            <h2>{profile.display_name}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{profile.posts} whispers</span>
          </div>
        </div>

        <div className="profile-header">
          <div className="profile-banner">
            {profile.banner && <img src={profile.banner} alt="Banner" />}
          </div>
          <div className="profile-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="profile-avatar">
                {profile.profile_pic ? <img src={profile.profile_pic} alt={profile.display_name} /> : profile.display_name[0]}
              </div>
              <div className="profile-actions">
                {isOwnProfile ? (
                  <button className="btn btn-secondary" onClick={() => navigate('/settings')}>Edit profile</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={handleDM}>{Icons.mail}</button>
                    <button className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow}>
                      {following ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="profile-name">{profile.display_name}</div>
            <div className="profile-handle">@{profile.username}</div>
            {profile.bio && <div className="profile-bio">{profile.bio}</div>}
            <div className="profile-meta">
              <span>Joined {joinDate}</span>
            </div>
            <div className="profile-stats">
              <span className="profile-stat"><strong>{profile.following}</strong> Following</span>
              <span className="profile-stat"><strong>{profile.followers}</strong> Followers</span>
            </div>
          </div>
        </div>

        <div className="tab-bar">
          {['posts', 'replies', 'likes'].map(tab => (
            <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here... yet.</h3>
            <p>The void is patient.</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </>
        )}
      </main>
      <aside className="sidebar-right">
        <TrendingSection />
      </aside>
    </div>
  );
}

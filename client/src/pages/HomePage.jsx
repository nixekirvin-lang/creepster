import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import TrendingSection from '../components/TrendingSection';
import FollowSuggestions from '../components/FollowSuggestions';

export default function HomePage() {
  const { api } = useAuth();
  const { effects, layout } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [feedType, setFeedType] = useState('chronological');
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(async (c = null) => {
    if (c) setLoadingMore(true);
    else setLoading(true);
    try {
      const url = `/api/posts/feed?${c ? `cursor=${encodeURIComponent(c)}&` : ''}algorithmic=${feedType === 'algorithmic'}`;
      const data = await api(url);
      if (c) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [feedType, api]);

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPosts(cursor);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore]);

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  };

  const systemMessages = [
    "The signal is strong tonight.",
    "Something watches from the static.",
    "Frequency locked. Broadcasting...",
    "The void whispers back.",
    "Welcome to the frequency.",
  ];

  const [sysMsg] = useState(() => systemMessages[Math.floor(Math.random() * systemMessages.length)]);

  return (
    <div className="app-container">
      {layout.showLeftSidebar && <Sidebar />}
      <main className="main-content">
        <div className="feed-header">
          <h2>Home</h2>
          {effects.flickerEnabled && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{sysMsg}</p>}
        </div>
        <div className="feed-tabs">
          <div className={`feed-tab ${feedType === 'chronological' ? 'active' : ''}`} onClick={() => setFeedType('chronological')}>
            Chronological
          </div>
          <div className={`feed-tab ${feedType === 'algorithmic' ? 'active' : ''}`} onClick={() => setFeedType('algorithmic')}>
            Algorithmic
          </div>
        </div>
        <PostComposer onPost={handleNewPost} />
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>The static is quiet... for now.</h3>
            <p>Follow some users or post your first whisper.</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <div className="loading-spinner"><div className="spinner" /></div>}
          </>
        )}
      </main>
      {layout.showRightSidebar && (
        <aside className="sidebar-right">
          <TrendingSection />
          <FollowSuggestions />
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <div className="secret-element" title="The eyes see what they choose to see">Creepster v1.0 // The static watches</div>
          </div>
        </aside>
      )}
    </div>
  );
}
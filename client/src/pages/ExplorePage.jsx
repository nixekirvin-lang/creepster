import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import TrendingSection from '../components/TrendingSection';
import FollowSuggestions from '../components/FollowSuggestions';

export default function ExplorePage() {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async (c = null) => {
    if (c) setLoading(true);
    try {
      const url = `/api/posts/explore?${c ? `cursor=${encodeURIComponent(c)}` : ''}`;
      const data = await api(url);
      if (c) setPosts(prev => [...prev, ...data.posts]);
      else setPosts(data.posts);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && cursor) fetchPosts(cursor);
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore]);

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header">
          <h2>Explore</h2>
        </div>
        {loading && posts.length === 0 ? (
          <div className="loading-spinner"><div className="spinner" /></div>
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
        <FollowSuggestions />
      </aside>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';

export default function HashtagPage() {
  const { tag } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    api(`/api/search/hashtag/${tag}`).then(data => {
      setPosts(data.posts);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tag]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && cursor) {
        api(`/api/search/hashtag/${tag}?cursor=${encodeURIComponent(cursor)}`).then(data => {
          setPosts(prev => [...prev, ...data.posts]);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        }).catch(() => {});
      }
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, tag]);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h2>#{tag}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{posts.length} whispers</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>No whispers with #{tag} yet.</h3>
            <p>Be the first to whisper about this.</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </>
        )}
      </main>
    </div>
  );
}

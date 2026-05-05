import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import Sidebar from '../components/Sidebar';

export default function PostDetailPage() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/api/posts/${id}`);
      setPost(data.post);
      setReplies(data.replies);
    } catch { navigate('/'); }
    setLoading(false);
  }, [id, api, navigate]);

  useEffect(() => { fetchPost(); }, [id]);

  const handleReply = (newReply) => {
    setReplies(prev => [...prev, newReply]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPost(prev => ({ ...prev, ...updatedPost }));
  };

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="loading-spinner"><div className="spinner" /></div>
      </main>
    </div>
  );

  if (!post) return null;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>Whisper</h2>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <Avatar user={post.user} size={48} />
            <div>
              <div style={{ fontWeight: 700 }}>{post.user?.display_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{post.user?.username}</div>
            </div>
          </div>
          <div style={{ fontSize: '1.3rem', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.content}</div>
          {post.image_url && (
            <div className="post-image" style={{ marginBottom: 12 }}>
              <img src={post.image_url} alt="Post" />
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            {new Date(post.created_at + 'Z').toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 20, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span><strong>{post.reposts}</strong> <span style={{ color: 'var(--text-secondary)' }}>Resurfaces</span></span>
            <span><strong>{post.likes}</strong> <span style={{ color: 'var(--text-secondary)' }}>Echoes</span></span>
          </div>
          <div className="post-actions" style={{ maxWidth: '100%', justifyContent: 'space-around', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <button className="post-action">{Icons.reply}</button>
            <button className={`post-action ${post.reposted ? 'reposted' : ''}`}>{Icons.repost}</button>
            <button className={`post-action ${post.liked ? 'liked' : ''}`}>{post.liked ? Icons.heartFilled : Icons.heart}</button>
            <button className="post-action">{Icons.share}</button>
          </div>
        </div>

        <PostComposer replyTo={post.id} onPost={handleReply} placeholder="Whisper your reply..." />

        {replies.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div className="thread-line" style={{ height: 0 }} />
            {replies.map(reply => (
              <PostCard key={reply.id} post={reply} showReplyLine />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const Icons = {
  reply: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  repost: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
};

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';
import Icons from './Icons';
import { formatDistanceToNow } from 'date-fns';

export default function PostCard({ post, onUpdate, showReplyLine = false }) {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { effects } = useTheme();
  const [liked, setLiked] = useState(post.liked);
  const [reposted, setReposted] = useState(post.reposted);
  const [likes, setLikes] = useState(post.likes);
  const [reposts, setReposts] = useState(post.reposts);
  const [busy, setBusy] = useState(false);

  const isCursed = effects.cursedPosts && post.is_cursed;

  const handleLike = useCallback(async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const data = await api(`/api/posts/${post.id}/like`, { method: 'POST' });
      setLiked(data.liked);
      setLikes(data.likes);
      if (onUpdate) onUpdate(data);
    } catch {}
    setBusy(false);
  }, [post.id, busy, api, onUpdate]);

  const handleRepost = useCallback(async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const data = await api(`/api/posts/${post.id}/repost`, { method: 'POST' });
      setReposted(data.reposted);
      setReposts(data.reposts);
      if (onUpdate) onUpdate(data);
    } catch {}
    setBusy(false);
  }, [post.id, busy, api, onUpdate]);

  const handleReply = (e) => {
    e.stopPropagation();
    navigate(`/post/${post.id}`);
  };

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post.user.username}`);
  };

  const handleHashtagClick = (e, tag) => {
    e.stopPropagation();
    navigate(`/hashtag/${tag}`);
  };

  const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at + 'Z'), { addSuffix: true }) : '';

  const renderContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.match(/^#\w+$/)) {
        return (
          <span key={i} className="hashtag" onClick={(e) => handleHashtagClick(e, part.slice(1))}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const cursedClass = isCursed ? (effects.glitchEnabled ? 'cursed-text' : '') : '';
  const glitchClass = effects.glitchEnabled && Math.random() < 0.02 ? 'glitch-text' : '';

  return (
    <div
      className={`post ${isCursed ? 'cursed-post' : ''} ${glitchClass}`}
      onClick={handleClick}
      style={isCursed ? { borderColor: 'rgba(139, 0, 0, 0.3)' } : {}}
    >
      <Avatar user={post.user} size={40} />
      <div className="post-body">
        <div className="post-header">
          <span className={`post-display-name ${cursedClass}`} onClick={handleProfileClick}>
            {post.user?.display_name || 'Unknown'}
          </span>
          <span className="post-username" onClick={handleProfileClick}>@{post.user?.username || 'unknown'}</span>
          <span className="post-time">· {timeAgo}</span>
          {isCursed && <span style={{ color: 'var(--accent)', fontSize: '0.75rem', marginLeft: 4 }} title="Cursed post">👁</span>}
        </div>
        {post.reply_to && (
          <div className="reply-indicator">
            Replying to <a onClick={(e) => { e.stopPropagation(); }}>a whisper</a>
          </div>
        )}
        <div className={`post-content ${cursedClass}`}>
          {renderContent(post.content)}
        </div>
        {post.image_url && (
          <div className="post-image">
            <img src={post.image_url} alt="Post attachment" loading="lazy" />
          </div>
        )}
        <div className="post-actions">
          <button className="post-action" onClick={handleReply} title="Reply">
            {Icons.reply}
            {post.replies > 0 && <span>{post.replies}</span>}
          </button>
          <button className={`post-action ${reposted ? 'reposted' : ''}`} onClick={handleRepost} title="Resurface">
            {Icons.repost}
            {reposts > 0 && <span>{reposts}</span>}
          </button>
          <button className={`post-action ${liked ? 'liked' : ''}`} onClick={handleLike} title="Echo">
            {liked ? Icons.heartFilled : Icons.heart}
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button className="post-action" onClick={(e) => e.stopPropagation()} title="Share">
            {Icons.share}
          </button>
        </div>
      </div>
    </div>
  );
}

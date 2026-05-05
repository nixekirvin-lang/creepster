import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import Icons from './Icons';

export default function PostComposer({ replyTo = null, onPost, placeholder = "What haunts you?" }) {
  const { user, api } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const charLimit = user?.char_limit || 300;
  const remaining = charLimit - content.length;
  const charClass = remaining < 0 ? 'danger' : remaining < 30 ? 'warning' : '';

  const handleSubmit = async () => {
    if (content.trim().length === 0 || content.length > charLimit || posting) return;
    setPosting(true);
    try {
      const data = await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim(), image_url: imageUrl, reply_to: replyTo })
      });
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      if (onPost) onPost(data);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Failed to post:', err);
    }
    setPosting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('creepster_token')}` }
      });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch {}
  };

  return (
    <div className="post-composer">
      <Avatar user={user} size={40} />
      <div className="post-composer-body">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{ overflow: 'hidden' }}
        />
        {imageUrl && (
          <div className="image-preview">
            <img src={imageUrl} alt="Preview" />
            <button className="remove-btn" onClick={() => setImageUrl('')}>×</button>
          </div>
        )}
        <div className="post-composer-footer">
          <div className="post-composer-actions">
            <button onClick={() => fileRef.current?.click()} title="Attach image">
              {Icons.image}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`char-count ${charClass}`}>{remaining}</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={content.trim().length === 0 || content.length > charLimit || posting}
              style={{ opacity: content.trim().length === 0 || content.length > charLimit ? 0.5 : 1 }}
            >
              {posting ? '...' : 'Whisper'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

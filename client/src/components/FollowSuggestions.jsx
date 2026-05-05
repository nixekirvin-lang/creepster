import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

export default function FollowSuggestions() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api('/api/search?q=&type=users').then(data => {
      if (data.users) setUsers(data.users.slice(0, 3));
    }).catch(() => {});
  }, []);

  const handleFollow = async (e, username) => {
    e.stopPropagation();
    try {
      await api(`/api/users/${username}/follow`, { method: 'POST' });
      setUsers(prev => prev.map(u => u.username === username ? { ...u, isFollowing: !u.isFollowing } : u));
    } catch {}
  };

  if (users.length === 0) return null;

  return (
    <div className="who-to-follow">
      <h3>Who to Haunt</h3>
      {users.map(u => (
        <div key={u.id} className="follow-suggestion" onClick={() => navigate(`/profile/${u.username}`)}>
          <Avatar user={u} size={40} />
          <div className="follow-suggestion-info">
            <div className="follow-suggestion-name">{u.display_name}</div>
            <div className="follow-suggestion-handle">@{u.username}</div>
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
  );
}

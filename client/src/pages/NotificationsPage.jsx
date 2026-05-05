import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import Sidebar from '../components/Sidebar';
import Icons from '../components/Icons';

export default function NotificationsPage() {
  const { api } = useAuth();
  const { refreshUnread } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    api('/api/notifications/read', { method: 'POST' }).then(() => refreshUnread());
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api('/api/notifications');
      setNotifications(data.notifications);
    } catch {}
    setLoading(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <div className="notification-icon like">{Icons.heartFilled}</div>;
      case 'reply': return <div className="notification-icon reply">{Icons.reply}</div>;
      case 'follow': return <div className="notification-icon follow">{Icons.user}</div>;
      case 'repost': return <div className="notification-icon repost">{Icons.repost}</div>;
      default: return null;
    }
  };

  const getMessage = (n) => {
    switch (n.type) {
      case 'like': return 'echoed your whisper';
      case 'reply': return 'replied to your whisper';
      case 'follow': return 'started haunting you';
      case 'repost': return 'resurfaced your whisper';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header">
          <h2>Notifications</h2>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <h3>The void is silent.</h3>
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => navigate(`/profile/${n.username}`)}>
              {getIcon(n.type)}
              <div style={{ flex: 1 }}>
                <Avatar user={{ display_name: n.display_name, username: n.username, profile_pic: n.profile_pic }} size={32} />
                <div style={{ marginTop: 4 }}>
                  <strong>{n.display_name}</strong> {getMessage(n)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                  {n.created_at ? formatDistanceToNow(new Date(n.created_at + 'Z'), { addSuffix: true }) : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

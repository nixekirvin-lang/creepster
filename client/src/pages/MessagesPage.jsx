import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import Sidebar from '../components/Sidebar';

export default function MessagesPage() {
  const { userId } = useParams();
  const { user: currentUser, api } = useAuth();
  const { sendMessage, sendTyping, newMessage, onlineUsers, refreshUnread } = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api('/api/messages/conversations').then(data => {
      setConversations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    api(`/api/messages/${userId}`).then(data => {
      setMessages(data.messages);
      setOtherUser(data.otherUser);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => {});
    refreshUnread();
  }, [userId]);

  useEffect(() => {
    if (newMessage && userId) {
      if (newMessage.sender_id === userId || newMessage.receiver_id === userId) {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      api('/api/messages/conversations').then(setConversations).catch(() => {});
      refreshUnread();
    }
  }, [newMessage]);

  const handleSend = async () => {
    if (!messageInput.trim() || !userId) return;
    try {
      const msg = await api(`/api/messages/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ content: messageInput.trim() })
      });
      setMessages(prev => [...prev, msg]);
      sendMessage({ ...msg, receiver_id: userId });
      setMessageInput('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (userId) sendTyping(userId);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content" style={{ maxWidth: userId ? 900 : 600 }}>
        <div className="feed-header">
          <h2>Messages</h2>
        </div>
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
          <div style={{ width: userId ? 300 : '100%', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <h3>No conversations yet.</h3>
                <p>Visit a profile to start a message.</p>
              </div>
            ) : (
              conversations.map(c => (
                <div
                  key={c.other_user_id}
                  className={`conversation-item ${userId === c.other_user_id ? 'active' : ''}`}
                  onClick={() => navigate(`/messages/${c.other_user_id}`)}
                >
                  <Avatar user={{ display_name: c.display_name, username: c.username, profile_pic: c.profile_pic }} size={48} />
                  <div className="conversation-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="conversation-name">{c.display_name}</span>
                      <span className="conversation-time">
                        {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at + 'Z'), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <div className="conversation-last-msg">{c.last_message}</div>
                  </div>
                  {c.unread_count > 0 && <span className="unread-badge">{c.unread_count}</span>}
                </div>
              ))
            )}
          </div>

          {userId && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {otherUser ? (
                <>
                  <div className="chat-header">
                    <Avatar user={otherUser} size={36} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{otherUser.display_name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{otherUser.username}</div>
                    </div>
                    {onlineUsers.includes(userId) && <span className="online-dot" style={{ marginLeft: 'auto' }} />}
                  </div>
                  <div className="chat-messages">
                    {messages.map(msg => (
                      <div key={msg.id} className={`message ${msg.sender_id === currentUser?.id ? 'sent' : 'received'}`}>
                        {msg.content}
                        <div className="message-time">
                          {msg.created_at ? new Date(msg.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="chat-input">
                    <input
                      value={messageInput}
                      onChange={(e) => { setMessageInput(e.target.value); handleTyping(); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!messageInput.trim()}>
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h3>Select a conversation</h3>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

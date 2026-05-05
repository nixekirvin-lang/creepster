import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Avatar from './Avatar';
import Icons from './Icons';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCounts } = useSocket();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: Icons.home, label: 'Home' },
    { to: '/explore', icon: Icons.search, label: 'Explore' },
    { to: '/notifications', icon: Icons.bell, label: 'Notifications', badge: unreadCounts.notifications },
    { to: '/messages', icon: Icons.mail, label: 'Messages', badge: unreadCounts.messages },
    { to: `/profile/${user?.username}`, icon: Icons.user, label: 'Profile' },
    { to: '/settings', icon: Icons.settings, label: 'Settings' },
  ];

  return (
    <nav className="sidebar-left">
      <div className="nav-logo">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Creepster</h1>
      </div>
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span className="nav-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.label}
            {item.badge > 0 && <span className="unread-badge">{item.badge}</span>}
          </span>
        </NavLink>
      ))}
      <div style={{ marginTop: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate(`/profile/${user?.username}`)}>
          <Avatar user={user} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.display_name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{user?.username}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); logout(); }} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {Icons.more}
          </button>
        </div>
      </div>
    </nav>
  );
}

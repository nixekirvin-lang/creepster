import React from 'react';

export default function Avatar({ user, size = 40, className = '' }) {
  const initial = user?.display_name?.[0] || user?.username?.[0] || '?';
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.profile_pic) {
    return (
      <div className={`avatar ${className}`} style={{ ...style, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
        <img src={user.profile_pic} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
    );
  }

  return (
    <div className={`avatar ${className}`} style={{ ...style, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, border: '1px solid var(--border)' }}>
      {initial.toUpperCase()}
    </div>
  );
}

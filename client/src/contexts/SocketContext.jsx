import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, api } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({ notifications: 0, messages: 0 });
  const [newMessage, setNewMessage] = useState(null);
  const pollRef = useRef(null);

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api('/api/notifications/unread');
      setUnreadCounts(data);
    } catch {}
  }, [token, api]);

  useEffect(() => {
    if (token) {
      refreshUnread();
      pollRef.current = setInterval(refreshUnread, 15000);
      return () => clearInterval(pollRef.current);
    }
  }, [token, refreshUnread]);

  const sendMessage = useCallback((data) => {
    setNewMessage(data);
  }, []);

  const sendTyping = useCallback(() => {}, []);

  return (
    <SocketContext.Provider value={{
      onlineUsers: [],
      newMessage,
      typingUsers: {},
      unreadCounts,
      sendMessage,
      sendTyping,
      refreshUnread,
      setUnreadCounts
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

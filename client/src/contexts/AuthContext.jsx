import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://creepster.vercel.app';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('creepster_token'));
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/auth/me`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.id) setUser(data);
        else { setToken(null); localStorage.removeItem('creepster_token'); }
      })
      .catch(() => { setToken(null); localStorage.removeItem('creepster_token'); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('creepster_token', data.token);
    return data;
  };

  const signup = async (username, display_name, email, password) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, display_name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('creepster_token', data.token);
    return data;
  };

  const loginWithGoogle = async () => {
    const { signInWithPopup } = await import('firebase/auth');
    const { auth, googleProvider } = await import('../firebase');
    if (!auth || !googleProvider) throw new Error('Google sign-in is not available');
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const res = await fetch(`${API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('creepster_token', data.token);
    return data;
  };

  const logout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      if (auth) await signOut(auth);
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('creepster_token');
  };

  const updateProfile = async (updates) => {
    const res = await fetch(`${API}/api/auth/me`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(prev => ({ ...prev, ...data }));
    return data;
  };

  const api = useCallback((url, options = {}) => {
    return fetch(`${API}${url}`, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) }
    }).then(r => r.json());
  }, [headers]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginWithGoogle, logout, updateProfile, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

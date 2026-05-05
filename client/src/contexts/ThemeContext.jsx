import React, { createContext, useContext, useState, useCallback } from 'react';

const defaultTheme = {
  bgPrimary: '#0a0a0c',
  bgSecondary: '#111114',
  bgTertiary: '#18181c',
  textPrimary: '#e8e6e3',
  textSecondary: '#8b8b8e',
  accent: '#8b0000',
  border: '#222228',
  fontFamily: "'Inter', sans-serif",
  fontSize: '15px',
  density: 'normal',
};

const defaultEffects = {
  glitchEnabled: false,
  vhsOverlay: false,
  flickerEnabled: false,
  hauntMode: false,
  cursedPosts: false,
  ghostTrails: false,
  screenArtifacts: false,
  reduceMotion: false,
  eerieAudio: false,
};

const defaultLayout = {
  showLeftSidebar: true,
  showRightSidebar: true,
  feedWidth: 'normal',
  compactMode: false,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme);
  const [effects, setEffects] = useState(defaultEffects);
  const [layout, setLayout] = useState(defaultLayout);
  const [activePreset, setActivePreset] = useState('default');

  const updateTheme = useCallback((updates) => {
    setTheme(prev => {
      const next = { ...prev, ...updates };
      requestAnimationFrame(() => {
        const root = document.documentElement;
        if (next.bgPrimary) root.style.setProperty('--bg-primary', next.bgPrimary);
        if (next.bgSecondary) root.style.setProperty('--bg-secondary', next.bgSecondary);
        if (next.bgTertiary) root.style.setProperty('--bg-tertiary', next.bgTertiary);
        if (next.textPrimary) root.style.setProperty('--text-primary', next.textPrimary);
        if (next.textSecondary) root.style.setProperty('--text-secondary', next.textSecondary);
        if (next.accent) root.style.setProperty('--accent', next.accent);
        if (next.border) root.style.setProperty('--border', next.border);
        if (next.fontFamily) root.style.setProperty('--font-main', next.fontFamily);
        if (next.fontSize) root.style.fontSize = next.fontSize;
      });
      return next;
    });
  }, []);

  const updateEffects = useCallback((updates) => {
    setEffects(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLayout = useCallback((updates) => {
    setLayout(prev => ({ ...prev, ...updates }));
  }, []);

  const applyPreset = useCallback((presetName) => {
    const presets = {
      default: { ...defaultTheme },
      staticVoid: {
        bgPrimary: '#050508', bgSecondary: '#0c0c10', bgTertiary: '#121218',
        textPrimary: '#c8c8d0', textSecondary: '#6868a0', accent: '#6600cc',
        border: '#1a1a28', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', density: 'compact',
      },
      analogHorror: {
        bgPrimary: '#0a0800', bgSecondary: '#141000', bgTertiary: '#1e1a08',
        textPrimary: '#e8d8a0', textSecondary: '#a08850', accent: '#cc6600',
        border: '#2a2010', fontFamily: "'IBM Plex Mono', monospace", fontSize: '15px', density: 'normal',
      },
      bloodMoon: {
        bgPrimary: '#0a0000', bgSecondary: '#120505', bgTertiary: '#1a0808',
        textPrimary: '#f0d0d0', textSecondary: '#a06060', accent: '#ff0000',
        border: '#281010', fontFamily: "'Inter', sans-serif", fontSize: '15px', density: 'normal',
      },
      void: {
        bgPrimary: '#000000', bgSecondary: '#080808', bgTertiary: '#101010',
        textPrimary: '#888888', textSecondary: '#444444', accent: '#333333',
        border: '#181818', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', density: 'compact',
      },
      glitch: {
        bgPrimary: '#0a0a0c', bgSecondary: '#111114', bgTertiary: '#18181c',
        textPrimary: '#00ff41', textSecondary: '#00cc33', accent: '#ff0080',
        border: '#222228', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', density: 'normal',
      },
    };
    const preset = presets[presetName];
    if (preset) {
      setTheme(preset);
      setActivePreset(presetName);
    }
  }, []);

  const saveTheme = useCallback(async () => {
    // No-op for now
  }, []);

  const exportTheme = useCallback(() => {
    return JSON.stringify({ theme, effects, layout }, null, 2);
  }, [theme, effects, layout]);

  const importTheme = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.theme) setTheme(prev => ({ ...prev, ...data.theme }));
      if (data.effects) setEffects(prev => ({ ...prev, ...data.effects }));
      if (data.layout) setLayout(prev => ({ ...prev, ...data.layout }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme, effects, layout, activePreset,
      updateTheme, updateEffects, updateLayout,
      applyPreset, saveTheme, exportTheme, importTheme,
      createScreenArtifact: () => {}
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

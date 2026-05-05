import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, effects, layout, activePreset, updateTheme, updateEffects, updateLayout, applyPreset, saveTheme, exportTheme, importTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [charLimit, setCharLimit] = useState(user?.char_limit || 300);
  const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
  const [banner, setBanner] = useState(user?.banner || '');
  const [saved, setSaved] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [activeSection, setActiveSection] = useState('profile');

  const handleSave = async () => {
    await updateProfile({
      display_name: displayName,
      bio,
      char_limit: charLimit,
      profile_pic: profilePic,
      banner,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveTheme = async () => {
    await saveTheme();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = () => {
    if (importTheme(importText)) {
      setImportError('');
      setImportText('');
    } else {
      setImportError('Invalid JSON format');
    }
  };

  const presets = [
    { id: 'default', name: 'Default', color: '#8b0000' },
    { id: 'staticVoid', name: 'Static Void', color: '#6600cc' },
    { id: 'analogHorror', name: 'Analog Horror', color: '#cc6600' },
    { id: 'bloodMoon', name: 'Blood Moon', color: '#ff0000' },
    { id: 'void', name: 'The Void', color: '#333333' },
    { id: 'glitch', name: 'Glitch', color: '#ff0080' },
  ];

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'theme', label: 'Theme' },
    { id: 'effects', label: 'Effects' },
    { id: 'layout', label: 'Layout' },
    { id: 'export', label: 'Import/Export' },
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="feed-header">
          <h2>Settings</h2>
        </div>

        <div className="tab-bar">
          {sections.map(s => (
            <div key={s.id} className={`tab ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
              {s.label}
            </div>
          ))}
        </div>

        {activeSection === 'profile' && (
          <div className="settings-page">
            <div className="settings-section">
              <h3>Profile Settings</h3>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Display Name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Profile Picture URL</label>
                <input value={profilePic} onChange={(e) => setProfilePic(e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Banner URL</label>
                <input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Character Limit (50-2000)</label>
                <input type="number" value={charLimit} onChange={(e) => setCharLimit(parseInt(e.target.value) || 300)} min={50} max={2000} />
              </div>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'theme' && (
          <div className="settings-page">
            <div className="settings-section">
              <h3>Theme Presets</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {presets.map(p => (
                  <button
                    key={p.id}
                    className={`btn btn-sm ${activePreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => applyPreset(p.id)}
                    style={{ borderColor: p.color, fontSize: '0.8rem' }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>Colors</h3>
              <div className="color-picker-row">
                <label>Background</label>
                <div className="color-swatch">
                  <input type="color" value={theme.bgPrimary} onChange={(e) => updateTheme({ bgPrimary: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Secondary Background</label>
                <div className="color-swatch">
                  <input type="color" value={theme.bgSecondary} onChange={(e) => updateTheme({ bgSecondary: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Tertiary Background</label>
                <div className="color-swatch">
                  <input type="color" value={theme.bgTertiary} onChange={(e) => updateTheme({ bgTertiary: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Text Primary</label>
                <div className="color-swatch">
                  <input type="color" value={theme.textPrimary} onChange={(e) => updateTheme({ textPrimary: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Text Secondary</label>
                <div className="color-swatch">
                  <input type="color" value={theme.textSecondary} onChange={(e) => updateTheme({ textSecondary: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Accent</label>
                <div className="color-swatch">
                  <input type="color" value={theme.accent} onChange={(e) => updateTheme({ accent: e.target.value })} />
                </div>
              </div>
              <div className="color-picker-row">
                <label>Border</label>
                <div className="color-swatch">
                  <input type="color" value={theme.border} onChange={(e) => updateTheme({ border: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Typography</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Font Family</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', width: '100%' }}
                >
                  <option value="'Inter', sans-serif">Inter (Default)</option>
                  <option value="'IBM Plex Mono', monospace">IBM Plex Mono</option>
                  <option value="'Creepster', cursive">Creepster</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="Georgia, serif">Georgia</option>
                </select>
              </div>
              <div className="form-group">
                <label>Font Size</label>
                <select
                  value={theme.fontSize}
                  onChange={(e) => updateTheme({ fontSize: e.target.value })}
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', width: '100%' }}
                >
                  <option value="13px">Small (13px)</option>
                  <option value="14px">Medium (14px)</option>
                  <option value="15px">Default (15px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="18px">Extra Large (18px)</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              <button className="btn btn-primary" onClick={handleSaveTheme}>
                {saved ? 'Saved!' : 'Save Theme'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'effects' && (
          <div className="settings-page">
            <div className="settings-section">
              <h3>Horror Effects</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                Control the unsettling elements of Creepster. All effects are purely cosmetic.
              </p>
              {[
                { key: 'glitchEnabled', label: 'Glitch Effects', desc: 'Occasional text distortion' },
                { key: 'vhsOverlay', label: 'VHS Scan Lines', desc: 'CRT-style overlay effect' },
                { key: 'flickerEnabled', label: 'Flickering', desc: 'Subtle screen flicker' },
                { key: 'hauntMode', label: 'Haunt Mode', desc: 'Random screen artifacts and eerie effects' },
                { key: 'cursedPosts', label: 'Cursed Posts', desc: 'Visual anomalies on rare posts' },
                { key: 'ghostTrails', label: 'Ghost Trails', desc: 'Afterimage effect on hover' },
                { key: 'screenArtifacts', label: 'Screen Artifacts', desc: 'Random visual glitches' },
                { key: 'reduceMotion', label: 'Reduce Motion', desc: 'Disable all animations (accessibility)' },
              ].map(({ key, label, desc }) => (
                <div className="settings-row" key={key}>
                  <div>
                    <label>{label}</label>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <div
                    className={`toggle-switch ${effects[key] ? 'active' : ''}`}
                    onClick={() => updateEffects({ [key]: !effects[key] })}
                  />
                </div>
              ))}
            </div>

            <div style={{ padding: '16px' }}>
              <button className="btn btn-primary" onClick={handleSaveTheme}>
                {saved ? 'Saved!' : 'Save Effects'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'layout' && (
          <div className="settings-page">
            <div className="settings-section">
              <h3>Layout Options</h3>
              <div className="settings-row">
                <div>
                  <label>Left Sidebar</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Navigation sidebar</div>
                </div>
                <div
                  className={`toggle-switch ${layout.showLeftSidebar ? 'active' : ''}`}
                  onClick={() => updateLayout({ showLeftSidebar: !layout.showLeftSidebar })}
                />
              </div>
              <div className="settings-row">
                <div>
                  <label>Right Sidebar</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trending and suggestions</div>
                </div>
                <div
                  className={`toggle-switch ${layout.showRightSidebar ? 'active' : ''}`}
                  onClick={() => updateLayout({ showRightSidebar: !layout.showRightSidebar })}
                />
              </div>
              <div className="settings-row">
                <div>
                  <label>Compact Mode</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Denser post layout</div>
                </div>
                <div
                  className={`toggle-switch ${layout.compactMode ? 'active' : ''}`}
                  onClick={() => updateLayout({ compactMode: !layout.compactMode })}
                />
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              <button className="btn btn-primary" onClick={handleSaveTheme}>
                {saved ? 'Saved!' : 'Save Layout'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'export' && (
          <div className="settings-page">
            <div className="settings-section">
              <h3>Export Theme</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                Copy your current theme configuration as JSON.
              </p>
              <textarea
                readOnly
                value={exportTheme()}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minHeight: 150 }}
                onClick={(e) => e.target.select()}
              />
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(exportTheme()); }}>
                Copy to Clipboard
              </button>
            </div>

            <div className="settings-section">
              <h3>Import Theme</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                Paste a theme JSON configuration to apply it.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"theme": {...}, "effects": {...}, "layout": {...}}'
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minHeight: 150 }}
              />
              {importError && <div className="auth-error" style={{ marginTop: 8 }}>{importError}</div>}
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleImport}>
                Import Theme
              </button>
            </div>
          </div>
        )}

        {saved && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: 9999,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(139,0,0,0.4)'
          }}>
            Settings saved
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sun, Moon, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import './Header.css';

const Header = ({ mode, setMode, refreshInterval, setRefreshInterval, isOnline, warning }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <header className="header-wrapper">
      <div className="container header-container">
        {/* Left: Brand Logo & Title */}
        <div className="header-brand">
          <span>MarketPulse</span>
          <span className="brand-badge">PRO</span>
        </div>

        {/* Middle: Controls (Sandbox Toggler, Interval Selection) */}
        <div className="header-controls">
          {/* Mode Switcher */}
          <div className="mode-toggle-group">
            <button 
              className={`mode-btn ${mode === 'sandbox' ? 'active' : ''}`}
              onClick={() => setMode('sandbox')}
              title="Run simulation ticking"
            >
              Sandbox
            </button>
            <button 
              className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
              title="Connect to Dhan API"
            >
              Live Feed
            </button>
          </div>

          {/* Refresh interval select */}
          <div className="interval-selector">
            <RefreshCw size={14} className={refreshInterval > 0 ? 'spinning' : ''} />
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              title="Adjust live update frequency"
            >
              <option value={1000}>1s Ticks</option>
              <option value={2000}>2s Ticks</option>
              <option value={5000}>5s Ticks</option>
              <option value={0}>Manual Only</option>
            </select>
          </div>
        </div>

        {/* Right: Health badge & Theme toggle */}
        <div className="header-actions">
          {/* Warning Badge (Fallback details) */}
          {warning && (
            <div className="warning-badge" title={warning}>
              <AlertTriangle size={15} />
              <span>Sandbox Fallback</span>
            </div>
          )}

          {/* Connection status indicator */}
          <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            <span>{isOnline ? 'API Connected' : 'Offline'}</span>
          </div>

          {/* Dark Mode Switcher */}
          <button 
            className="theme-btn" 
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

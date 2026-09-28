import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ isCompact = false }) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (isCompact) {
    return (
      <button 
        className="theme-toggle-compact" 
        onClick={cycleTheme}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
      </button>
    );
  }

  return (
    <div className="theme-toggle-group" role="menu">
      <div className="theme-toggle-label">Theme</div>
      <div className="theme-options">
        <button 
          role="menuitemradio" 
          aria-checked={theme === 'light'}
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          <Sun size={16} /> Light
        </button>
        <button 
          role="menuitemradio" 
          aria-checked={theme === 'dark'}
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <Moon size={16} /> Dark
        </button>
        <button 
          role="menuitemradio" 
          aria-checked={theme === 'system'}
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => setTheme('system')}
        >
          <Monitor size={16} /> System
        </button>
      </div>
    </div>
  );
}

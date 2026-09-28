import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  const updateResolvedTheme = (selectedTheme) => {
    if (selectedTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(selectedTheme);
    }
  };

  useEffect(() => {
    updateResolvedTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      // We set the data-theme on html element so CSS takes over
      const updateHtml = () => {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      };
      
      updateHtml();
      mediaQuery.addEventListener('change', handleChange);
      mediaQuery.addEventListener('change', updateHtml);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        mediaQuery.removeEventListener('change', updateHtml);
      };
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

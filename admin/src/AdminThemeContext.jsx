import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminCssVars } from '../../shared/designSystem';

const MODE_KEY = 'mychurch_admin_theme_mode';
const AdminThemeContext = createContext(null);

function applyTheme(mode) {
  const vars = getAdminCssVars(mode);
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  document.documentElement.dataset.adminTheme = mode;
}

export function AdminThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    return stored === 'daylight' ? 'daylight' : 'midnight';
  });

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'midnight',
    toggleMode: () => setMode((current) => (current === 'midnight' ? 'daylight' : 'midnight')),
  }), [mode]);

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const value = useContext(AdminThemeContext);
  if (!value) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }
  return value;
}

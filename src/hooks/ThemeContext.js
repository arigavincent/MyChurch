import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { mobileThemes } from '../../shared/designSystem';

const MODE_KEY = '@mychurch_theme_mode';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const systemMode = systemScheme === 'light' ? 'daylight' : 'midnight';
  const [mode, setMode] = useState(systemMode);
  const [hasStoredPreference, setHasStoredPreference] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((stored) => {
      if (stored === 'midnight' || stored === 'daylight') {
        setMode(stored);
        setHasStoredPreference(true);
      } else {
        setMode(systemMode);
      }
    }).catch(() => {});
  }, [systemMode]);

  useEffect(() => {
    if (!hasStoredPreference) {
      setMode(systemMode);
    }
  }, [hasStoredPreference, systemMode]);

  const toggleMode = () => {
    const next = mode === 'midnight' ? 'daylight' : 'midnight';
    setMode(next);
    setHasStoredPreference(true);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
  };

  const theme = mobileThemes[mode] || mobileThemes.midnight;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        isDark: theme.isDark,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

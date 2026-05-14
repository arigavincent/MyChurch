import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/hooks/ThemeContext';
import { AuthProvider } from './src/hooks/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark, theme } = useTheme();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/ThemeContext';

export default function ScreenWrapper({ children, style }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents='none' style={styles.backdrop}>
        <View style={styles.primaryGlow} />
        <View style={styles.accentGlow} />
      </View>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    primaryGlow: {
      position: 'absolute',
      top: -90,
      right: -40,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.colors.primaryMuted,
      opacity: theme.isDark ? 0.24 : 0.18,
    },
    accentGlow: {
      position: 'absolute',
      bottom: -110,
      left: -70,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: theme.colors.accentSoft,
      opacity: theme.isDark ? 0.26 : 0.18,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      zIndex: 1,
    },
  });
}

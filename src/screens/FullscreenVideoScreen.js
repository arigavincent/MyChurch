import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MediaVideoPlayer from '../components/MediaVideoPlayer';
import { useTheme } from '../hooks/ThemeContext';

export default function FullscreenVideoScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme);
  const { videoUrl, title } = route.params || {};

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.container}>
        <MediaVideoPlayer
          videoUrl={videoUrl}
          style={[styles.player, { width, height }]}
          contentFit='contain'
          showFullscreenButton={false}
          fullscreenTitle={title}
        />

        <View style={styles.overlayTopRow}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Ionicons name='close' size={20} color='#FFFFFF' />
          </TouchableOpacity>
          {title ? (
            <View style={styles.titleChip}>
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#000000',
    },
    container: {
      flex: 1,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    player: {
      backgroundColor: '#000000',
    },
    overlayTopRow: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(5, 7, 13, 0.68)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleChip: {
      flex: 1,
      backgroundColor: 'rgba(5, 7, 13, 0.54)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
    },
    titleText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}

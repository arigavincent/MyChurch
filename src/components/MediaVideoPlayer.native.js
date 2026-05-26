import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import YouTubePlayer from 'react-native-youtube-iframe';
import {
  getVideoPlaybackKind,
  getYouTubeVideoId,
} from '../../shared/contentModel';
import { useTheme } from '../hooks/ThemeContext';

export default function MediaVideoPlayer({
  videoUrl,
  style,
  contentFit = 'contain',
  showFullscreenButton = true,
  fullscreenTitle = '',
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const kind = getVideoPlaybackKind(videoUrl);
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);
  const flatStyle = StyleSheet.flatten(style) || {};
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const playerHeight = Number(flatStyle.height) || layoutSize.height || 220;
  const playerWidth = Number(flatStyle.width) || layoutSize.width || undefined;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    setLayoutSize((current) => (
      current.width === width && current.height === height
        ? current
        : { width, height }
    ));
  }, []);

  const openFullscreen = useCallback(() => {
    if (!videoUrl) return;
    navigation.navigate('FullscreenVideo', {
      videoUrl,
      title: fullscreenTitle,
    });
  }, [fullscreenTitle, navigation, videoUrl]);

  const player = useVideoPlayer(
    kind === 'file' ? { uri: videoUrl } : null,
    (instance) => {
      instance.loop = false;
    }
  );

  if (kind === 'youtube' && videoId) {
    return (
      <View style={[styles.shell, style]} onLayout={handleLayout}>
        <YouTubePlayer
          height={playerHeight}
          width={playerWidth || '100%'}
          play={false}
          videoId={videoId}
          initialPlayerParams={{
            rel: false,
            modestbranding: true,
            preventFullScreen: true,
          }}
          onFullScreenChange={() => {}}
          webViewStyle={styles.nativeWebView}
        />
        {showFullscreenButton ? (
          <TouchableOpacity style={styles.fullscreenButton} onPress={openFullscreen} activeOpacity={0.9}>
            <Ionicons name='expand-outline' size={18} color='#FFFFFF' />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (kind === 'file') {
    return (
      <View style={[styles.shell, style]} onLayout={handleLayout}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls
          contentFit={contentFit}
          fullscreenOptions={{
            enable: false,
            orientation: 'landscape',
            autoExitOnRotate: true,
          }}
        />
        {showFullscreenButton ? (
          <TouchableOpacity style={styles.fullscreenButton} onPress={openFullscreen} activeOpacity={0.9}>
            <Ionicons name='expand-outline' size={18} color='#FFFFFF' />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return null;
}

function createStyles(theme) {
  return StyleSheet.create({
    shell: {
      overflow: 'hidden',
      backgroundColor: '#000000',
    },
    nativeWebView: {
      opacity: 0.99,
      backgroundColor: '#000000',
    },
    fullscreenButton: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(5, 7, 13, 0.62)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  getVideoPlaybackKind,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from '../../shared/contentModel';

let YouTubePlayer = null;
if (Platform.OS !== 'web') {
  YouTubePlayer = require('react-native-youtube-iframe').default;
}

export default function MediaVideoPlayer({ videoUrl, style, contentFit = 'contain' }) {
  const kind = getVideoPlaybackKind(videoUrl);
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);
  const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl), [videoUrl]);
  const flatStyle = StyleSheet.flatten(style) || {};
  const playerHeight = Number(flatStyle.height) || 220;

  const player = useVideoPlayer(
    kind === 'file' ? { uri: videoUrl } : null,
    (instance) => {
      instance.loop = false;
    }
  );

  if (kind === 'youtube' && videoId) {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.shell, style]}>
          <iframe
            src={embedUrl}
            title='Video player'
            style={webMediaStyle}
            allow='autoplay; fullscreen; picture-in-picture'
            allowFullScreen
          />
        </View>
      );
    }

    return (
      <View style={[styles.shell, style]}>
        <YouTubePlayer
          height={playerHeight}
          width='100%'
          play={false}
          videoId={videoId}
          initialPlayerParams={{
            rel: false,
            modestbranding: true,
            playsinline: true,
          }}
          webViewStyle={styles.nativeWebView}
        />
      </View>
    );
  }

  if (kind === 'file') {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.shell, style]}>
          <video
            src={videoUrl}
            controls
            playsInline
            style={webMediaStyle}
          />
        </View>
      );
    }

    return (
      <View style={[styles.shell, style]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls
          contentFit={contentFit}
          allowsFullscreen
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  nativeWebView: {
    opacity: 0.99,
    backgroundColor: '#000000',
  },
});

const webMediaStyle = {
  width: '100%',
  height: '100%',
  border: 0,
  backgroundColor: '#000000',
  display: 'block',
};

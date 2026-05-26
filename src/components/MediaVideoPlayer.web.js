import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  getVideoPlaybackKind,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from '../../shared/contentModel';

export default function MediaVideoPlayer({ videoUrl, style }) {
  const kind = getVideoPlaybackKind(videoUrl);
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);
  const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl), [videoUrl]);

  if (kind === 'youtube' && videoId) {
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

  if (kind === 'file') {
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

  return null;
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
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

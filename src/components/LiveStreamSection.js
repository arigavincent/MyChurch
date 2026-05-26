import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaVideoPlayer from './MediaVideoPlayer';
import { useTheme } from '../hooks/ThemeContext';
import { getYouTubeVideoId } from '../../shared/contentModel';
import { API_BASE, fetchAppConfig } from '../services/api';

export default function LiveStreamSection() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchAppConfig();
      setConfig(payload || null);
    } catch (loadError) {
      setError(loadError.message || 'Could not load the live stream settings right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const isLive = !!config?.liveStreamEnabled && !!config?.liveStreamId;
  const videoId = getYouTubeVideoId(config?.liveStreamId || '');
  const youtubeWatchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Live Worship</Text>
          <Text style={styles.title}>Watch live when the stream is active, then catch up on demand.</Text>
        </View>
        <View style={[styles.statusBadge, isLive ? styles.statusLive : styles.statusOffline]}>
          <Text style={styles.statusText}>{isLive ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size='small' color={theme.colors.accent} />
          <Text style={styles.loadingText}>Checking the stream status...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not load the live stream</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.debugHint}>Server: {API_BASE}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConfig} activeOpacity={0.9}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isLive && videoId ? (
        <MediaVideoPlayer videoUrl={videoId} style={styles.playerCard} fullscreenTitle='Live stream' />
      ) : (
        <View style={styles.offlineCard}>
          <Ionicons name="tv-outline" size={36} color={theme.colors.accent} />
          <Text style={styles.offlineTitle}>No live stream right now</Text>
          <Text style={styles.offlineBody}>
            The latest content is still available through sermons and short clips while the next live session is being prepared.
          </Text>
        </View>
      )}

      {youtubeWatchUrl ? (
        <TouchableOpacity style={styles.ctaButton} onPress={() => Linking.openURL(youtubeWatchUrl)} activeOpacity={0.9}>
          <Ionicons name="logo-youtube" size={18} color={theme.colors.textOnAccent} />
          <Text style={styles.ctaButtonText}>{isLive ? 'Open on YouTube' : 'Channel link'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
      maxWidth: 260,
    },
    statusBadge: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
    },
    statusLive: {
      backgroundColor: 'rgba(227, 93, 106, 0.18)',
      borderColor: 'rgba(227, 93, 106, 0.28)',
    },
    statusOffline: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
    },
    statusText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    playerCard: {
      height: 220,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    loadingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    errorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    errorTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    errorBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    debugHint: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    retryButton: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 12,
      fontWeight: '800',
    },
    offlineCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    offlineTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    offlineBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    ctaButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    ctaButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}

import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import MediaVideoPlayer from '../components/MediaVideoPlayer';
import { useTheme } from '../hooks/ThemeContext';
import { formatLongDateLabel, getVideoPlaybackKind } from '../../shared/contentModel';

export default function ClipDetailScreen({ route }) {
  const { clip } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const videoKind = getVideoPlaybackKind(clip.videoUrl);
  const canPlayInApp = videoKind === 'youtube' || videoKind === 'file';
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState(null);

  const handleShare = async () => {
    const shareMessage = `${clip.title}\n${clip.description}${clip.videoUrl ? `\n${clip.videoUrl}` : ''}`;
    try {
      setIsSharing(true);
      setStatus({ tone: 'info', message: 'Preparing clip share options...' });
      await Share.share({ message: shareMessage, title: clip.title });
      setStatus({ tone: 'success', message: 'Clip share is ready.' });
    } catch {
      setStatus({ tone: 'danger', message: 'Could not share this clip right now.' });
      Alert.alert('Share Failed', 'Could not share this clip right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const openLabel = videoKind === 'youtube'
    ? 'Open on YouTube'
    : videoKind === 'file'
      ? 'Open in browser'
      : 'Open link';
  const playbackLabel = useMemo(() => {
    if (videoKind === 'youtube') return 'YouTube video playing in app';
    if (videoKind === 'file') return 'Uploaded video playing in app';
    return 'External video source';
  }, [videoKind]);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {canPlayInApp ? (
          <MediaVideoPlayer videoUrl={clip.videoUrl} style={styles.videoCard} fullscreenTitle={clip.title} />
        ) : (
          <View style={styles.placeholderCard}>
            <Ionicons name='play-circle-outline' size={56} color={theme.colors.accent} />
            <Text style={styles.placeholderTitle}>External video source</Text>
            <Text style={styles.placeholderBody}>
              This clip points to an external page, so it opens outside the app.
            </Text>
          </View>
        )}

        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{clip.featured ? 'FEATURED CLIP' : 'CLIP'}</Text>
            </View>
            <Text style={styles.dateLabel}>{formatLongDateLabel(clip.publishedAt)}</Text>
          </View>
          <Text style={styles.title}>{clip.title}</Text>
          <Text style={styles.description}>{clip.description}</Text>
          <View style={styles.metaChip}>
            <Ionicons
              name={videoKind === 'youtube' ? 'logo-youtube' : canPlayInApp ? 'play-circle-outline' : 'open-outline'}
              size={15}
              color={theme.colors.accent}
            />
            <Text style={styles.metaChipText}>{playbackLabel}</Text>
          </View>
        </View>

        {status ? (
          <View style={[
            styles.statusBanner,
            status.tone === 'success' && styles.statusBannerSuccess,
            status.tone === 'danger' && styles.statusBannerDanger,
          ]}>
            <Ionicons
              name={status.tone === 'danger' ? 'alert-circle-outline' : status.tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'}
              size={18}
              color={status.tone === 'danger' ? '#FFFFFF' : theme.colors.text}
            />
            <Text style={[
              styles.statusText,
              status.tone === 'danger' && styles.statusTextDanger,
            ]}>
              {status.message}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {clip.videoUrl ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => Linking.openURL(clip.videoUrl)
                .then(() => setStatus({ tone: 'info', message: 'Opening this clip outside the app.' }))
                .catch(() => setStatus({ tone: 'danger', message: 'Could not open this clip right now.' }))}
              activeOpacity={0.9}
            >
              <Ionicons name='open-outline' size={18} color={theme.colors.textOnAccent} />
              <Text style={styles.primaryButtonText}>{openLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare} activeOpacity={0.9} disabled={isSharing}>
            <Ionicons name='share-social-outline' size={18} color={theme.colors.text} />
            <Text style={styles.secondaryButtonText}>{isSharing ? 'Preparing share...' : 'Share clip'}</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'android' && canPlayInApp ? (
          <Text style={styles.footnote}>
            Tip: tap the expand button on the video to open a proper landscape fullscreen player.
          </Text>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingBottom: theme.spacing.xxl,
    },
    videoCard: {
      height: 230,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.lg,
    },
    placeholderCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      padding: theme.spacing.xl,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    placeholderTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    placeholderBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    headerBlock: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accentSoft,
    },
    badgeText: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    dateLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 34,
      marginBottom: theme.spacing.sm,
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },
    metaChip: {
      marginTop: theme.spacing.md,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metaChipText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    statusBanner: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusBannerSuccess: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.surfaceRaised,
    },
    statusBannerDanger: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
    statusText: {
      color: theme.colors.text,
      fontSize: 13,
      flex: 1,
    },
    statusTextDanger: {
      color: '#FFFFFF',
    },
    actionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    footnote: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
}

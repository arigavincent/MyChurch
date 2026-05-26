import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ScreenWrapper from '../components/ScreenWrapper';
import MediaVideoPlayer from '../components/MediaVideoPlayer';
import SermonNotes from '../components/SermonNotes';
import { useAudio } from '../hooks/AudioContext';
import { useTheme } from '../hooks/ThemeContext';
import { formatLongDateLabel, getVideoPlaybackKind } from '../../shared/contentModel';

function formatTime(millis) {
  if (!millis || millis < 0) return '0:00';
  const totalSec = Math.floor(millis / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function SermonDetailScreen({ route }) {
  const { sermon } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const videoKind = getVideoPlaybackKind(sermon.videoUrl);

  const {
    currentSermonId,
    isLoaded,
    isLoading,
    isPlaying,
    positionMillis,
    durationMillis,
    error: audioError,
    loadAndPlay,
    togglePlayPause,
    seekTo,
  } = useAudio();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState(null);
  const isCurrent = currentSermonId === sermon.id;
  const hasAudio = !!sermon.audioUrl;
  const hasVideo = videoKind !== 'none';
  const canPlayVideoInApp = videoKind === 'youtube' || videoKind === 'file';

  const activePosition = isCurrent ? positionMillis : 0;
  const activeDuration = isCurrent ? durationMillis : 0;
  const primaryButtonLabel = isLoading
    ? 'Preparing...'
    : isCurrent && isPlaying
      ? 'Pause audio'
      : isCurrent && activePosition > 0
        ? 'Resume audio'
        : 'Play audio';
  const playbackStatusLabel = useMemo(() => {
    if (!hasAudio) return '';
    if (isLoading) return 'Preparing the audio stream...';
    if (!isCurrent) return 'Tap play to begin streaming this sermon.';
    if (isPlaying) return 'Audio is playing now.';
    if (activePosition > 0) return 'Audio is paused and ready to resume.';
    return 'Audio is loaded and ready.';
  }, [activePosition, hasAudio, isCurrent, isLoading, isPlaying]);

  const handlePrimaryMedia = async () => {
    if (!hasAudio) {
      if (sermon.videoUrl) {
        Linking.openURL(sermon.videoUrl)
          .then(() => setStatus({ tone: 'info', message: 'Opening the sermon video outside the app.' }))
          .catch(() => setStatus({ tone: 'danger', message: 'Could not open the sermon video right now.' }));
      }
      return;
    }

    if (!isCurrent) {
      await loadAndPlay(sermon.id, sermon.audioUrl);
      return;
    }

    await togglePlayPause();
  };

  const handleDownload = async () => {
    if (!sermon.audioUrl) return;

    try {
      setIsDownloading(true);
      setStatus({ tone: 'info', message: 'Saving sermon audio to this device...' });
      const fileName = `sermon_${sermon.id}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const download = await FileSystem.downloadAsync(sermon.audioUrl, fileUri);
      if (download.uri) {
        setStatus({ tone: 'success', message: 'The sermon audio was saved for offline listening on this device.' });
        Alert.alert('Downloaded', 'The sermon audio was saved for offline listening on this device.');
      }
    } catch {
      setStatus({ tone: 'danger', message: 'Could not save the sermon audio right now.' });
      Alert.alert('Download Failed', 'Could not save the sermon audio right now.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareMessage = `${sermon.title}\n${sermon.speaker}\n${sermon.summary}${sermon.videoUrl ? `\n${sermon.videoUrl}` : ''}`;
    try {
      setIsSharing(true);
      setStatus({ tone: 'info', message: 'Preparing share options...' });
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: sermon.title, text: shareMessage });
        } else {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Copied', 'Sermon details copied to your clipboard.');
        }
        setStatus({ tone: 'success', message: 'Sermon share is ready.' });
        return;
      }

      if (hasAudio && await Sharing.isAvailableAsync()) {
        const fileUri = FileSystem.cacheDirectory + `sermon_share_${sermon.id}.mp3`;
        const download = await FileSystem.downloadAsync(sermon.audioUrl, fileUri);
        await Sharing.shareAsync(download.uri, {
          mimeType: 'audio/mpeg',
          dialogTitle: `Share ${sermon.title}`,
        });
        setStatus({ tone: 'success', message: 'Sermon audio is ready to share.' });
        return;
      }

      Alert.alert('Share', shareMessage);
      setStatus({ tone: 'success', message: 'Sermon details are ready to share.' });
    } catch {
      setStatus({ tone: 'danger', message: 'Could not share this sermon right now.' });
      Alert.alert('Share Failed', 'Could not share this sermon right now.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {hasVideo ? (
          canPlayVideoInApp ? (
            <MediaVideoPlayer videoUrl={sermon.videoUrl} style={styles.videoCard} fullscreenTitle={sermon.title} />
          ) : (
            <View style={styles.artCard}>
              <Ionicons name="videocam-outline" size={64} color={theme.colors.accent} />
              <Text style={styles.artTitle}>External video source</Text>
              <Text style={styles.artBody}>This sermon points to a video page that opens outside the app.</Text>
            </View>
          )
        ) : (
          <View style={styles.artCard}>
            <Ionicons name="radio-outline" size={64} color={theme.colors.accent} />
            <Text style={styles.artTitle}>Audio-first sermon</Text>
            <Text style={styles.artBody}>Use the player below to stream or pause this message without leaving the app.</Text>
          </View>
        )}

        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.mediaBadge}>
              <Text style={styles.mediaBadgeText}>{sermon.mediaType?.toUpperCase() || 'SERMON'}</Text>
            </View>
            <Text style={styles.dateLabel}>{formatLongDateLabel(sermon.publishedAt)}</Text>
          </View>
          <Text style={styles.title}>{sermon.title}</Text>
          <Text style={styles.speaker}>{sermon.speaker}</Text>
          <Text style={styles.summary}>{sermon.summary}</Text>
          <View style={styles.availabilityRow}>
            {hasAudio ? (
              <View style={styles.capabilityChip}>
                <Ionicons name="headset-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.capabilityText}>Audio in app</Text>
              </View>
            ) : null}
            {hasVideo ? (
              <View style={styles.capabilityChip}>
                <Ionicons name="videocam-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.capabilityText}>
                  {canPlayVideoInApp ? (videoKind === 'youtube' ? 'YouTube in app' : 'Video in app') : 'Opens externally'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {audioError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.errorText}>{audioError}</Text>
          </View>
        )}

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

        {hasAudio && (
          <View style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerTitle}>Audio Playback</Text>
              <Text style={styles.playerCaption}>{sermon.durationLabel || 'Audio sermon'}</Text>
            </View>

             <Text style={styles.playerHint}>{playbackStatusLabel}</Text>

            <View style={styles.seekRow}>
              <Text style={styles.timeText}>{formatTime(activePosition)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={activeDuration > 0 ? activeDuration : 1}
                value={activePosition}
                onSlidingComplete={(value) => isCurrent && seekTo(Math.round(value))}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.borderStrong}
                thumbTintColor={theme.colors.accent}
                disabled={!isCurrent || !isLoaded}
              />
              <Text style={styles.timeText}>{formatTime(activeDuration)}</Text>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={handlePrimaryMedia} activeOpacity={0.9} disabled={isLoading}>
              <Ionicons
                name={isCurrent && isPlaying ? 'pause' : 'play'}
                size={30}
                color={theme.colors.textOnAccent}
              />
              <Text style={styles.playButtonText}>{primaryButtonLabel}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionRow}>
          {hasVideo && (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => Linking.openURL(sermon.videoUrl)
                .then(() => setStatus({ tone: 'info', message: 'Opening the sermon video outside the app.' }))
                .catch(() => setStatus({ tone: 'danger', message: 'Could not open the sermon video right now.' }))}
              activeOpacity={0.9}
            >
              <Ionicons name={videoKind === 'youtube' ? 'logo-youtube' : 'open-outline'} size={18} color={theme.colors.text} />
              <Text style={styles.secondaryActionText}>
                {videoKind === 'youtube' ? 'Open on YouTube' : videoKind === 'file' ? 'Open in browser' : 'Open video'}
              </Text>
            </TouchableOpacity>
          )}
          {hasAudio && (
            <TouchableOpacity style={styles.secondaryAction} onPress={handleDownload} activeOpacity={0.9} disabled={isDownloading}>
              <Ionicons name="download-outline" size={18} color={theme.colors.text} />
              <Text style={styles.secondaryActionText}>{isDownloading ? 'Saving...' : 'Download audio'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryAction} onPress={handleShare} activeOpacity={0.9} disabled={isSharing}>
            <Ionicons name="share-social-outline" size={18} color={theme.colors.text} />
            <Text style={styles.secondaryActionText}>{isSharing ? 'Preparing share...' : 'Share'}</Text>
          </TouchableOpacity>
        </View>

        <SermonNotes sermonId={sermon.id} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'stretch',
      paddingBottom: theme.spacing.xxl,
    },
    videoCard: {
      borderRadius: theme.radius.xl,
      height: 220,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.lg,
    },
    artCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
    },
    artTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginTop: theme.spacing.md,
      marginBottom: 6,
      textAlign: 'center',
    },
    artBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    titleBlock: {
      marginBottom: theme.spacing.lg,
    },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    mediaBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    mediaBadgeText: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    dateLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 34,
      marginBottom: 6,
    },
    speaker: {
      color: theme.colors.accent,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },
    availabilityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    capabilityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    capabilityText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    errorBanner: {
      backgroundColor: theme.colors.danger,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.lg,
    },
    errorText: {
      color: '#FFFFFF',
      fontSize: 13,
      flex: 1,
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
    playerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    playerHeader: {
      marginBottom: theme.spacing.md,
    },
    playerTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    playerCaption: {
      color: theme.colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    playerHint: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: theme.spacing.md,
    },
    seekRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: theme.spacing.lg,
    },
    slider: {
      flex: 1,
      height: 40,
    },
    timeText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      width: 46,
      textAlign: 'center',
      fontWeight: '700',
    },
    playButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 16,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    playButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryActionText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAudio } from '../hooks/AudioContext';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { formatLongDateLabel, getVideoPlaybackKind } from '../../shared/contentModel';
import { API_BASE, fetchSermons } from '../services/api';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'hybrid', label: 'Both' },
];

function formatTime(millis) {
  if (!millis || millis < 0) return '0:00';
  const totalSec = Math.floor(millis / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function SermonsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const audio = useAudio();
  const styles = createStyles(theme);

  const [filter, setFilter] = useState('all');
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSermons = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchSermons();
      setSermons(payload || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load sermons right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSermons();
  }, [loadSermons]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSermons);
    return unsubscribe;
  }, [loadSermons, navigation]);

  const handlePlay = async (sermon) => {
    if (!sermon?.audioUrl) {
      navigation.navigate('SermonDetail', { sermon });
      return;
    }

    if (audio.isCurrentSermon(sermon.id)) {
      await audio.togglePlayPause();
      return;
    }

    await audio.loadAndPlay(sermon.id, sermon.audioUrl);
  };

  const latestSermon = sermons[0] || null;
  const currentSermon = useMemo(
    () => sermons.find((item) => item.id === audio.currentSermonId) || null,
    [audio.currentSermonId, sermons]
  );

  const filteredSermons = useMemo(
    () => sermons.filter((sermon) => (filter === 'all' ? true : sermon.mediaType === filter)),
    [filter, sermons]
  );

  const counts = useMemo(() => ({
    all: sermons.length,
    audio: sermons.filter((item) => item.mediaType === 'audio').length,
    video: sermons.filter((item) => item.mediaType === 'video').length,
    hybrid: sermons.filter((item) => item.mediaType === 'hybrid').length,
  }), [sermons]);

  const activeDuration = currentSermon ? audio.durationMillis : 0;
  const activePosition = currentSermon ? audio.positionMillis : 0;
  const progressPercent = activeDuration > 0 ? Math.min(100, Math.round((activePosition / activeDuration) * 100)) : 0;

  const getPrimaryLabel = (sermon) => {
    if (!sermon) return 'Open sermon';
    const isCurrent = audio.isCurrentSermon(sermon.id);
    const isPlaying = isCurrent && audio.isPlaying;
    if (sermon.audioUrl) return isPlaying ? 'Pause audio' : isCurrent && audio.positionMillis > 0 ? 'Resume audio' : 'Play audio';
    if (sermon.videoUrl) return 'Watch sermon';
    return 'Open sermon';
  };

  const getPrimaryIcon = (sermon) => {
    if (!sermon) return 'book-outline';
    const isCurrent = audio.isCurrentSermon(sermon.id);
    const isPlaying = isCurrent && audio.isPlaying;
    if (sermon.audioUrl) return isPlaying ? 'pause' : 'play';
    if (sermon.videoUrl) return 'videocam-outline';
    return 'book-outline';
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Sermon Library</Text>
              <Text style={styles.title}>Stay close to the preached Word, whether you are listening again or catching up for the first time.</Text>
              <Text style={styles.subtitle}>
                Start with the latest message, keep your place in the current one, and move through the archive without losing the thread.
              </Text>
            </View>

            <View style={styles.heroStatsCard}>
              <Text style={styles.heroStatsValue}>{sermons.length}</Text>
              <Text style={styles.heroStatsLabel}>Messages</Text>
            </View>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.heroMetaChip}>
              <Ionicons name="radio-outline" size={15} color={theme.colors.accent} />
              <Text style={styles.heroMetaText}>{counts.audio} audio-first</Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Ionicons name="videocam-outline" size={15} color={theme.colors.accent} />
              <Text style={styles.heroMetaText}>{counts.video + counts.hybrid} video-ready</Text>
            </View>
          </View>

          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => latestSermon ? handlePlay(latestSermon) : null}
              activeOpacity={0.9}
              disabled={!latestSermon}
            >
              <Ionicons name={getPrimaryIcon(latestSermon)} size={18} color={theme.colors.textOnAccent} />
              <Text style={styles.heroButtonText}>{latestSermon ? getPrimaryLabel(latestSermon) : 'No sermons yet'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryButton}
              onPress={() => latestSermon ? navigation.navigate('SermonDetail', { sermon: latestSermon }) : null}
              activeOpacity={0.9}
              disabled={!latestSermon}
            >
              <Text style={styles.heroSecondaryButtonText}>Latest message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!user ? (
          <View style={styles.signInBanner}>
            <View style={styles.signInIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.accent} />
            </View>
            <View style={styles.signInCopy}>
              <Text style={styles.signInTitle}>Sign in to keep private sermon notes</Text>
              <Text style={styles.signInBody}>Your notes live inside each sermon detail screen and stay tied to your account.</Text>
            </View>
            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Profile')} activeOpacity={0.9}>
              <Text style={styles.signInButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {currentSermon ? (
          <View style={styles.continueCard}>
            <View style={styles.continueHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Continue Listening</Text>
                <Text style={styles.continueTitle}>{currentSermon.title}</Text>
                <Text style={styles.continueMeta}>
                  {currentSermon.speaker}
                  {currentSermon.durationLabel ? ` | ${currentSermon.durationLabel}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.continuePlayButton} onPress={() => handlePlay(currentSermon)} activeOpacity={0.9}>
                <Ionicons name={audio.isPlaying ? 'pause' : 'play'} size={18} color={theme.colors.textOnAccent} />
              </TouchableOpacity>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{formatTime(activePosition)} / {formatTime(activeDuration)}</Text>
            </View>

            <View style={styles.continueActions}>
              <TouchableOpacity style={styles.continueSecondary} onPress={() => navigation.navigate('SermonDetail', { sermon: currentSermon })} activeOpacity={0.9}>
                <Text style={styles.continueSecondaryText}>Open details</Text>
              </TouchableOpacity>
              <Text style={styles.continueCaption}>{audio.isPlaying ? 'Playing now' : 'Ready to resume'}</Text>
            </View>
          </View>
        ) : null}

        {latestSermon ? (
          <View style={styles.featuredCard}>
            <View style={styles.featuredHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Latest Message</Text>
                <Text style={styles.featuredIntro}>The clearest place to start if you only open one sermon today.</Text>
              </View>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>{latestSermon.mediaType?.toUpperCase() || 'SERMON'}</Text>
              </View>
            </View>

            <Text style={styles.featuredTitle}>{latestSermon.title}</Text>
            <Text style={styles.featuredMeta}>
              {latestSermon.speaker}
              {latestSermon.durationLabel ? ` | ${latestSermon.durationLabel}` : ''}
            </Text>
            <Text style={styles.featuredBody} numberOfLines={4}>{latestSermon.summary}</Text>

            <View style={styles.featuredFooter}>
              <Text style={styles.featuredFooterText}>{formatLongDateLabel(latestSermon.publishedAt)}</Text>
              <Text style={styles.featuredFooterText}>
                {latestSermon.audioUrl && latestSermon.videoUrl ? 'Audio and video available' : latestSermon.videoUrl ? 'Video available' : 'Audio available'}
              </Text>
            </View>

            <View style={styles.featuredActionRow}>
              <TouchableOpacity style={styles.primaryAction} onPress={() => handlePlay(latestSermon)} activeOpacity={0.9}>
                <Ionicons
                  name={getPrimaryIcon(latestSermon)}
                  size={16}
                  color={theme.colors.textOnAccent}
                />
                <Text style={styles.primaryActionText}>{getPrimaryLabel(latestSermon)}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('SermonDetail', { sermon: latestSermon })} activeOpacity={0.9}>
                <Text style={styles.secondaryActionText}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Archive</Text>
            <Text style={styles.sectionSupporting}>Filter by format and move through the teaching library with less noise and more clarity.</Text>
          </View>
          <Text style={styles.sectionCaption}>{counts[filter]} showing</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.9}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
              <Text style={[styles.filterCount, filter === item.key && styles.filterCountActive]}>
                {counts[item.key]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Loading sermons...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load sermons</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Text style={styles.debugHint}>Server: {API_BASE}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSermons} activeOpacity={0.9}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredSermons.map((sermon) => {
              const isCurrent = audio.isCurrentSermon(sermon.id);
              const isPlaying = isCurrent && audio.isPlaying;
              const videoKind = getVideoPlaybackKind(sermon.videoUrl);
              return (
                <TouchableOpacity
                  key={sermon.id}
                  style={[styles.card, isCurrent && styles.cardActive]}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('SermonDetail', { sermon })}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardMetaLeft}>
                      <View style={styles.mediaBadge}>
                        <Text style={styles.mediaBadgeText}>{sermon.mediaType?.toUpperCase() || 'SERMON'}</Text>
                      </View>
                      {isCurrent ? (
                        <View style={styles.nowPlayingBadge}>
                          <Ionicons name={isPlaying ? 'radio' : 'pause-circle-outline'} size={12} color={theme.colors.textOnAccent} />
                          <Text style={styles.nowPlayingText}>{isPlaying ? 'PLAYING' : 'PAUSED'}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.dateText}>{formatLongDateLabel(sermon.publishedAt)}</Text>
                  </View>

                  <Text style={styles.sermonTitle}>{sermon.title}</Text>
                  <Text style={styles.sermonMeta}>
                    {sermon.speaker}
                    {sermon.durationLabel ? ` | ${isCurrent ? formatTime(audio.positionMillis) : sermon.durationLabel}` : ''}
                  </Text>
                  <Text style={styles.sermonSummary} numberOfLines={2}>{sermon.summary}</Text>

                  <View style={styles.sermonFooter}>
                    <View style={styles.capabilityRow}>
                      {sermon.audioUrl ? (
                        <View style={styles.capabilityChip}>
                          <Ionicons name="headset-outline" size={13} color={theme.colors.accent} />
                          <Text style={styles.capabilityText}>Audio</Text>
                        </View>
                      ) : null}
                      {videoKind !== 'none' ? (
                        <View style={styles.capabilityChip}>
                          <Ionicons name="videocam-outline" size={13} color={theme.colors.accent} />
                          <Text style={styles.capabilityText}>{videoKind === 'youtube' ? 'YouTube' : 'Video'}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.primaryActionCompact} onPress={() => handlePlay(sermon)} activeOpacity={0.9}>
                        <Ionicons
                          name={isPlaying ? 'pause' : sermon.audioUrl ? 'play' : 'videocam-outline'}
                          size={15}
                          color={theme.colors.textOnAccent}
                        />
                        <Text style={styles.primaryActionTextCompact}>
                          {sermon.audioUrl ? (isPlaying ? 'Pause' : isCurrent && audio.positionMillis > 0 ? 'Resume' : 'Play') : 'Watch'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryActionCompact} onPress={() => navigation.navigate('SermonDetail', { sermon })} activeOpacity={0.9}>
                        <Text style={styles.secondaryActionTextCompact}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredSermons.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No sermons in this filter yet</Text>
                <Text style={styles.emptyBody}>Publish content from the admin panel with audio, video, or both, and it will appear here automatically.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingBottom: 118,
    },
    heroCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    heroCopy: {
      flex: 1,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: theme.spacing.sm,
    },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 34,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    heroStatsCard: {
      width: 80,
      minHeight: 80,
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    heroStatsValue: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '800',
    },
    heroStatsLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    heroStatRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
    },
    heroMetaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    heroMetaText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    heroActionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heroButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: theme.radius.md,
    },
    heroButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
    heroSecondaryButton: {
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 18,
    },
    heroSecondaryButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    signInBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    signInIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInCopy: {
      flex: 1,
    },
    signInTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    signInBody: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    signInButton: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    signInButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '800',
    },
    continueCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.md,
    },
    continueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: 4,
    },
    continueTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 26,
      marginBottom: 4,
      maxWidth: 250,
    },
    continueMeta: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    continuePlayButton: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    progressTrack: {
      flex: 1,
      height: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
    },
    progressText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    continueActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    continueSecondary: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    continueSecondaryText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '800',
    },
    continueCaption: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    featuredCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    featuredHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    featuredIntro: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
      maxWidth: 240,
    },
    featuredBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    featuredBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    featuredTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 30,
      marginBottom: 6,
    },
    featuredMeta: {
      color: theme.colors.accentStrong,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    featuredBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    featuredFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    featuredFooterText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    featuredActionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    primaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    primaryActionText: {
      color: theme.colors.textOnAccent,
      fontSize: 13,
      fontWeight: '800',
    },
    secondaryAction: {
      minWidth: 90,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceMuted,
    },
    secondaryActionText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    sectionSupporting: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      maxWidth: 260,
    },
    sectionCaption: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    filterRow: {
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    filterText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    filterTextActive: {
      color: theme.colors.textOnAccent,
    },
    filterCount: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
    },
    filterCountActive: {
      color: theme.colors.textOnAccent,
    },
    loadingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    errorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    errorTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    errorBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    debugHint: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 2,
      marginBottom: theme.spacing.sm,
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
    list: {
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    cardActive: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceRaised,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    cardMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      flex: 1,
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
    nowPlayingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    nowPlayingText: {
      color: theme.colors.textOnAccent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    dateText: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    sermonTitle: {
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: '800',
      lineHeight: 25,
      marginBottom: 6,
    },
    sermonMeta: {
      color: theme.colors.accentStrong,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: theme.spacing.sm,
    },
    sermonSummary: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    sermonFooter: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    capabilityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    capabilityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    capabilityText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    actionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    primaryActionCompact: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    primaryActionTextCompact: {
      color: theme.colors.textOnAccent,
      fontSize: 13,
      fontWeight: '800',
    },
    secondaryActionCompact: {
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceMuted,
    },
    secondaryActionTextCompact: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    emptyBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}

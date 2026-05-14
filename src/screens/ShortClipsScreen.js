import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import {
  formatLongDateLabel,
  getVideoPlaybackKind,
  relativeTimeFromDate,
} from '../../shared/contentModel';
import { fetchClips } from '../services/api';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Featured' },
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'youtube', label: 'YouTube' },
];

function getClipKindLabel(kind, featured) {
  if (featured) return 'Featured clip';
  if (kind === 'file') return 'Uploaded video';
  if (kind === 'youtube') return 'YouTube clip';
  return 'Clip';
}

function getClipSurfaceTone(kind) {
  if (kind === 'file') return 'UPLOADED';
  if (kind === 'youtube') return 'YOUTUBE';
  return 'CLIP';
}

export default function ShortClipsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [clips, setClips] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClips = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchClips();
      setClips(payload || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load clips right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadClips);
    return unsubscribe;
  }, [loadClips, navigation]);

  const featuredClip = clips.find((clip) => clip.featured) || clips[0] || null;
  const uploadedCount = clips.filter((clip) => getVideoPlaybackKind(clip.videoUrl) === 'file').length;
  const youtubeCount = clips.filter((clip) => getVideoPlaybackKind(clip.videoUrl) === 'youtube').length;
  const freshCount = clips.filter((clip) => {
    const publishedAt = new Date(clip.publishedAt).getTime();
    if (Number.isNaN(publishedAt)) return false;
    return Date.now() - publishedAt < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const filteredClips = clips.filter((clip) => {
    const kind = getVideoPlaybackKind(clip.videoUrl);
    if (filter === 'featured') return clip.featured;
    if (filter === 'uploaded') return kind === 'file';
    if (filter === 'youtube') return kind === 'youtube';
    return true;
  });

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Clips</Text>
              <Text style={styles.title}>Carry quick moments of truth into the rest of your week.</Text>
              <Text style={styles.subtitle}>
                Open featured highlights first, then move through uploaded and YouTube clips without leaving the app flow.
              </Text>
            </View>
            <View style={styles.heroCountBadge}>
              <Text style={styles.heroCountValue}>{clips.length}</Text>
              <Text style={styles.heroCountLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{freshCount}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{uploadedCount}</Text>
              <Text style={styles.statLabel}>Uploaded</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{youtubeCount}</Text>
              <Text style={styles.statLabel}>YouTube</Text>
            </View>
          </View>
        </View>

        {featuredClip ? (
          <TouchableOpacity
            style={styles.spotlightCard}
            activeOpacity={0.94}
            onPress={() => navigation.navigate('ClipDetail', { clip: featuredClip })}
          >
            {featuredClip.thumbnailUrl ? (
              <ImageBackground
                source={{ uri: featuredClip.thumbnailUrl }}
                style={styles.spotlightMedia}
                imageStyle={styles.spotlightMediaImage}
              >
                <View style={styles.spotlightOverlay}>
                  <View style={styles.spotlightPlayButton}>
                    <Ionicons name='play' size={26} color={theme.colors.textOnAccent} />
                  </View>
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.spotlightMediaFallback}>
                <View style={styles.spotlightPlayButton}>
                  <Ionicons name='play' size={26} color={theme.colors.textOnAccent} />
                </View>
              </View>
            )}

            <View style={styles.spotlightCopy}>
              <View style={styles.spotlightMetaRow}>
                <View style={styles.spotlightBadge}>
                  <Text style={styles.spotlightBadgeText}>
                    {getClipSurfaceTone(getVideoPlaybackKind(featuredClip.videoUrl), featuredClip.featured)}
                  </Text>
                </View>
                <Text style={styles.spotlightDate}>{formatLongDateLabel(featuredClip.publishedAt)}</Text>
              </View>

              <Text style={styles.spotlightTitle}>{featuredClip.title}</Text>
              <Text style={styles.spotlightBody} numberOfLines={3}>{featuredClip.description}</Text>

              <View style={styles.spotlightFooter}>
                <Text style={styles.spotlightFooterLabel}>
                  {getClipKindLabel(getVideoPlaybackKind(featuredClip.videoUrl), featuredClip.featured)}
                </Text>
                <View style={styles.spotlightCtaRow}>
                  <Text style={styles.spotlightCtaText}>Play featured clip</Text>
                  <Ionicons name='arrow-forward' size={16} color={theme.colors.accent} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Clip Library</Text>
            <Text style={styles.sectionBody}>Filter the archive by format and open the moments worth replaying or sharing.</Text>
          </View>
          <Text style={styles.sectionCount}>{filteredClips.length}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              activeOpacity={0.9}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size='large' color={theme.colors.accent} />
            <Text style={styles.loadingText}>Loading clips...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load clips</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} activeOpacity={0.9} onPress={loadClips}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredClips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No clips in this view yet</Text>
            <Text style={styles.emptyBody}>
              Publish a clip from the admin panel or switch the filter to see the rest of the archive.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredClips.map((clip) => {
              const playbackKind = getVideoPlaybackKind(clip.videoUrl);

              return (
                <TouchableOpacity
                  key={clip.id}
                  style={styles.card}
                  activeOpacity={0.94}
                  onPress={() => navigation.navigate('ClipDetail', { clip })}
                >
                  {clip.thumbnailUrl ? (
                    <ImageBackground source={{ uri: clip.thumbnailUrl }} imageStyle={styles.thumbnailImage} style={styles.thumbnail}>
                      <View style={styles.thumbnailOverlay}>
                        <View style={styles.playOrb}>
                          <Ionicons name='play' size={22} color={theme.colors.textOnAccent} />
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.thumbnailFallback}>
                      <View style={styles.playOrb}>
                        <Ionicons name='play' size={22} color={theme.colors.textOnAccent} />
                      </View>
                    </View>
                  )}

                  <View style={styles.cardCopy}>
                    <View style={styles.metaRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {clip.featured ? 'FEATURED' : getClipSurfaceTone(playbackKind)}
                        </Text>
                      </View>
                      <Text style={styles.clipDate}>{relativeTimeFromDate(clip.publishedAt)}</Text>
                    </View>

                    <Text style={styles.clipTitle}>{clip.title}</Text>
                    <Text style={styles.clipDescription} numberOfLines={2}>{clip.description}</Text>

                    <View style={styles.openRow}>
                      <Text style={styles.openText}>{getClipKindLabel(playbackKind, clip.featured)}</Text>
                      <Ionicons name='arrow-forward' size={16} color={theme.colors.accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    heroCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      ...theme.shadows.lg,
    },
    heroHeader: {
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
    heroCountBadge: {
      minWidth: 78,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    heroCountValue: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    heroCountLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    statRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 16,
      gap: 5,
    },
    statValue: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    statLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    spotlightCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      overflow: 'hidden',
      ...theme.shadows.lg,
    },
    spotlightMedia: {
      height: 220,
      justifyContent: 'center',
    },
    spotlightMediaImage: {
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
    },
    spotlightOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 7, 13, 0.26)',
    },
    spotlightMediaFallback: {
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceMuted,
    },
    spotlightPlayButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    },
    spotlightCopy: {
      padding: theme.spacing.xl,
    },
    spotlightMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    spotlightBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    spotlightBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    spotlightDate: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    spotlightTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 31,
      marginBottom: theme.spacing.sm,
    },
    spotlightBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    spotlightFooter: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    spotlightFooterLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    spotlightCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    spotlightCtaText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: '800',
      marginBottom: 4,
    },
    sectionBody: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      maxWidth: 260,
    },
    sectionCount: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
    },
    filterRow: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.sm,
    },
    filterChip: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    filterChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    filterChipText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: theme.colors.textOnAccent,
      fontWeight: '800',
    },
    loadingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.xxl,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    errorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
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
      lineHeight: 21,
    },
    retryButton: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: theme.spacing.sm,
    },
    retryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    emptyBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    list: {
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      gap: theme.spacing.md,
      ...theme.shadows.sm,
    },
    thumbnail: {
      width: 128,
      minHeight: 144,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    thumbnailImage: {
      borderRadius: theme.radius.lg,
    },
    thumbnailOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(5, 7, 13, 0.24)',
    },
    thumbnailFallback: {
      width: 128,
      minHeight: 144,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playOrb: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    },
    cardCopy: {
      flex: 1,
      justifyContent: 'space-between',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: 8,
    },
    badge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    badgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    clipDate: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    clipTitle: {
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: '800',
      lineHeight: 25,
      marginBottom: 8,
    },
    clipDescription: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    openText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
  });
}

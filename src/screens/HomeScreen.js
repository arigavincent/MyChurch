import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { useAudio } from '../hooks/AudioContext';
import { useAuth } from '../hooks/AuthContext';
import { API_BASE, fetchHomePayload } from '../services/api';
import { resolveChurchName } from '../branding';
import {
  formatEventDateLabel,
  formatEventTimeLabel,
  formatLongDateLabel,
  getVideoPlaybackKind,
  getYouTubeVideoId,
} from '../../shared/contentModel';

const quickActions = [
  {
    title: 'Prayer Wall',
    eyebrow: 'Care',
    description: 'Carry the needs of the house and encourage someone today.',
    icon: 'heart-outline',
    route: 'PrayerWall',
  },
  {
    title: 'Events',
    eyebrow: 'Gather',
    icon: 'calendar-outline',
    route: 'Events',
  },
  {
    title: 'Bible',
    eyebrow: 'Word',
    description: 'Open the full Bible offline in English or Kiswahili and keep the Word close all week.',
    icon: 'book-outline',
    route: 'Bible',
  },
  {
    title: 'Giving',
    eyebrow: 'Support',
    icon: 'wallet-outline',
    route: 'Giving',
  },
];

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getResponsiveLayout(width) {
  const viewportWidth = Math.max(width || 0, 320);
  const isCompact = viewportWidth < 390;
  const isLargePhone = viewportWidth >= 430;
  const isTablet = viewportWidth >= 760;

  return {
    isCompact,
    isLargePhone,
    isTablet,
    contentMaxWidth: isTablet ? 920 : viewportWidth >= 600 ? 760 : 560,
    shellGap: isCompact ? 18 : 24,
    heroPadding: isCompact ? 18 : isTablet ? 30 : 24,
    panelPadding: isCompact ? 16 : isTablet ? 24 : 20,
    heroTitleSize: isCompact ? 24 : isTablet ? 38 : isLargePhone ? 32 : 28,
    heroTitleLineHeight: isCompact ? 30 : isTablet ? 44 : isLargePhone ? 38 : 34,
    spotlightTitleSize: isCompact ? 22 : isTablet ? 30 : 26,
    spotlightTitleLineHeight: isCompact ? 28 : isTablet ? 36 : 32,
    clipCardWidth: Math.round(Math.max(220, Math.min(viewportWidth * (isTablet ? 0.34 : isLargePhone ? 0.58 : 0.74), 320))),
  };
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDark, toggleMode } = useTheme();
  const audio = useAudio();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getResponsiveLayout(width), [width]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  const [appConfig, setAppConfig] = useState(null);
  const [verse, setVerse] = useState(null);
  const [latestDevotion, setLatestDevotion] = useState(null);
  const [latestSermon, setLatestSermon] = useState(null);
  const [clips, setClips] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHome = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const payload = await fetchHomePayload();
      setAppConfig(payload.appConfig || null);
      setVerse(payload.verse || null);
      setLatestDevotion(payload.latestDevotion || null);
      setLatestSermon(payload.latestSermon || null);
      setClips(payload.clips || []);
      setEvents(payload.events || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load the home screen right now.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHome({ silent: true });
    });
    return unsubscribe;
  }, [loadHome, navigation]);

  const playLatestAudio = async () => {
    if (!latestSermon?.audioUrl) {
      navigation.navigate('SermonDetail', { sermon: latestSermon });
      return;
    }

    if (audio.isCurrentSermon(latestSermon.id)) {
      await audio.togglePlayPause();
      return;
    }

    await audio.loadAndPlay(latestSermon.id, latestSermon.audioUrl);
  };

  const shareVerse = () => {
    if (!verse) return;
    Share.share({
      message: `${verse.text}\n\n- ${verse.reference}\n\nShared from ${resolveChurchName(appConfig?.churchName)}`,
    }).catch(() => {});
  };

  const liveClipId = appConfig?.liveStreamId ? getYouTubeVideoId(appConfig.liveStreamId) : '';
  const churchName = resolveChurchName(appConfig?.churchName);
  const churchLocation = [appConfig?.city, appConfig?.country].filter(Boolean).join(', ');
  const isLiveReady = !!(appConfig?.liveStreamEnabled && liveClipId);
  const isCurrentLatestSermon = latestSermon ? audio.isCurrentSermon(latestSermon.id) : false;
  const isLatestPlaying = isCurrentLatestSermon && audio.isPlaying;
  const greetingLabel = getGreetingLabel();
  const featuredAction = quickActions[0];
  const secondaryActions = quickActions.slice(1);

  const latestSermonPrimaryLabel = latestSermon?.audioUrl
    ? (isLatestPlaying ? 'Pause audio' : 'Play audio')
    : latestSermon?.videoUrl
      ? 'Watch sermon'
      : 'Open sermon';

  const heroPrimaryLabel = isLiveReady
    ? 'Watch live'
    : latestSermon
      ? latestSermonPrimaryLabel
      : 'Open events';

  const handleHeroPrimary = async () => {
    if (isLiveReady) {
      navigation.navigate('Events');
      return;
    }

    if (latestSermon) {
      await playLatestAudio();
      return;
    }

    navigation.navigate('Events');
  };

  const heroPrimaryIcon = isLiveReady
    ? 'radio-outline'
    : latestSermon?.audioUrl
      ? (isLatestPlaying ? 'pause' : 'play')
      : latestSermon?.videoUrl
        ? 'videocam-outline'
        : 'calendar-outline';

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentShell}>
          <View style={styles.hero}>
            <View style={styles.heroGlowPrimary} />
            <View style={styles.heroGlowAccent} />

            <View style={styles.heroTopRow}>
              <View style={styles.brandCluster}>
                <View style={styles.brandSeal}>
                  <Image source={require('../../assets/brand-logo.jpg')} style={styles.brandSealImage} />
                </View>
                <View style={styles.brandCopy}>
                  <Text style={styles.eyebrow}>{churchName}</Text>
                  <Text style={styles.heroGreeting}>{greetingLabel}</Text>
                </View>
              </View>

              <View style={styles.topActions}>
                <TouchableOpacity onPress={toggleMode} style={styles.themeButton} activeOpacity={0.9}>
                  <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={theme.colors.accent} />
                  <Text style={styles.themeButtonText}>{isDark ? 'Dark' : 'Light'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate(user ? 'Settings' : 'Profile')}
                  style={styles.profileButton}
                  activeOpacity={0.9}
                >
                  <Ionicons name='person-circle-outline' size={28} color={theme.colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              {appConfig?.heroHeadline || 'Welcome home. Stay near the Word and near the people of God.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {appConfig?.heroSubheadline || "Start with today's message, carry someone in prayer, and keep the next gathering in view."}
            </Text>
            <Text style={styles.heroContext}>
              {churchLocation || 'Church family'}
              {' | '}
              {isLiveReady ? 'Live stream available now' : latestSermon ? 'Fresh teaching ready to open' : 'Prayer, worship, and the Word are ready for today'}
            </Text>

            <View style={styles.heroCtaRow}>
              <TouchableOpacity style={styles.heroPrimaryCta} onPress={handleHeroPrimary} activeOpacity={0.92}>
                <Ionicons name={heroPrimaryIcon} size={18} color={theme.colors.textOnAccent} />
                <Text style={styles.heroPrimaryCtaText}>{heroPrimaryLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryCta}
                onPress={() => navigation.navigate(verse ? 'Verse' : 'Clips')}
                activeOpacity={0.92}
              >
                <Text style={styles.heroSecondaryCtaText}>{verse ? "Today's verse" : 'Browse clips'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.statusCard}>
              <ActivityIndicator size='small' color={theme.colors.accent} />
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>Loading home content...</Text>
                <Text style={styles.statusBody}>Pulling the latest sermons, verse, clips, and events from your local backend.</Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Ionicons name='cloud-offline-outline' size={18} color='#FFFFFF' />
                <Text style={styles.errorTitle}>Home could not refresh</Text>
              </View>
              <Text style={styles.errorBody}>{error}</Text>
              <Text style={styles.debugHint}>Server: {API_BASE}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadHome()} activeOpacity={0.9}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {latestSermon ? (
            <View style={styles.spotlightCard}>
              <View style={styles.spotlightHeader}>
                <View style={styles.spotlightHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>Message Spotlight</Text>
                  <Text style={styles.spotlightIntro}>
                    {isLiveReady ? 'Start with the latest teaching and stay ready for the stream.' : 'The main thing to open first today.'}
                  </Text>
                </View>
                <View style={styles.spotlightBadge}>
                  <Text style={styles.spotlightBadgeText}>{latestSermon.mediaType?.toUpperCase() || 'SERMON'}</Text>
                </View>
              </View>

              <Text style={styles.spotlightTitle}>{latestSermon.title}</Text>
              <Text style={styles.spotlightMeta}>
                {latestSermon.speaker}
                {latestSermon.durationLabel ? ` | ${latestSermon.durationLabel}` : ''}
              </Text>
              <Text style={styles.spotlightBody} numberOfLines={4}>{latestSermon.summary}</Text>

              <View style={styles.spotlightFooter}>
                <Text style={styles.spotlightFooterText}>{formatLongDateLabel(latestSermon.publishedAt)}</Text>
                <Text style={styles.spotlightFooterText}>
                  {latestSermon.audioUrl && latestSermon.videoUrl ? 'Audio + video ready' : latestSermon.videoUrl ? 'Video ready' : 'Audio ready'}
                </Text>
              </View>

              <View style={styles.ctaGrid}>
                <TouchableOpacity style={styles.primaryCta} onPress={playLatestAudio} activeOpacity={0.92}>
                  <Ionicons
                    name={latestSermon.audioUrl ? (isLatestPlaying ? 'pause' : 'play') : latestSermon.videoUrl ? 'videocam-outline' : 'book-outline'}
                    size={18}
                    color={theme.colors.textOnAccent}
                  />
                  <Text style={styles.primaryCtaText}>{latestSermonPrimaryLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryCta}
                  onPress={() => navigation.navigate('SermonDetail', { sermon: latestSermon })}
                  activeOpacity={0.92}
                >
                  <Text style={styles.secondaryCtaText}>View details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {verse || latestDevotion ? (
            <View style={styles.todayStack}>
              {verse ? (
                <View style={styles.todayCardSlot}>
                  <View style={styles.verseRibbon}>
                    <TouchableOpacity style={styles.verseRibbonOpen} onPress={() => navigation.navigate('Verse')} activeOpacity={0.92}>
                      <View style={styles.verseRibbonIcon}>
                        <Ionicons name='sparkles-outline' size={18} color={theme.colors.accent} />
                      </View>
                      <View style={styles.verseRibbonCopy}>
                        <Text style={styles.sectionEyebrow}>Today's Verse</Text>
                        <Text style={styles.verseRibbonText} numberOfLines={2}>{verse.text}</Text>
                        <Text style={styles.verseRibbonReference}>{verse.reference}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.verseShareButton} onPress={shareVerse} activeOpacity={0.9}>
                      <Ionicons name='share-social-outline' size={18} color={theme.colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {latestDevotion ? (
                <View style={styles.todayCardSlot}>
                  <TouchableOpacity style={styles.devotionCard} onPress={() => navigation.navigate('Devotions')} activeOpacity={0.92}>
                    <View style={styles.devotionHeader}>
                      <Text style={styles.sectionEyebrow}>Guided Reflection</Text>
                      <Text style={styles.badgeText}>{formatLongDateLabel(latestDevotion.publishedAt)}</Text>
                    </View>
                    <Text style={styles.devotionTitle}>{latestDevotion.title}</Text>
                    <Text style={styles.devotionMeta}>{latestDevotion.reference}</Text>
                    <Text style={styles.devotionBody} numberOfLines={3}>{latestDevotion.body}</Text>
                    <View style={styles.devotionCtaRow}>
                      <Text style={styles.devotionCtaText}>Continue reading</Text>
                      <Ionicons name='arrow-forward' size={16} color={theme.colors.accent} />
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.sectionHeaderSolo}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>Move With Purpose</Text>
              <Text style={styles.sectionSupporting}>Keep the first layer of the app focused on prayer, gatherings, the Word, and generous response.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.featuredActionCard}
            onPress={() => navigation.navigate(featuredAction.route)}
            activeOpacity={0.92}
          >
            <View style={styles.featuredActionIcon}>
              <Ionicons name={featuredAction.icon} size={22} color={theme.colors.textOnAccent} />
            </View>
            <View style={styles.featuredActionCopy}>
              <Text style={styles.featuredActionEyebrow}>{featuredAction.eyebrow}</Text>
              <Text style={styles.featuredActionTitle}>{featuredAction.title}</Text>
              <Text style={styles.featuredActionBody}>{featuredAction.description}</Text>
            </View>
            <Ionicons name='arrow-forward' size={18} color={theme.colors.textOnAccent} />
          </TouchableOpacity>

          <View style={styles.secondaryActionRow}>
            {secondaryActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={styles.miniActionCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(action.route)}
              >
                <View style={styles.miniActionIcon}>
                  <Ionicons name={action.icon} size={20} color={theme.colors.accent} />
                </View>
                <Text style={styles.miniActionEyebrow}>{action.eyebrow}</Text>
                <Text style={styles.miniActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>Fresh Clips</Text>
                <Text style={styles.sectionSupporting}>Short, replayable moments built for quick encouragement and easy sharing.</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Clips')}>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {clips.map((clip) => (
                <TouchableOpacity
                  key={clip.id}
                  style={styles.clipCard}
                  onPress={() => navigation.navigate('ClipDetail', { clip })}
                  activeOpacity={0.92}
                >
                  {clip.thumbnailUrl ? (
                    <ImageBackground source={{ uri: clip.thumbnailUrl }} style={styles.clipThumb} imageStyle={styles.clipThumbImage}>
                      <View style={styles.clipThumbOverlay}>
                        <View style={styles.clipPlayOrb}>
                          <Ionicons name='play' size={20} color={theme.colors.textOnAccent} />
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.clipThumb}>
                      <View style={styles.clipPlayOrb}>
                        <Ionicons name='play' size={20} color={theme.colors.textOnAccent} />
                      </View>
                    </View>
                  )}

                  <View style={styles.clipMetaRow}>
                    <View style={styles.clipBadge}>
                      <Text style={styles.clipBadgeText}>
                        {clip.featured ? 'FEATURED' : getVideoPlaybackKind(clip.videoUrl) === 'file' ? 'UPLOADED' : 'VIDEO'}
                      </Text>
                    </View>
                    <Text style={styles.clipDate}>{formatLongDateLabel(clip.publishedAt)}</Text>
                  </View>

                  <Text style={styles.clipTitle} numberOfLines={2}>{clip.title}</Text>
                  <Text style={styles.clipDescription} numberOfLines={2}>{clip.description}</Text>

                  <View style={styles.clipOpenRow}>
                    <Text style={styles.clipOpenText}>Play in app</Text>
                    <Ionicons name='arrow-forward' size={16} color={theme.colors.accent} />
                  </View>
                </TouchableOpacity>
              ))}

              {clips.length === 0 ? (
                <View style={[styles.clipCard, styles.emptyCard]}>
                  <Text style={styles.emptyText}>Short clips will appear here when the team publishes them.</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>

          <View style={styles.sectionPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>Upcoming Gatherings</Text>
                <Text style={styles.sectionSupporting}>Keep the next service, conference, or community moment in clear view.</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.sectionLink}>Open events</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listColumn}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('Events')}
                  activeOpacity={0.92}
                >
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateDay}>{formatEventDateLabel(event.startsAt).split(' ')[1]}</Text>
                    <Text style={styles.eventDateMonth}>{formatEventDateLabel(event.startsAt).split(' ')[0]}</Text>
                  </View>

                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>{formatEventTimeLabel(event.startsAt)} | {event.location}</Text>
                    <Text style={styles.eventSummary} numberOfLines={2}>{event.summary}</Text>
                  </View>

                  <Ionicons name='arrow-forward' size={18} color={theme.colors.accent} />
                </TouchableOpacity>
              ))}

              {events.length === 0 ? (
                <View style={[styles.eventCard, styles.emptyCard]}>
                  <Text style={styles.emptyText}>No published events yet. Check back once the next gathering has been posted.</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme, layout) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: 118,
    },
    contentShell: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radius.xl,
      padding: layout.heroPadding,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: layout.shellGap,
      ...theme.shadows.lg,
    },
    statusCard: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: layout.panelPadding,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: layout.shellGap,
      ...theme.shadows.sm,
    },
    statusCopy: {
      flex: 1,
    },
    statusTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    statusBody: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    errorCard: {
      backgroundColor: theme.colors.danger,
      borderRadius: theme.radius.lg,
      padding: layout.panelPadding,
      marginBottom: layout.shellGap,
      ...theme.shadows.sm,
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.sm,
    },
    errorTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    errorBody: {
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 19,
    },
    debugHint: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 11,
      fontWeight: '700',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    retryButton: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    heroGlowPrimary: {
      position: 'absolute',
      top: -30,
      right: -24,
      width: layout.isTablet ? 180 : 150,
      height: layout.isTablet ? 180 : 150,
      borderRadius: layout.isTablet ? 90 : 75,
      backgroundColor: theme.colors.primaryMuted,
      opacity: theme.isDark ? 0.34 : 0.24,
    },
    heroGlowAccent: {
      position: 'absolute',
      bottom: -48,
      left: -22,
      width: layout.isTablet ? 144 : 128,
      height: layout.isTablet ? 144 : 128,
      borderRadius: layout.isTablet ? 72 : 64,
      backgroundColor: theme.colors.accentSoft,
      opacity: theme.isDark ? 0.34 : 0.2,
    },
    heroTopRow: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: layout.isCompact ? 'stretch' : 'flex-start',
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    brandCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    brandSeal: {
      width: layout.isCompact ? 60 : layout.isTablet ? 80 : 72,
      height: layout.isCompact ? 60 : layout.isTablet ? 80 : 72,
      borderRadius: layout.isCompact ? 18 : 22,
      overflow: 'hidden',
      backgroundColor: '#05070D',
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      ...theme.shadows.sm,
    },
    brandSealImage: {
      width: '100%',
      height: '100%',
    },
    brandCopy: {
      flex: 1,
    },
    heroGreeting: {
      color: theme.colors.text,
      fontSize: layout.isCompact ? 17 : 19,
      fontWeight: '800',
      lineHeight: layout.isCompact ? 22 : 24,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      alignSelf: layout.isCompact ? 'flex-start' : undefined,
    },
    themeButton: {
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
    themeButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '800',
    },
    profileButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    heroTitle: {
      color: theme.colors.text,
      fontSize: layout.heroTitleSize,
      fontWeight: '800',
      lineHeight: layout.heroTitleLineHeight,
      marginBottom: theme.spacing.sm,
      maxWidth: layout.isTablet ? 620 : layout.isLargePhone ? 400 : undefined,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: layout.isCompact ? 14 : 15,
      lineHeight: layout.isCompact ? 21 : 22,
      marginBottom: theme.spacing.md,
      maxWidth: layout.isTablet ? 640 : layout.isLargePhone ? 420 : undefined,
    },
    heroContext: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
      fontWeight: '700',
    },
    heroCtaRow: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      gap: theme.spacing.sm,
    },
    heroPrimaryCta: {
      flex: layout.isCompact ? 0 : 1.2,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    heroPrimaryCtaText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
    heroSecondaryCta: {
      flex: layout.isCompact ? 0 : 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    heroSecondaryCtaText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    spotlightCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: layout.heroPadding,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: layout.shellGap,
      ...theme.shadows.md,
    },
    spotlightHeader: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: layout.isCompact ? 'stretch' : 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    spotlightHeaderCopy: {
      flex: 1,
    },
    sectionEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    spotlightIntro: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
      maxWidth: layout.isCompact ? undefined : 280,
    },
    spotlightBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignSelf: layout.isCompact ? 'flex-start' : 'auto',
    },
    spotlightBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    spotlightTitle: {
      color: theme.colors.text,
      fontSize: layout.spotlightTitleSize,
      fontWeight: '800',
      lineHeight: layout.spotlightTitleLineHeight,
      marginBottom: 8,
    },
    spotlightMeta: {
      color: theme.colors.accentStrong,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    spotlightBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },
    spotlightFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    spotlightFooterText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    ctaGrid: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      gap: theme.spacing.sm,
    },
    primaryCta: {
      flex: layout.isCompact ? 0 : 1,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryCtaText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
    secondaryCta: {
      flex: layout.isCompact ? 0 : 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    secondaryCtaText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    todayStack: {
      flexDirection: layout.isTablet ? 'row' : 'column',
      alignItems: 'stretch',
      flexWrap: layout.isTablet ? 'wrap' : 'nowrap',
      gap: theme.spacing.md,
      marginBottom: layout.shellGap,
    },
    todayCardSlot: {
      flex: 1,
      width: layout.isTablet ? undefined : '100%',
    },
    verseRibbon: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      alignItems: 'stretch',
      gap: theme.spacing.sm,
    },
    verseRibbonOpen: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: layout.panelPadding,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    verseRibbonIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    verseRibbonCopy: {
      flex: 1,
    },
    verseRibbonText: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '700',
      marginTop: 6,
      marginBottom: 6,
    },
    verseRibbonReference: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    verseShareButton: {
      width: layout.isCompact ? '100%' : 54,
      minHeight: layout.isCompact ? 52 : undefined,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    devotionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: layout.panelPadding,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flex: 1,
    },
    devotionHeader: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    badgeText: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    devotionTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 26,
      marginBottom: 6,
    },
    devotionMeta: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    devotionBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    devotionCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: theme.spacing.md,
    },
    devotionCtaText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    sectionHeaderSolo: {
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      alignItems: layout.isCompact ? 'flex-start' : 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionHeaderCopy: {
      flex: 1,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 4,
    },
    sectionSupporting: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    sectionLink: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    featuredActionCard: {
      flexDirection: 'row',
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.xl,
      padding: layout.panelPadding,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    featuredActionIcon: {
      width: 50,
      height: 50,
      borderRadius: 18,
      backgroundColor: 'rgba(5, 7, 13, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featuredActionCopy: {
      flex: 1,
    },
    featuredActionEyebrow: {
      color: theme.colors.textOnAccent,
      opacity: 0.84,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    featuredActionTitle: {
      color: theme.colors.textOnAccent,
      fontSize: 19,
      fontWeight: '800',
      marginBottom: 4,
    },
    featuredActionBody: {
      color: theme.colors.textOnAccent,
      opacity: 0.82,
      fontSize: 13,
      lineHeight: 18,
    },
    secondaryActionRow: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      gap: theme.spacing.sm,
      marginBottom: layout.shellGap,
    },
    miniActionCard: {
      flex: layout.isCompact ? 0 : 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      ...theme.shadows.sm,
    },
    miniActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    miniActionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    miniActionTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'center',
    },
    sectionPanel: {
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radius.xl,
      padding: layout.panelPadding,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: layout.shellGap,
    },
    horizontalList: {
      gap: theme.spacing.md,
    },
    clipCard: {
      width: layout.clipCardWidth,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    clipThumb: {
      height: layout.isTablet ? 176 : 150,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    clipThumbImage: {
      borderRadius: theme.radius.md,
    },
    clipThumbOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 7, 13, 0.22)',
    },
    clipPlayOrb: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clipMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      gap: theme.spacing.sm,
    },
    clipBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    clipBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    clipDate: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    clipTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
      marginBottom: 6,
    },
    clipDescription: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    clipOpenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: theme.spacing.md,
    },
    clipOpenText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    listColumn: {
      gap: theme.spacing.md,
    },
    eventCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      ...theme.shadows.sm,
    },
    eventDateBadge: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventDateDay: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    eventDateMonth: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    eventContent: {
      flex: 1,
    },
    eventTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 4,
    },
    eventMeta: {
      color: theme.colors.accentStrong,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 6,
    },
    eventSummary: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyCard: {
      width: '100%',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}

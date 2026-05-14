import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import {
  formatLongDateLabel,
} from '../../shared/contentModel';
import {
  fetchDevotions,
  fetchUserProgress,
  fetchVerseOfDay,
  saveUserProgress,
} from '../services/api';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'completed', label: 'Completed' },
];

export default function DevotionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [devotions, setDevotions] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [verse, setVerse] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    if (!user) {
      setCompleted([]);
      return;
    }

    setProgressLoading(true);
    try {
      const progress = await fetchUserProgress();
      setCompleted(progress?.completedDevotions || []);
    } catch {
      setCompleted([]);
    } finally {
      setProgressLoading(false);
    }
  }, [user]);

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [devotionsPayload, versePayload] = await Promise.all([
        fetchDevotions(),
        fetchVerseOfDay(),
      ]);

      setDevotions(devotionsPayload || []);
      setVerse(versePayload || null);
    } catch {
      setError('Could not load devotions right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useFocusEffect(useCallback(() => {
    loadProgress();
  }, [loadProgress]));

  const handleComplete = async (devotionId) => {
    if (!user || completed.includes(devotionId)) return;

    const next = [...completed, devotionId];
    setCompleted(next);
    try {
      const progress = await saveUserProgress(next);
      setCompleted(progress?.completedDevotions || next);
    } catch {
      setCompleted(completed);
    }
  };

  const openDevotion = (devotion) => {
    navigation.navigate('DevotionDetail', {
      devotion,
      completedIds: completed,
    });
  };

  const featured = devotions[0] || null;
  const completedCount = completed.length;
  const totalCount = devotions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredDevotions = useMemo(() => {
    return devotions.filter((devotion) => {
      const isCompleted = completed.includes(devotion.id);
      if (filter === 'completed') return isCompleted;
      if (filter === 'unread') return !isCompleted;
      return true;
    });
  }, [completed, devotions, filter]);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Daily Devotions</Text>
              <Text style={styles.title}>Open the Word with calm focus, honest reflection, and room to respond.</Text>
              <Text style={styles.subtitle}>
                Read today&apos;s devotion, keep track of what you&apos;ve finished, and return to the ones you still need to sit with.
              </Text>
            </View>
            <View style={styles.progressBadge}>
              {progressLoading ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <>
                  <Text style={styles.progressBadgeValue}>{completedCount}</Text>
                  <Text style={styles.progressBadgeLabel}>Read</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{totalCount || 0}</Text>
          </View>

          {featured ? (
            <TouchableOpacity style={styles.todayCard} onPress={() => openDevotion(featured)} activeOpacity={0.92}>
              <View style={styles.todayHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Today&apos;s Devotion</Text>
                  <Text style={styles.todayReference}>{featured.reference}</Text>
                </View>
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>{completed.includes(featured.id) ? 'COMPLETED' : 'READ NOW'}</Text>
                </View>
              </View>

              <Text style={styles.todayTitle}>{featured.title}</Text>
              <Text style={styles.todayBody} numberOfLines={3}>{featured.body}</Text>

              <View style={styles.todayFooter}>
                <Text style={styles.todayDate}>{formatLongDateLabel(featured.publishedAt)}</Text>
                <View style={styles.todayCtaRow}>
                  <Text style={styles.todayCtaText}>Open devotion</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          <View style={styles.heroActionRow}>
            <TouchableOpacity style={styles.heroButton} onPress={() => featured ? openDevotion(featured) : navigation.navigate('Verse')} activeOpacity={0.9}>
              <Ionicons name="book-outline" size={18} color={theme.colors.textOnAccent} />
              <Text style={styles.heroButtonText}>{featured ? "Read today's devotion" : 'Open verse of the day'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondaryButton} onPress={() => navigation.navigate('Verse')} activeOpacity={0.9}>
              <Text style={styles.heroSecondaryButtonText}>Verse</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!user ? (
          <View style={styles.signInBanner}>
            <View style={styles.signInIcon}>
              <Ionicons name="person-circle-outline" size={20} color={theme.colors.accent} />
            </View>
            <View style={styles.signInCopy}>
              <Text style={styles.signInTitle}>Sign in to track your reading</Text>
              <Text style={styles.signInBody}>Your devotion progress is only synced when you&apos;re signed in.</Text>
            </View>
            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Profile')} activeOpacity={0.9}>
              <Text style={styles.signInButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {verse ? (
          <TouchableOpacity style={styles.verseCard} activeOpacity={0.92} onPress={() => navigation.navigate('Verse')}>
            <View style={styles.verseHeader}>
              <Text style={styles.verseLabel}>Today&apos;s Anchor</Text>
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.accent} />
            </View>
            <Text style={styles.verseText} numberOfLines={3}>{verse.text}</Text>
            <Text style={styles.verseReference}>{verse.reference}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Devotion Library</Text>
            <Text style={styles.sectionSupporting}>Open a devotion to read it fully, then mark it complete when you&apos;re done.</Text>
          </View>
          <Text style={styles.sectionCaption}>{completedCount} completed</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.9}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Loading devotions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load devotions</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadScreen} activeOpacity={0.9}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredDevotions.map((devotion) => {
              const isCompleted = completed.includes(devotion.id);
              return (
                <TouchableOpacity
                  key={devotion.id}
                  style={[styles.devotionCard, isCompleted && styles.devotionDone]}
                  activeOpacity={0.92}
                  onPress={() => openDevotion(devotion)}
                >
                  <View style={styles.devotionHeader}>
                    <View style={styles.devotionHeaderLeft}>
                      <View style={styles.referenceBadge}>
                        <Text style={styles.referenceBadgeText}>{devotion.reference}</Text>
                      </View>
                      <Text style={styles.devotionDate}>{formatLongDateLabel(devotion.publishedAt)}</Text>
                    </View>
                    {isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark" size={14} color={theme.colors.textOnAccent} />
                        <Text style={styles.completedText}>Done</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.devotionTitle}>{devotion.title}</Text>
                  <Text style={styles.devotionPreview} numberOfLines={2}>
                    {devotion.scriptureText || devotion.body}
                  </Text>

                  <View style={styles.devotionFooter}>
                    <View style={styles.openRow}>
                      <Text style={styles.openText}>Open devotion</Text>
                      <Ionicons name="arrow-forward" size={15} color={theme.colors.accent} />
                    </View>

                    {user && !isCompleted ? (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleComplete(devotion.id);
                        }}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.textOnAccent} />
                        <Text style={styles.completeButtonText}>Mark done</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredDevotions.length === 0 ? (
              devotions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No devotions published yet</Text>
                  <Text style={styles.emptyBody}>Use the admin panel to publish the first devotion with scripture, reflection, and prayer.</Text>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Nothing in this filter</Text>
                  <Text style={styles.emptyBody}>Switch filters to see unread or completed devotions again.</Text>
                </View>
              )
            ) : null}
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
    progressBadge: {
      width: 72,
      minHeight: 72,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    progressBadgeValue: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    progressBadgeLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
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
      fontSize: 13,
      fontWeight: '800',
    },
    todayCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    todayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    sectionEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: 4,
    },
    todayReference: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    todayPill: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    todayPillText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    todayTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
      marginBottom: theme.spacing.sm,
    },
    todayBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    todayFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    todayDate: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    todayCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    todayCtaText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
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
    verseCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    verseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    verseLabel: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    verseText: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 26,
      marginBottom: 8,
    },
    verseReference: {
      color: theme.colors.textSecondary,
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
    list: {
      gap: theme.spacing.md,
    },
    devotionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    devotionDone: {
      borderColor: 'rgba(44, 182, 125, 0.35)',
      backgroundColor: theme.colors.surfaceRaised,
    },
    devotionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    devotionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      flex: 1,
    },
    referenceBadge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    referenceBadgeText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    devotionDate: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.success,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    completedText: {
      color: theme.colors.textOnAccent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    devotionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 24,
      marginBottom: 8,
    },
    devotionPreview: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    devotionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
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
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    completeButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 12,
      fontWeight: '800',
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

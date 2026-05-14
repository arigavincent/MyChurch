import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { formatLongDateLabel } from '../../shared/contentModel';
import { fetchUserProgress, saveUserProgress } from '../services/api';

function buildReflectionPrompt(devotion) {
  if (devotion.reference) {
    return `What is ${devotion.reference} calling you to believe, release, or obey today? Sit with that before you move on.`;
  }
  return 'What is the Holy Spirit drawing your attention to in this devotion today? Sit with that before you move on.';
}

export default function DevotionDetailScreen({ route, navigation }) {
  const { devotion, completedIds: initialCompletedIds = [] } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [completedIds, setCompletedIds] = useState(initialCompletedIds);
  const [completing, setCompleting] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Devotion' });
  }, [navigation]);

  useEffect(() => {
    if (!user) {
      setCompletedIds(initialCompletedIds);
      return;
    }

    setProgressLoading(true);
    fetchUserProgress()
      .then((progress) => setCompletedIds(progress?.completedDevotions || initialCompletedIds))
      .catch(() => setCompletedIds(initialCompletedIds))
      .finally(() => setProgressLoading(false));
  }, [initialCompletedIds, user]);

  const isCompleted = useMemo(() => completedIds.includes(devotion.id), [completedIds, devotion.id]);

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in from Profile if you want devotion completion to sync across sessions.');
      return;
    }

    if (isCompleted) {
      return;
    }

    const next = [...completedIds, devotion.id];
    setCompleting(true);
    setCompletedIds(next);
    try {
      const progress = await saveUserProgress(next);
      setCompletedIds(progress?.completedDevotions || next);
    } catch {
      setCompletedIds(completedIds);
      Alert.alert('Could not save progress', 'Your devotion was opened, but completion could not be synced right now.');
    } finally {
      setCompleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: devotion.title,
        message: `${devotion.title}\n${devotion.reference}\n\n${devotion.scriptureText}\n\n${devotion.prayer}`,
      });
    } catch {
      Alert.alert('Share Failed', 'Could not share this devotion right now.');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{isCompleted ? 'COMPLETED' : 'DEVOTION'}</Text>
            </View>
            <Text style={styles.dateLabel}>{formatLongDateLabel(devotion.publishedAt)}</Text>
          </View>

          <Text style={styles.title}>{devotion.title}</Text>
          <Text style={styles.reference}>{devotion.reference}</Text>
          <Text style={styles.heroBody}>
            Read slowly, reflect honestly, and let this moment stay with you longer than the scroll.
          </Text>
        </View>

        <View style={styles.scriptureCard}>
          <Text style={styles.sectionEyebrow}>Scripture</Text>
          <Text style={styles.scriptureText}>{devotion.scriptureText}</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionEyebrow}>Reflection</Text>
          <Text style={styles.bodyText}>{devotion.body}</Text>
        </View>

        <View style={styles.prayerCard}>
          <Text style={styles.sectionEyebrow}>Prayer</Text>
          <Text style={styles.bodyText}>{devotion.prayer}</Text>
        </View>

        <View style={styles.promptCard}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.promptTitle}>Reflection Prompt</Text>
          <Text style={styles.promptBody}>{buildReflectionPrompt(devotion)}</Text>
        </View>

        {!user ? (
          <View style={styles.signInCard}>
            <Text style={styles.signInTitle}>Want to keep track of your reading?</Text>
            <Text style={styles.signInBody}>Sign in from Profile and your completed devotions will stay synced.</Text>
            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Profile')} activeOpacity={0.9}>
              <Text style={styles.signInButtonText}>Open Profile</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, isCompleted && styles.primaryButtonDone]}
            onPress={handleComplete}
            disabled={completing || isCompleted || progressLoading}
            activeOpacity={0.9}
          >
            {completing || progressLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
            ) : (
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color={theme.colors.textOnAccent}
              />
            )}
            <Text style={styles.primaryButtonText}>
              {isCompleted ? 'Completed' : completing ? 'Saving...' : 'Mark complete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare} activeOpacity={0.9}>
            <Ionicons name="share-social-outline" size={18} color={theme.colors.text} />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingBottom: theme.spacing.xxl,
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
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    badge: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
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
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
      marginBottom: theme.spacing.sm,
    },
    reference: {
      color: theme.colors.accentStrong,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: theme.spacing.md,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },
    scriptureCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    sectionEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: theme.spacing.sm,
    },
    scriptureText: {
      color: theme.colors.text,
      fontSize: 22,
      lineHeight: 34,
      fontWeight: '700',
    },
    contentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    prayerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    bodyText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 24,
    },
    promptCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
    },
    promptTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: theme.spacing.sm,
      marginBottom: 6,
    },
    promptBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    signInCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    signInTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 6,
    },
    signInBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    signInButton: {
      alignSelf: 'flex-start',
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
    actionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonDone: {
      opacity: 0.86,
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
      paddingVertical: 15,
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
  });
}

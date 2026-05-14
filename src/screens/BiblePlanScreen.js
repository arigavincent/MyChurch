import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { fetchBiblePlan, fetchReadingProgress, saveReadingProgress } from '../services/api';

export default function BiblePlanScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [plans, setPlans] = useState([]);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    fetchBiblePlan().then(setPlans).catch(() => {});
    if (user) {
      fetchReadingProgress()
        .then((progress) => setCompleted(progress?.completed || {}))
        .catch(() => setCompleted({}));
    } else {
      setCompleted({});
    }
  }, [user]);

  const toggleDay = async (day) => {
    if (!user) return;
    const next = { ...completed, [day]: !completed[day] };
    setCompleted(next);
    try {
      const progress = await saveReadingProgress(next);
      setCompleted(progress?.completed || next);
    } catch {
      setCompleted(completed);
    }
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalCount = Math.max(plans.length, 1);
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Bible Plan</Text>
          <Text style={styles.title}>A guided reading rhythm that stays visible, trackable, and uncomplicated.</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{plans.length || 0}</Text>
          </View>
          {!user && (
            <Text style={styles.heroHint}>Sign in from Profile to sync your reading progress.</Text>
          )}
        </View>

        <View style={styles.list}>
          {plans.map((plan) => {
            const done = !!completed[plan.day];
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.dayCard, done && styles.dayCardDone]}
                onPress={() => toggleDay(plan.day)}
                disabled={!user}
                activeOpacity={0.92}
              >
                <View style={[styles.checkWrap, done && styles.checkWrapDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={16} color={theme.colors.textOnAccent} />
                  ) : (
                    <Text style={styles.dayNumber}>{plan.day}</Text>
                  )}
                </View>
                <View style={styles.dayText}>
                  <Text style={styles.dayTitle}>Day {plan.day}: {plan.title}</Text>
                  <Text style={styles.dayReference}>{plan.reference}</Text>
                  {plan.summary ? <Text style={styles.daySummary}>{plan.summary}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}

          {plans.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No reading plan published yet</Text>
              <Text style={styles.emptyBody}>Once the first plan is added, each day will show here with a clean completion flow.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    heroCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
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
      marginBottom: theme.spacing.lg,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
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
    heroHint: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: theme.spacing.md,
    },
    list: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    dayCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dayCardDone: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: 'rgba(44, 182, 125, 0.35)',
    },
    checkWrap: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    checkWrapDone: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    dayNumber: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    dayText: {
      flex: 1,
    },
    dayTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 4,
    },
    dayReference: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 6,
    },
    daySummary: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
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

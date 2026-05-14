import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import LiveStreamSection from '../components/LiveStreamSection';
import { useTheme } from '../hooks/ThemeContext';
import { formatEventDateLabel, formatEventTimeLabel } from '../../shared/contentModel';
import { fetchEvents } from '../services/api';

export default function EventsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then(setEvents).catch(() => {});
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LiveStreamSection />

        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Gather Together</Text>
          <Text style={styles.title}>Services, community moments, and special gatherings.</Text>
          <Text style={styles.subtitle}>Every event uses a clean schedule model now, so date and time stay consistent across admin and mobile.</Text>
        </View>

        <View style={styles.list}>
          {events.map((event) => (
            <TouchableOpacity key={event.id} style={styles.card} activeOpacity={0.92}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{formatEventDateLabel(event.startsAt).split(' ')[1]}</Text>
                <Text style={styles.dateMonth}>{formatEventDateLabel(event.startsAt).split(' ')[0]}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{event.category}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.accent} />
                  <Text style={styles.metaText}>{formatEventTimeLabel(event.startsAt)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.accent} />
                  <Text style={styles.metaText}>{event.location}</Text>
                </View>
                <Text style={styles.summary} numberOfLines={3}>{event.summary}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {events.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No upcoming events yet</Text>
              <Text style={styles.emptyBody}>Publish the next service or conference from the admin panel and it will show here automatically.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    headerBlock: {
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
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    list: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    card: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'flex-start',
    },
    dateBadge: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateDay: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    dateMonth: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    cardBody: {
      flex: 1,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    cardTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    categoryChip: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    categoryText: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    metaText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    summary: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: theme.spacing.sm,
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

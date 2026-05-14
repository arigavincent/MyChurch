import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { fetchGroups } from '../services/api';

export default function GroupsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchGroups().then(setGroups).catch(() => {});
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Community Groups</Text>
          <Text style={styles.title}>Smaller circles for care, prayer, study, and steady growth.</Text>
          <Text style={styles.subtitle}>Use this space to move people from content consumption into actual community.</Text>
        </View>

        <View style={styles.list}>
          {groups.map((group) => (
            <View key={group.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people-outline" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{group.name}</Text>
                  <Text style={styles.leader}>Led by {group.leader}</Text>
                </View>
              </View>
              <Text style={styles.description}>{group.description}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.metaText}>{group.meetingTimeLabel}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.metaText}>{group.location}</Text>
              </View>
              {group.contactPhone ? (
                <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(`tel:${group.contactPhone}`)} activeOpacity={0.9}>
                  <Ionicons name="call-outline" size={16} color={theme.colors.textOnAccent} />
                  <Text style={styles.contactButtonText}>Contact leader</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {groups.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No groups published yet</Text>
              <Text style={styles.emptyBody}>Add the first group from the admin panel so people can discover where they belong.</Text>
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
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    name: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 2,
    },
    leader: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: theme.spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    metaText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    contactButton: {
      marginTop: theme.spacing.md,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: theme.radius.pill,
    },
    contactButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 13,
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

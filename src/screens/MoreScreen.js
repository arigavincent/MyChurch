import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';

const menuItems = [
  {
    title: 'Events',
    description: 'Services, conferences, youth nights, and church-wide gatherings.',
    icon: 'calendar-outline',
    route: 'Events',
  },
  {
    title: 'Prayer Wall',
    description: 'Carry each other in prayer and share encouragement in real time.',
    icon: 'heart-outline',
    route: 'PrayerWall',
  },
  {
    title: 'Bible Plan',
    description: 'Stay consistent with guided reading and track your progress.',
    icon: 'layers-outline',
    route: 'BiblePlan',
  },
  {
    title: 'Groups',
    description: 'Find a smaller circle for care, growth, and accountability.',
    icon: 'people-outline',
    route: 'Groups',
  },
  {
    title: 'Testimonies',
    description: 'See and share stories of answered prayer, provision, and changed lives.',
    icon: 'sparkles-outline',
    route: 'Testimonies',
  },
  {
    title: 'Giving',
    description: 'Support the mission and keep a secure history of your giving.',
    icon: 'wallet-outline',
    route: 'Giving',
  },
  {
    title: 'Connect',
    description: 'Contact details, social channels, and your next step into community.',
    icon: 'navigate-outline',
    route: 'Connect',
  },
];

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDark, toggleMode } = useTheme();
  const styles = createStyles(theme);
  const items = [
    ...menuItems,
    user
      ? {
          title: 'Settings',
          description: 'Manage your account, appearance, and private history from one place.',
          icon: 'settings-outline',
          route: 'Settings',
        }
      : {
          title: 'Profile',
          description: 'Sign in, track your private notes, and manage your app preferences.',
          icon: 'person-circle-outline',
          route: 'Profile',
        },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Explore More</Text>
          <Text style={styles.title}>Build a daily rhythm, not just a Sunday touchpoint.</Text>
          <Text style={styles.subtitle}>
            The rest of the app is organized here so sermons, devotions, clips, and community tools stay easy to reach.
          </Text>
        </View>

        <TouchableOpacity style={styles.appearanceCard} activeOpacity={0.92} onPress={toggleMode}>
          <View style={styles.appearanceIcon}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={theme.colors.accent} />
          </View>
          <View style={styles.appearanceCopy}>
            <Text style={styles.appearanceTitle}>App Appearance</Text>
            <Text style={styles.appearanceBody}>
              {isDark ? 'Currently in midnight mode. Tap to switch to daylight for brighter daytime reading.' : 'Currently in daylight mode. Tap to switch back to midnight for a darker, more cinematic presentation.'}
            </Text>
          </View>
          <Text style={styles.appearanceMode}>{isDark ? 'Midnight' : 'Daylight'}</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={theme.colors.accent} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>Open</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
              </View>
            </TouchableOpacity>
          ))}
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
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      ...theme.shadows.lg,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
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
    grid: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    appearanceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      ...theme.shadows.sm,
    },
    appearanceIcon: {
      width: 50,
      height: 50,
      borderRadius: 18,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appearanceCopy: {
      flex: 1,
    },
    appearanceTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 4,
    },
    appearanceBody: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    appearanceMode: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    cardDescription: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    ctaRow: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ctaText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}

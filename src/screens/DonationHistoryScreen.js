import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { fetchDonations } from '../services/api';

const statusColors = {
  completed: '#2CB67D',
  pending: '#F4B942',
  failed: '#E35D6A',
};

export default function DonationHistoryScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    if (!user) {
      setDonations([]);
      setLoading(false);
      return undefined;
    }

    fetchDonations()
      .then((items) => setDonations(items))
      .finally(() => setLoading(false));
    return undefined;
  }, [user]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!user) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={44} color={theme.colors.accent} />
          <Text style={styles.emptyTitle}>Sign in first</Text>
          <Text style={styles.emptyBody}>Giving history is attached to your signed-in account and only visible to you.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={donations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Your Giving History</Text>
            <Text style={styles.headerSubtitle}>Every record here is owner-scoped and protected by the new rules.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = statusColors[item.status] || theme.colors.textMuted;
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>KES {item.amount?.toLocaleString?.() || item.amount}</Text>
                  <Text style={styles.meta}>{item.method?.toUpperCase()} • {item.frequency === 'monthly' ? 'Monthly' : 'One-time'}</Text>
                  <Text style={styles.meta}>{item.phone}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={44} color={theme.colors.accent} />
            <Text style={styles.emptyTitle}>No giving records yet</Text>
            <Text style={styles.emptyBody}>Start a donation from the Giving screen and the pending record will appear here.</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.md,
    },
    headerCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      marginBottom: theme.spacing.lg,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    amount: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 2,
    },
    meta: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    statusBadge: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl,
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
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}

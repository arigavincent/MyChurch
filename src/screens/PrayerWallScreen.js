import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import AddPrayerModal from '../components/AddPrayerModal';
import PrayerRequestCard from '../components/PrayerRequestCard';
import { useTheme } from '../hooks/ThemeContext';
import { fetchPrayerRequests } from '../services/api';

export default function PrayerWallScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setRequests(await fetchPrayerRequests());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests().catch(() => setLoading(false));
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Prayer Wall</Text>
          <Text style={styles.title}>Real requests, visible support, and space for people to carry one another.</Text>
          <Text style={styles.subtitle}>Open enough to serve the church body, structured enough to stay stable and respectful.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PrayerRequestCard request={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={loadRequests} tintColor={theme.colors.accent} colors={[theme.colors.accent]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={42} color={theme.colors.accent} />
                <Text style={styles.emptyTitle}>No prayer requests yet</Text>
                <Text style={styles.emptyBody}>Be the first to share a need and invite the church to stand with you.</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
          <Ionicons name="add" size={20} color={theme.colors.textOnAccent} />
          <Text style={styles.fabText}>Add Prayer</Text>
        </TouchableOpacity>
      </View>

      <AddPrayerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={loadRequests}
      />
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
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
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      gap: theme.spacing.md,
      paddingBottom: 110,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: 8,
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
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 18,
      paddingVertical: 14,
      ...theme.shadows.lg,
    },
    fabText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}

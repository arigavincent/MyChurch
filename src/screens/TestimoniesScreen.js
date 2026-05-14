import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { relativeTimeFromDate } from '../../shared/contentModel';
import { createTestimony, fetchTestimonies } from '../services/api';

export default function TestimoniesScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [testimonies, setTestimonies] = useState([]);
  const [name, setName] = useState('');
  const [testimony, setTestimony] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTestimonies = async () => {
    setTestimonies(await fetchTestimonies());
  };

  useEffect(() => {
    loadTestimonies().catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !testimony.trim()) {
      Alert.alert('Missing details', 'Add your name and testimony before sharing.');
      return;
    }

    setSubmitting(true);
    try {
      await createTestimony({
        name: name.trim(),
        testimony: testimony.trim(),
      });
      await loadTestimonies();
      setName('');
      setTestimony('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Testimonies</Text>
          <Text style={styles.title}>Let the church see evidence of grace, not just announcements and content.</Text>
          <Text style={styles.subtitle}>Stories of healing, provision, restoration, and answered prayer give the app a human pulse.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Share a testimony</Text>
          <TextInput
            style={styles.input}
            placeholder='Your name'
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder='What has God done in your life?'
            placeholderTextColor={theme.colors.textMuted}
            value={testimony}
            onChangeText={setTestimony}
            multiline
            textAlignVertical='top'
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting} activeOpacity={0.9}>
            <Ionicons name='sparkles-outline' size={18} color={theme.colors.textOnAccent} />
            <Text style={styles.primaryButtonText}>{submitting ? 'Sharing...' : 'Share testimony'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {testimonies.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Ionicons name='person-outline' size={18} color={theme.colors.accent} />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.timestamp}>{relativeTimeFromDate(item.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.body}>{item.testimony}</Text>
            </View>
          ))}

          {testimonies.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name='sparkles-outline' size={36} color={theme.colors.accent} />
              <Text style={styles.emptyTitle}>No testimonies shared yet</Text>
              <Text style={styles.emptyBody}>Be the first person to mark God’s faithfulness here.</Text>
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
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontSize: 15,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: theme.spacing.md,
    },
    textarea: {
      minHeight: 140,
    },
    primaryButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
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
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardMeta: {
      flex: 1,
    },
    name: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 3,
    },
    timestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    body: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
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
  });
}

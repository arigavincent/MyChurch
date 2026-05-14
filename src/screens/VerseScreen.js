import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { fetchVerseOfDay } from '../services/api';

const fallbackVerse = {
  text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
  reference: 'Jeremiah 29:11',
  theme: 'Hope',
};

export default function VerseScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [verse, setVerse] = useState(fallbackVerse);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerseOfDay()
      .then((payload) => {
        if (payload) {
          setVerse({ ...fallbackVerse, ...payload });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    Share.share({
      message: `${verse.text}\n\n— ${verse.reference}\n\nTheme: ${verse.theme}`,
    }).catch(() => {});
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={16} color={theme.colors.accent} />
            <Text style={styles.badgeText}>Verse of the Day</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="large" style={{ marginVertical: theme.spacing.xl }} />
          ) : (
            <>
              <Text style={styles.verseText}>{verse.text}</Text>
              <Text style={styles.reference}>{verse.reference}</Text>
              <Text style={styles.themeLabel}>{verse.theme || 'Daily focus'}</Text>
            </>
          )}
        </View>

        <View style={styles.reflectionCard}>
          <Text style={styles.reflectionTitle}>Reflection Prompt</Text>
          <Text style={styles.reflectionBody}>
            Where does this scripture confront fear, invite trust, or call you into action today? Pause for two minutes and answer that honestly.
          </Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.9}>
          <Ionicons name="share-social-outline" size={18} color={theme.colors.textOnAccent} />
          <Text style={styles.shareButtonText}>Share this verse</Text>
        </TouchableOpacity>
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
    },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: theme.spacing.lg,
    },
    badgeText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    verseText: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 36,
      marginBottom: theme.spacing.md,
    },
    reference: {
      color: theme.colors.accent,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    themeLabel: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    reflectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    reflectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 8,
    },
    reflectionBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 16,
    },
    shareButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}

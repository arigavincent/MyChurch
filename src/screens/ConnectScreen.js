import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { fetchAppConfig } from '../services/api';
import { resolveChurchName } from '../branding';

export default function ConnectScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchAppConfig().then(setConfig).catch(() => {});
  }, []);

  const contactRows = [
    {
      icon: 'location-outline',
      label: 'Address',
      value: config?.address || 'Address not configured yet',
    },
    {
      icon: 'call-outline',
      label: 'Phone',
      value: config?.primaryContactPhone || 'Phone not configured yet',
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: config?.primaryContactEmail || 'Email not configured yet',
    },
  ];

  const socialRows = [
    { icon: 'logo-youtube', label: 'YouTube', url: config?.youtubeUrl },
    { icon: 'logo-instagram', label: 'Instagram', url: config?.instagramUrl },
    { icon: 'logo-facebook', label: 'Facebook', url: config?.facebookUrl },
    { icon: 'logo-whatsapp', label: 'WhatsApp', url: config?.whatsappUrl },
  ].filter((item) => item.url);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Connect</Text>
          <Text style={styles.title}>{resolveChurchName(config?.churchName)}</Text>
          <Text style={styles.subtitle}>{config?.tagline || 'Loving God. Loving People. Making disciples with clarity and consistency.'}</Text>
        </View>

        <View style={styles.list}>
          {contactRows.map((row) => (
            <View key={row.label} style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={row.icon} size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{row.label}</Text>
                <Text style={styles.cardValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Social and Streaming</Text>
        <View style={styles.socialGrid}>
          {socialRows.map((row) => (
            <TouchableOpacity key={row.label} style={styles.socialCard} onPress={() => Linking.openURL(row.url)} activeOpacity={0.9}>
              <Ionicons name={row.icon} size={22} color={theme.colors.accent} />
              <Text style={styles.socialLabel}>{row.label}</Text>
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
      fontSize: 30,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    list: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: {
      flex: 1,
    },
    cardLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 3,
    },
    cardValue: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '700',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: theme.spacing.md,
    },
    socialGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    socialCard: {
      width: '47%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: 8,
    },
    socialLabel: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}

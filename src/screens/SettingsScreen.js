import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';

const BRAND_MARK = require('../../assets/icon.png');

function getProviderLabel(user) {
  if (user?.authProvider === 'hybrid') return 'Email + Google';
  if (user?.authProvider === 'google' || user?.googleSub) return 'Google';
  return 'Email';
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, updateProfile, logout } = useAuth();
  const { theme, isDark, toggleMode } = useTheme();
  const styles = createStyles(theme);

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    setSaving(true);
    setStatus('');

    try {
      await updateProfile({ name: trimmedName });
      setStatus('Profile updated.');
    } catch (error) {
      Alert.alert('Could not save profile', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    navigation.navigate('Home');
    await logout();
  };

  if (!user) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name='settings-outline' size={26} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Settings unlock after sign-in</Text>
          <Text style={styles.emptyBody}>
            Sign in first so your profile, giving history, and private progress stay tied to your account.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.emptyButtonText}>Open profile</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.identityRow}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Image source={BRAND_MARK} style={styles.avatarImage} resizeMode='cover' />
              )}
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>Settings</Text>
                <Text style={styles.heroTitle}>{user.name || 'Church family member'}</Text>
                <Text style={styles.heroSubtitle}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.providerBadge}>
              <Text style={styles.providerBadgeText}>{getProviderLabel(user)}</Text>
            </View>
          </View>

          <Text style={styles.heroBody}>
            Keep your account details clean, switch appearance quickly, and stay close to your private giving and reading activity.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Account</Text>
          <Text style={styles.panelBody}>Use the name that should appear with your notes and devotion progress.</Text>

          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='Your name'
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCapitalize='words'
            returnKeyType='done'
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyFieldText}>{user.email}</Text>
          </View>

          {status ? <Text style={styles.successText}>{status}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name='save-outline' size={18} color={theme.colors.textOnAccent} />
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save profile'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Experience</Text>

          <TouchableOpacity style={styles.row} activeOpacity={0.9} onPress={toggleMode}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>Appearance</Text>
                <Text style={styles.rowBody}>
                  {isDark ? 'Midnight mode is active. Switch if you want brighter daytime reading.' : 'Daylight mode is active. Switch if you want the darker evening presentation.'}
                </Text>
              </View>
            </View>
            <Text style={styles.rowValue}>{isDark ? 'Midnight' : 'Daylight'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Private Activity</Text>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DonationHistory')}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name='wallet-outline' size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>Giving history</Text>
                <Text style={styles.rowBody}>Review your past giving and payment results tied to this account.</Text>
              </View>
            </View>
            <Ionicons name='arrow-forward' size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.9} onPress={handleSignOut}>
          <Ionicons name='log-out-outline' size={18} color={theme.colors.danger} />
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    heroCard: {
      backgroundColor: theme.colors.hero,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      ...theme.shadows.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    identityRow: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    avatarImage: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceMuted,
    },
    avatarFallback: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: theme.colors.accent,
      fontSize: 20,
      fontWeight: '800',
    },
    heroCopy: {
      flex: 1,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    heroTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    providerBadge: {
      backgroundColor: theme.colors.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
    },
    providerBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    panel: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
      ...theme.shadows.sm,
    },
    panelTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    panelBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.9,
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
    },
    readonlyField: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 15,
    },
    readonlyFieldText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: '700',
    },
    successText: {
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: '700',
    },
    primaryButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    rowLeft: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rowIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowCopy: {
      flex: 1,
    },
    rowTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    rowBody: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    rowValue: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    signOutButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: theme.spacing.xl,
    },
    signOutButtonText: {
      color: theme.colors.danger,
      fontSize: 15,
      fontWeight: '800',
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptyBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
    emptyButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}

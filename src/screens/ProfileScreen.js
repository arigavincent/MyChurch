import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_SCOPES = ['openid', 'profile', 'email'];
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};
const BRAND_MARK = require('../../assets/icon.png');
const GOOGLE_SIGN_IN_ENABLED = process.env.EXPO_PUBLIC_ENABLE_GOOGLE_SIGN_IN === 'true';

function getActiveGoogleClientId() {
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
}

function getProviderLabel(user) {
  if (user?.authProvider === 'hybrid') return 'Email + Google';
  if (user?.authProvider === 'google' || user?.googleSub) return 'Google';
  return 'Email';
}

export default function ProfileScreen({ navigation }) {
  const { user, login, register, loginWithGoogle, logout, loading } = useAuth();
  const { theme, isDark, toggleMode } = useTheme();
  const styles = createStyles(theme);

  const [mode, setMode] = useState('signin');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleNonce] = useState(() => Math.random().toString(36).slice(2));

  const googleClientId = GOOGLE_SIGN_IN_ENABLED ? getActiveGoogleClientId() : '';
  const googleConfigured = GOOGLE_SIGN_IN_ENABLED && !!googleClientId;
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'shekinahsonsglobal',
    path: 'auth/google',
  });

  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId || 'missing-google-client-id',
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: GOOGLE_SCOPES,
      usePKCE: false,
      extraParams: {
        nonce: googleNonce,
      },
    },
    googleDiscovery
  );

  const googleUnavailableReason = Constants.appOwnership === 'expo'
    ? 'Google sign-in works in a development build or APK, not inside Expo Go.'
    : !googleConfigured
      ? 'Add your Google client IDs in .env before using Google sign-in.'
      : '';

  useEffect(() => {
    if (googleResponse?.type === 'cancel' || googleResponse?.type === 'dismiss') {
      setGoogleSubmitting(false);
      return;
    }

    if (googleResponse?.type === 'error') {
      setGoogleSubmitting(false);
      setMessage(googleResponse.error?.message || 'Google sign-in could not be completed.');
      return;
    }

    if (googleResponse?.type !== 'success') {
      return;
    }

    const idToken = googleResponse.params?.id_token || googleResponse.authentication?.idToken;
    if (!idToken) {
      setGoogleSubmitting(false);
      setMessage('Google sign-in returned without an ID token.');
      return;
    }

    loginWithGoogle(idToken)
      .then(() => {
        setMessage('');
      })
      .catch((error) => {
        setMessage(error.message);
      })
      .finally(() => {
        setGoogleSubmitting(false);
      });
  }, [googleResponse, loginWithGoogle]);

  const resetMessage = () => setMessage('');

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      setMessage('Email and password are required.');
      return;
    }

    if (mode === 'register' && !trimmedName) {
      setMessage('Add your name before creating an account.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setMessage('Use at least 6 characters for your password.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      if (mode === 'register') {
        await register(trimmedEmail, password, trimmedName);
      } else {
        await login(trimmedEmail, password);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleUnavailableReason) {
      setMessage(googleUnavailableReason);
      return;
    }

    if (!googleRequest) {
      setMessage('Google sign-in is still loading. Try again in a moment.');
      return;
    }

    setGoogleSubmitting(true);
    setMessage('');
    await promptGoogleAsync();
  };

  const handleSignOut = async () => {
    navigation.navigate('Home');
    await logout();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size='large' color={theme.colors.accent} />
        </View>
      </ScreenWrapper>
    );
  }

  if (user) {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.accountCard}>
            <View style={styles.brandRow}>
              <Image source={BRAND_MARK} style={styles.brandMark} resizeMode='cover' />
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>Shekinah Sons Global</Text>
                <Text style={styles.brandCaption}>Your private church account is now active on this device.</Text>
              </View>
            </View>

            <View style={styles.accountBadgeRow}>
              <View style={styles.accountBadge}>
                <Ionicons name='shield-checkmark-outline' size={20} color={theme.colors.accent} />
              </View>
              <Text style={styles.accountBadgeText}>{getProviderLabel(user)}</Text>
            </View>

            <Text style={styles.authEyebrow}>Account Ready</Text>
            <Text style={styles.authTitle}>{user.name || 'Signed in and synced.'}</Text>
            <Text style={styles.accountBody}>
              Your notes, devotion progress, and giving history are now connected to {user.email}.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.9}
            >
              <Ionicons name='settings-outline' size={18} color={theme.colors.textOnAccent} />
              <Text style={styles.primaryButtonText}>Open settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut} activeOpacity={0.9}>
              <Ionicons name='log-out-outline' size={18} color={theme.colors.danger} />
              <Text style={styles.secondaryButtonDangerText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <View style={styles.brandRow}>
            <Image source={BRAND_MARK} style={styles.brandMark} resizeMode='cover' />
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>Shekinah Sons Global</Text>
              <Text style={styles.brandCaption}>Secure sign-in for your private progress, notes, and giving history.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.appearanceRow} onPress={toggleMode} activeOpacity={0.9}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={theme.colors.accent} />
              <Text style={styles.rowLabel}>App Theme</Text>
            </View>
            <Text style={styles.rowValue}>{isDark ? 'Midnight' : 'Daylight'}</Text>
          </TouchableOpacity>

          <Text style={styles.authEyebrow}>Profile and Private Features</Text>
          <Text style={styles.authTitle}>Welcome in. Save your progress, notes, and giving history with care.</Text>
          <Text style={styles.authBody}>
            Start with your email account first. Google stays available as an optional shortcut after the main account flow is working cleanly.
          </Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'signin' && styles.modeButtonActive]}
              activeOpacity={0.9}
              onPress={() => {
                setMode('signin');
                resetMessage();
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'signin' && styles.modeButtonTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
              activeOpacity={0.9}
              onPress={() => {
                setMode('register');
                resetMessage();
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {message ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          {mode === 'register' ? (
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                resetMessage();
              }}
              placeholder='Full name'
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize='words'
              style={styles.input}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              resetMessage();
            }}
            placeholder='Email'
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='email-address'
            autoComplete='email'
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              resetMessage();
            }}
            placeholder='Password'
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            autoCapitalize='none'
            autoComplete={mode === 'register' ? 'new-password' : 'password'}
            style={styles.input}
          />

          {mode === 'register' ? (
            <TextInput
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                resetMessage();
              }}
              placeholder='Confirm password'
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              autoCapitalize='none'
              autoComplete='new-password'
              style={styles.input}
            />
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          {GOOGLE_SIGN_IN_ENABLED ? (
            <View style={styles.secondaryAuthBlock}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>optional later</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, googleUnavailableReason && styles.googleButtonDisabled]}
                activeOpacity={0.9}
                onPress={handleGoogleSignIn}
                disabled={googleSubmitting}
              >
                <Ionicons name='logo-google' size={18} color={theme.colors.text} />
                <Text style={styles.googleButtonText}>{googleSubmitting ? 'Connecting...' : 'Continue with Google'}</Text>
              </TouchableOpacity>

              <Text style={styles.googleHelpText}>
                {googleUnavailableReason || 'Google can still be connected here after email auth is in place.'}
              </Text>
            </View>
          ) : null}

          <Text style={styles.footnote}>
            {mode === 'register'
              ? 'Your account is created directly on the church backend and stays available across devices.'
              : 'Use the same account on your phone and future APK builds to keep your private data synced.'}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: theme.spacing.xl,
    },
    authCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.lg,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    brandMark: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceMuted,
    },
    brandCopy: {
      flex: 1,
    },
    brandName: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 4,
    },
    brandCaption: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    accountCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
      ...theme.shadows.lg,
    },
    appearanceRow: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rowLabel: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    rowValue: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    authEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: theme.spacing.sm,
    },
    authTitle: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 33,
      marginBottom: theme.spacing.sm,
    },
    authBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: theme.spacing.lg,
    },
    modeSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      padding: 4,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modeButton: {
      flex: 1,
      borderRadius: theme.radius.sm,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeButtonActive: {
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    modeButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    modeButtonTextActive: {
      color: theme.colors.text,
      fontWeight: '800',
    },
    googleButton: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    googleButtonDisabled: {
      opacity: 0.72,
    },
    googleButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    googleHelpText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: theme.spacing.sm,
    },
    secondaryAuthBlock: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    messageCard: {
      backgroundColor: 'rgba(227, 93, 106, 0.14)',
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: 'rgba(227, 93, 106, 0.22)',
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: theme.spacing.md,
    },
    messageText: {
      color: theme.colors.danger,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '700',
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
    primaryButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: theme.spacing.xs,
    },
    primaryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    secondaryButtonDangerText: {
      color: theme.colors.danger,
      fontSize: 15,
      fontWeight: '800',
    },
    footnote: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    accountBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    accountBadge: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountBadgeText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    accountBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: theme.spacing.sm,
    },
  });
}

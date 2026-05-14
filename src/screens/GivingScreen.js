import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/AuthContext';
import { initiateSTKPush } from '../services/mpesa';
import { createDonation } from '../services/api';
import { normalizePhone } from '../../shared/contentModel';

const presets = [100, 250, 500, 1000];

export default function GivingScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const [amount, setAmount] = useState('500');
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState('one-time');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const finalAmount = parseInt(customAmount || amount, 10);

  const handleGive = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in from Profile before giving so your donation history stays attached to your account.');
      return;
    }

    if (!finalAmount || finalAmount < 10) {
      Alert.alert('Invalid amount', 'Enter at least KES 10.');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 12) {
      Alert.alert('Phone required', 'Enter a valid M-Pesa number like 254712345678.');
      return;
    }

    setProcessing(true);
    try {
      const response = await initiateSTKPush({
        phone: normalizedPhone,
        amount: finalAmount,
        frequency,
        ownerId: user.uid,
      });

      await createDonation({
        amount: finalAmount,
        method: 'mpesa',
        frequency,
        status: 'pending',
        phone: normalizedPhone,
        checkoutRequestId: response.checkoutRequestId || '',
      });

      Alert.alert('STK Push sent', 'Check your phone and complete the payment with your M-Pesa PIN.');
    } catch (error) {
      Alert.alert('Payment failed', error.message || 'Could not start the M-Pesa request.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Giving</Text>
          <Text style={styles.title}>Secure, simple giving with history attached to your account.</Text>
          <Text style={styles.subtitle}>M-Pesa initiation now runs through the backend, while your donation history stays locked to your signed-in user.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select amount</Text>
          <View style={styles.presetGrid}>
            {presets.map((value) => {
              const active = !customAmount && amount === String(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => {
                    setAmount(String(value));
                    setCustomAmount('');
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>KES {value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder="Or enter a custom amount"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.frequencyRow}>
            {['one-time', 'monthly'].map((value) => {
              const active = frequency === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.frequencyChip, active && styles.frequencyChipActive]}
                  onPress={() => setFrequency(value)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.frequencyText, active && styles.frequencyTextActive]}>
                    {value === 'one-time' ? 'One-time' : 'Monthly'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>M-Pesa number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="254712345678"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Text style={styles.helperText}>Use the number that will receive the STK prompt.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleGive} disabled={processing} activeOpacity={0.9}>
          <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.textOnAccent} />
          <Text style={styles.primaryButtonText}>{processing ? 'Starting payment...' : 'Initiate M-Pesa'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('DonationHistory')} activeOpacity={0.9}>
          <Ionicons name="time-outline" size={18} color={theme.colors.text} />
          <Text style={styles.secondaryButtonText}>Open giving history</Text>
        </TouchableOpacity>
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
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: theme.spacing.md,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    presetChip: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    presetChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    presetText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    presetTextActive: {
      color: theme.colors.textOnAccent,
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
    frequencyRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    frequencyChip: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
    },
    frequencyChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    frequencyText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    frequencyTextActive: {
      color: theme.colors.textOnAccent,
    },
    helperText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 8,
    },
    primaryButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: theme.spacing.sm,
    },
    primaryButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryButton: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}

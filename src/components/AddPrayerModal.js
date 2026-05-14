import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/ThemeContext';
import { createPrayerRequest } from '../services/api';

const urgencyLevels = [
  { key: 'gentle', label: 'Gentle' },
  { key: 'steady', label: 'Steady' },
  { key: 'urgent', label: 'Urgent' },
];

export default function AddPrayerModal({ visible, onClose, onCreated }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [urgency, setUrgency] = useState('steady');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !request.trim()) {
      Alert.alert('Missing details', 'Please enter your name and your prayer request.');
      return;
    }

    setSubmitting(true);
    try {
      await createPrayerRequest({
        name: name.trim(),
        request: request.trim(),
        urgency,
      });
      setName('');
      setRequest('');
      setUrgency('steady');
      await onCreated?.();
      onClose();
    } catch {
      Alert.alert('Unable to submit', 'The request could not be sent right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Share a Prayer Need</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Your name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Prayer request</Text>
            <TextInput
              value={request}
              onChangeText={setRequest}
              placeholder="Share the request briefly and clearly..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              style={[styles.input, styles.textarea]}
            />

            <Text style={styles.label}>Urgency</Text>
            <View style={styles.levelRow}>
              {urgencyLevels.map((level) => {
                const active = urgency === level.key;
                return (
                  <TouchableOpacity
                    key={level.key}
                    style={[styles.levelChip, active && styles.levelChipActive]}
                    onPress={() => setUrgency(level.key)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.levelText, active && styles.levelTextActive]}>{level.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting} activeOpacity={0.9}>
              <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Post prayer request'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      maxHeight: '88%',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: theme.spacing.sm,
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
    textarea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    levelRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    levelChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
    },
    levelChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    levelText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    levelTextActive: {
      color: theme.colors.textOnAccent,
    },
    submitButton: {
      marginTop: theme.spacing.xl,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitButtonText: {
      color: theme.colors.textOnAccent,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}

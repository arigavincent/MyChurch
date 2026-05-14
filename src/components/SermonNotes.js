import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { createSermonNote, fetchSermonNotes } from '../services/api';

export default function SermonNotes({ sermonId }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sermonId || !user || !expanded) {
      setNotes([]);
      return undefined;
    }

    fetchSermonNotes(sermonId).then(setNotes).catch(() => setNotes([]));
    return undefined;
  }, [expanded, sermonId, user]);

  const addNote = async () => {
    if (!user || !text.trim()) return;
    setSaving(true);
    try {
      await createSermonNote({
        sermonId,
        text: text.trim(),
      });
      const latestNotes = await fetchSermonNotes(sermonId);
      setNotes(latestNotes);
      setText('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((current) => !current)} activeOpacity={0.9}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Private Notes</Text>
            <Text style={styles.headerSubtitle}>Linked to this sermon and visible only to you</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {!user && (
            <Text style={styles.authHint}>Sign in from Profile to save notes against each sermon.</Text>
          )}

          {user && (
            <View style={styles.inputCard}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Capture the key takeaway, scripture, or prayer point..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                style={styles.input}
              />
              <TouchableOpacity style={styles.addButton} onPress={addNote} disabled={saving || !text.trim()} activeOpacity={0.9}>
                {saving ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color={theme.colors.textOnAccent} />
                    <Text style={styles.addButtonText}>Save note</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteText}>{note.text}</Text>
            </View>
          ))}

          {user && notes.length === 0 && (
            <Text style={styles.emptyText}>No notes yet. Start with the one line you do not want to forget.</Text>
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      marginTop: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accentSoft,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    headerSubtitle: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    authHint: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    inputCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    input: {
      minHeight: 96,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 21,
      textAlignVertical: 'top',
      marginBottom: theme.spacing.md,
    },
    addButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    addButtonText: {
      color: theme.colors.textOnAccent,
      fontWeight: '800',
      fontSize: 13,
    },
    noteCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    noteText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: theme.spacing.sm,
    },
  });
}

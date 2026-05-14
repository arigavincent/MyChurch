import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceId } from '../utils/deviceId';
import { useTheme } from '../hooks/ThemeContext';
import { relativeTimeFromDate } from '../../shared/contentModel';
import { createPrayerComment, fetchPrayerComments, prayForRequest } from '../services/api';

const urgencyMap = {
  gentle: { label: 'Gentle', color: '#5EA8FF' },
  steady: { label: 'Steady', color: '#D4AF37' },
  urgent: { label: 'Urgent', color: '#E35D6A' },
  low: { label: 'Low', color: '#5EA8FF' },
  medium: { label: 'Steady', color: '#D4AF37' },
  high: { label: 'Urgent', color: '#E35D6A' },
};

export default function PrayerRequestCard({ request }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [deviceId, setDeviceId] = useState('');
  const [praying, setPraying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [prayedBy, setPrayedBy] = useState(request.prayedBy || []);
  const [prayCount, setPrayCount] = useState(request.prayCount || 0);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    setPrayedBy(request.prayedBy || []);
    setPrayCount(request.prayCount || 0);
  }, [request.prayedBy, request.prayCount]);

  useEffect(() => {
    if (!showComments) return undefined;

    fetchPrayerComments(request.id).then(setComments).catch(() => setComments([]));
    return undefined;
  }, [request.id, showComments]);

  const hasPrayed = deviceId && prayedBy.includes(deviceId);
  const urgency = urgencyMap[request.urgency] || urgencyMap.steady;

  const handlePray = async () => {
    if (!deviceId || hasPrayed) return;
    setPraying(true);
    try {
      await prayForRequest(request.id, deviceId);
      setPrayedBy((current) => (current.includes(deviceId) ? current : [...current, deviceId]));
      setPrayCount((current) => current + 1);
    } catch {
      Alert.alert('Unable to update', 'Could not register your prayer support right now.');
    } finally {
      setPraying(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      await createPrayerComment({
        requestId: request.id,
        name: 'Church Family',
        text: commentText.trim(),
      });
      const latestComments = await fetchPrayerComments(request.id);
      setComments(latestComments);
      setCommentText('');
    } catch {
      Alert.alert('Unable to comment', 'Could not send your encouragement right now.');
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.identityWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={16} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={styles.name}>{request.name}</Text>
            <Text style={styles.timeText}>{relativeTimeFromDate(request.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.urgencyChip, { backgroundColor: `${urgency.color}24` }]}>
          <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
        </View>
      </View>

      <Text style={styles.requestText}>{request.request}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.prayButton, hasPrayed && styles.prayButtonActive]} onPress={handlePray} disabled={praying || hasPrayed} activeOpacity={0.9}>
          {praying ? (
            <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
          ) : (
            <>
              <Ionicons name={hasPrayed ? 'heart' : 'heart-outline'} size={18} color={hasPrayed ? theme.colors.textOnAccent : theme.colors.text} />
              <Text style={[styles.prayButtonText, hasPrayed && styles.prayButtonTextActive]}>
                {hasPrayed ? 'Prayed' : 'I prayed'} • {prayCount}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentToggle} onPress={() => setShowComments((current) => !current)} activeOpacity={0.9}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.commentToggleText}>{showComments ? 'Hide comments' : 'Comments'}</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Text style={styles.commentName}>{comment.name}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}

          {comments.length === 0 && (
            <Text style={styles.emptyCommentText}>No encouragement posted yet. Add the first word of support.</Text>
          )}

          <View style={styles.commentComposer}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a short encouragement..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.commentInput}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleAddComment} disabled={addingComment || !commentText.trim()} activeOpacity={0.9}>
              {addingComment ? (
                <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
              ) : (
                <Ionicons name="send" size={16} color={theme.colors.textOnAccent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    identityWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    timeText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    urgencyChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    urgencyText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    requestText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    prayButton: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    prayButtonActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    prayButtonText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    prayButtonTextActive: {
      color: theme.colors.textOnAccent,
    },
    commentToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    commentToggleText: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    commentsSection: {
      marginTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    commentCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    commentName: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 4,
    },
    commentText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyCommentText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    commentComposer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    commentInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 14,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

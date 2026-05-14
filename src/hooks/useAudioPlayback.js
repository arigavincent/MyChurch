import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * Custom hook for sermon audio playback using expo-audio.
 */
export default function useAudioPlayback() {
  const playerRef = useRef(null);
  const statusSubscriptionRef = useRef(null);
  const currentSermonIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [currentSermonId, setCurrentSermonId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetPlaybackState = useCallback(() => {
    setIsLoaded(false);
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
  }, []);

  const syncFromStatus = useCallback((status) => {
    if (!status) return;

    const hasActiveSermon = currentSermonIdRef.current !== null;
    setIsLoaded(Boolean(status.isLoaded));
    setIsPlaying(Boolean(status.playing));
    setPositionMillis(Math.max(0, Math.round((status.currentTime || 0) * 1000)));
    setDurationMillis(Math.max(0, Math.round((status.duration || 0) * 1000)));
    setIsLoading(hasActiveSermon && (!status.isLoaded || status.isBuffering));

    if (status.didJustFinish) {
      playerRef.current?.seekTo(0).catch(() => {});
      setIsPlaying(false);
      setPositionMillis(0);
      setIsLoading(false);
    }
  }, []);

  const releasePlayer = useCallback(() => {
    statusSubscriptionRef.current?.remove?.();
    statusSubscriptionRef.current = null;

    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
  }, []);

  const ensurePlayer = useCallback(() => {
    if (playerRef.current) {
      return playerRef.current;
    }

    const player = createAudioPlayer(null, {
      updateInterval: 250,
    });

    statusSubscriptionRef.current = player.addListener('playbackStatusUpdate', syncFromStatus);
    playerRef.current = player;
    return player;
  }, [syncFromStatus]);

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {});

    return () => {
      releasePlayer();
    };
  }, [releasePlayer]);

  /** Load and play a sermon audio file */
  const loadAndPlay = useCallback(
    async (sermonId, audioUrl) => {
      try {
        setError(null);
        resetPlaybackState();
        currentSermonIdRef.current = sermonId;
        setCurrentSermonId(sermonId);
        setIsLoading(true);

        const player = ensurePlayer();
        player.replace(audioUrl);
        player.play();
      } catch (err) {
        currentSermonIdRef.current = null;
        setCurrentSermonId(null);
        setError('Failed to load audio. Please try again.');
        console.warn('Audio load error:', err);
        setIsLoading(false);
      } finally {
        if (playerRef.current?.isLoaded) {
          setIsLoading(false);
        }
      }
    },
    [ensurePlayer, resetPlaybackState]
  );

  /** Toggle play/pause for the current audio */
  const togglePlayPause = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (!player.isLoaded) return;

      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  /** Seek to a specific position (in milliseconds) */
  const seekTo = useCallback(async (millis) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      await player.seekTo(millis / 1000);
      setPositionMillis(millis);
    } catch {}
  }, []);

  /** Check if a sermon is currently loaded */
  const isCurrentSermon = useCallback(
    (sermonId) => currentSermonId === sermonId,
    [currentSermonId]
  );

  /** Unload current audio */
  const unload = useCallback(async () => {
    releasePlayer();
    currentSermonIdRef.current = null;
    setCurrentSermonId(null);
    resetPlaybackState();
    setIsLoading(false);
  }, [releasePlayer, resetPlaybackState]);

  return {
    isLoaded,
    isPlaying,
    positionMillis,
    durationMillis,
    currentSermonId,
    isLoading,
    error,
    loadAndPlay,
    togglePlayPause,
    seekTo,
    isCurrentSermon,
    unload,
  };
}

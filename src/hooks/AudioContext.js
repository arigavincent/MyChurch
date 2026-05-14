import React, { createContext, useContext } from 'react';
import useAudioPlayback from './useAudioPlayback';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audio = useAudioPlayback();
  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return ctx;
}

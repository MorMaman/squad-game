/**
 * Game Sound Effects Hook
 * Generates and plays sound effects for games using Web Audio API
 * Works on web, gracefully degrades on native (relies on haptics there)
 */

import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

type SoundType =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'success'
  | 'gameOver'
  | 'countdown'
  | 'go'
  | 'levelUp'
  | 'match'
  | 'flip'
  | 'tick'
  | 'warning';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  ramp?: boolean;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  tap: { frequency: 800, duration: 0.05, type: 'sine', volume: 0.3 },
  correct: { frequency: 880, duration: 0.15, type: 'sine', volume: 0.4, ramp: true },
  wrong: { frequency: 200, duration: 0.3, type: 'sawtooth', volume: 0.3 },
  success: { frequency: 523.25, duration: 0.5, type: 'sine', volume: 0.5, ramp: true },
  gameOver: { frequency: 150, duration: 0.5, type: 'triangle', volume: 0.4 },
  countdown: { frequency: 440, duration: 0.1, type: 'sine', volume: 0.3 },
  go: { frequency: 880, duration: 0.2, type: 'sine', volume: 0.5 },
  levelUp: { frequency: 660, duration: 0.3, type: 'sine', volume: 0.5, ramp: true },
  match: { frequency: 700, duration: 0.2, type: 'sine', volume: 0.4 },
  flip: { frequency: 1200, duration: 0.03, type: 'sine', volume: 0.2 },
  tick: { frequency: 1000, duration: 0.02, type: 'square', volume: 0.1 },
  warning: { frequency: 300, duration: 0.15, type: 'sawtooth', volume: 0.3 },
};

// Play a melody for success (C-E-G arpeggio)
const SUCCESS_MELODY = [
  { frequency: 523.25, duration: 0.1 }, // C5
  { frequency: 659.25, duration: 0.1 }, // E5
  { frequency: 783.99, duration: 0.2 }, // G5
];

// Play a descending tone for game over
const GAME_OVER_MELODY = [
  { frequency: 400, duration: 0.15 },
  { frequency: 300, duration: 0.15 },
  { frequency: 200, duration: 0.3 },
];

export function useGameSounds(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize AudioContext on first user interaction (required by browsers)
  const initAudio = useCallback(() => {
    if (Platform.OS !== 'web' || isInitializedRef.current) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      isInitializedRef.current = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTone = useCallback((config: SoundConfig) => {
    if (!enabled || Platform.OS !== 'web') return;

    initAudio();

    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(config.volume, ctx.currentTime);

      if (config.ramp) {
        // Ramp up frequency for a "success" feel
        oscillator.frequency.linearRampToValueAtTime(
          config.frequency * 1.5,
          ctx.currentTime + config.duration
        );
      }

      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch (e) {
      // Silently fail if audio doesn't work
    }
  }, [enabled, initAudio]);

  const playMelody = useCallback((notes: Array<{ frequency: number; duration: number }>) => {
    if (!enabled || Platform.OS !== 'web') return;

    initAudio();

    const ctx = audioContextRef.current;
    if (!ctx) return;

    let startTime = ctx.currentTime;

    notes.forEach((note) => {
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, startTime);

        gainNode.gain.setValueAtTime(0.4, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);

        startTime += note.duration;
      } catch (e) {
        // Silently fail
      }
    });
  }, [enabled, initAudio]);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    // Special handling for melodies
    if (type === 'success') {
      playMelody(SUCCESS_MELODY);
      return;
    }
    if (type === 'gameOver') {
      playMelody(GAME_OVER_MELODY);
      return;
    }

    const config = SOUND_CONFIGS[type];
    if (config) {
      playTone(config);
    }
  }, [enabled, playTone, playMelody]);

  // Simon Says specific - play different notes for each color
  const playSimonNote = useCallback((color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!enabled || Platform.OS !== 'web') return;

    const notes: Record<string, number> = {
      red: 329.63,    // E4
      blue: 261.63,   // C4
      green: 392.00,  // G4
      yellow: 523.25, // C5
    };

    playTone({
      frequency: notes[color],
      duration: 0.3,
      type: 'sine',
      volume: 0.4,
    });
  }, [enabled, playTone]);

  return {
    playSound,
    playSimonNote,
    initAudio, // Call this on first user interaction
  };
}

export default useGameSounds;

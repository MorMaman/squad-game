/**
 * Game Sound Effects Hook
 * Uses bundled audio files for reliable playback on all platforms
 *
 * iOS-specific notes:
 * - Audio mode must be configured before loading/playing sounds
 * - playsInSilentModeIOS requires proper audio session configuration
 * - Sounds should be preloaded for reliable playback
 */

import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';

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

type SimonColor = 'red' | 'blue' | 'green' | 'yellow';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  ramp?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

// Sound files mapping
const SOUND_FILES: Record<SoundType, any> = {
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  success: require('../../assets/sounds/success.wav'),
  gameOver: require('../../assets/sounds/gameOver.wav'),
  countdown: require('../../assets/sounds/countdown.wav'),
  go: require('../../assets/sounds/go.wav'),
  levelUp: require('../../assets/sounds/levelUp.wav'),
  match: require('../../assets/sounds/match.wav'),
  flip: require('../../assets/sounds/flip.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  warning: require('../../assets/sounds/warning.wav'),
};

const SIMON_SOUND_FILES: Record<SimonColor, any> = {
  red: require('../../assets/sounds/simon-red.wav'),
  blue: require('../../assets/sounds/simon-blue.wav'),
  green: require('../../assets/sounds/simon-green.wav'),
  yellow: require('../../assets/sounds/simon-yellow.wav'),
};

// Haptic feedback for each sound type
const HAPTICS: Record<SoundType, SoundConfig['haptic']> = {
  tap: 'light',
  correct: 'success',
  wrong: 'error',
  success: 'success',
  gameOver: 'error',
  countdown: 'light',
  go: 'medium',
  levelUp: 'success',
  match: 'medium',
  flip: 'light',
  tick: 'light',
  warning: 'warning',
};

// Web Audio configs for web platform
const WEB_SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
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

const SUCCESS_MELODY = [
  { frequency: 523.25, duration: 0.1 },
  { frequency: 659.25, duration: 0.1 },
  { frequency: 783.99, duration: 0.2 },
];

const GAME_OVER_MELODY = [
  { frequency: 400, duration: 0.15 },
  { frequency: 300, duration: 0.15 },
  { frequency: 200, duration: 0.3 },
];

const SIMON_NOTES: Record<SimonColor, number> = {
  red: 329.63,
  blue: 261.63,
  green: 392.00,
  yellow: 523.25,
};

export function useGameSounds(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);
  const soundCacheRef = useRef<Map<string, Audio.Sound>>(new Map());
  const isAudioConfiguredRef = useRef(false);
  const isConfiguringRef = useRef(false);
  const configurePromiseRef = useRef<Promise<void> | null>(null);

  // Configure audio for native - MUST be called before any sound operations
  const configureAudio = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    // Already configured
    if (isAudioConfiguredRef.current) return true;

    // Configuration in progress - wait for it
    if (isConfiguringRef.current && configurePromiseRef.current) {
      await configurePromiseRef.current;
      return isAudioConfiguredRef.current;
    }

    isConfiguringRef.current = true;

    configurePromiseRef.current = (async () => {
      try {
        // Full audio mode configuration for iOS
        // This is critical for sounds to play on iOS, especially in silent mode
        await Audio.setAudioModeAsync({
          // iOS-specific: Allow audio to play even when the ringer/silent switch is on
          playsInSilentModeIOS: true,
          // iOS-specific: Don't allow recording (we're only playing sounds)
          allowsRecordingIOS: false,
          // iOS-specific: How to handle interruptions (e.g., phone calls)
          // DuckOthers will lower other audio instead of stopping it
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          // Android-specific: Similar behavior for Android
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          // Android-specific: Lower volume of other apps while playing
          shouldDuckAndroid: true,
          // Don't stay active in background - we're just playing short sound effects
          staysActiveInBackground: false,
          // Play through earpiece only if explicitly needed (false = use speaker)
          playThroughEarpieceAndroid: false,
        });

        isAudioConfiguredRef.current = true;
        console.log('[Sound] Audio mode configured successfully for iOS');
      } catch (e) {
        console.error('[Sound] Failed to configure audio mode:', e);
        isAudioConfiguredRef.current = false;
      } finally {
        isConfiguringRef.current = false;
      }
    })();

    await configurePromiseRef.current;
    return isAudioConfiguredRef.current;
  }, []);

  // Preload a single sound
  const preloadSound = useCallback(async (soundFile: any, cacheKey: string): Promise<Audio.Sound | null> => {
    try {
      // Ensure audio is configured first
      const configured = await configureAudio();
      if (!configured) {
        console.warn('[Sound] Cannot preload - audio not configured');
        return null;
      }

      // Check if already cached
      const existing = soundCacheRef.current.get(cacheKey);
      if (existing) {
        return existing;
      }

      console.log('[Sound] Preloading:', cacheKey);
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        {
          shouldPlay: false,
          volume: 1.0,
          // Important: Set initial status to prepare the sound
          isLooping: false,
        }
      );

      soundCacheRef.current.set(cacheKey, sound);
      console.log('[Sound] Preloaded:', cacheKey);
      return sound;
    } catch (e) {
      console.error('[Sound] Failed to preload:', cacheKey, e);
      return null;
    }
  }, [configureAudio]);

  // Preload all sounds for faster playback
  const preloadAllSounds = useCallback(async () => {
    if (Platform.OS === 'web') return;

    console.log('[Sound] Preloading all sounds...');

    // Preload game sounds
    const gamePromises = Object.entries(SOUND_FILES).map(([key, file]) =>
      preloadSound(file, key)
    );

    // Preload Simon sounds
    const simonPromises = Object.entries(SIMON_SOUND_FILES).map(([color, file]) =>
      preloadSound(file, `simon-${color}`)
    );

    await Promise.all([...gamePromises, ...simonPromises]);
    console.log('[Sound] All sounds preloaded');
  }, [preloadSound]);

  // Initialize AudioContext for web
  const initAudio = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (isInitializedRef.current) return;
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        isInitializedRef.current = true;
      } catch (e) {
        console.warn('[Sound] Web Audio API not supported:', e);
      }
    } else {
      // For native, configure audio and optionally preload
      await configureAudio();
      // Preload sounds after first user interaction for better UX
      preloadAllSounds();
    }
  }, [configureAudio, preloadAllSounds]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Unload cached sounds
      soundCacheRef.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      soundCacheRef.current.clear();
    };
  }, []);

  // Play haptic feedback
  const playHaptic = useCallback(async (type: SoundConfig['haptic']) => {
    if (Platform.OS === 'web' || !type) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (e) {
      // Haptics not available
    }
  }, []);

  // Play native sound using expo-av
  const playNativeSound = useCallback(async (soundFile: any, cacheKey: string) => {
    if (!enabled) {
      console.log('[Sound] Disabled, skipping:', cacheKey);
      return;
    }

    console.log('[Sound] Playing:', cacheKey);

    try {
      // CRITICAL: Ensure audio mode is configured before playing
      const configured = await configureAudio();
      if (!configured) {
        console.warn('[Sound] Audio not configured, attempting to play anyway');
      }

      // Check cache first
      let sound = soundCacheRef.current.get(cacheKey);

      if (!sound) {
        console.log('[Sound] Loading sound (not preloaded):', cacheKey);
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundFile,
          {
            shouldPlay: false,
            volume: 1.0,
            isLooping: false,
          }
        );
        sound = newSound;
        soundCacheRef.current.set(cacheKey, sound);
        console.log('[Sound] Sound loaded and cached');
      }

      // Get current status to check if sound is loaded
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        console.warn('[Sound] Sound not loaded, reloading:', cacheKey);
        // Remove from cache and try to reload
        soundCacheRef.current.delete(cacheKey);
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundFile,
          { shouldPlay: false, volume: 1.0 }
        );
        sound = newSound;
        soundCacheRef.current.set(cacheKey, sound);
      }

      // Reset position and play
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();

      console.log('[Sound] playAsync called successfully');
    } catch (e) {
      console.error('[Sound] Native sound playback failed:', cacheKey, e);

      // Try to recover by clearing the cache and retrying once
      const cachedSound = soundCacheRef.current.get(cacheKey);
      if (cachedSound) {
        try {
          await cachedSound.unloadAsync();
        } catch (unloadErr) {
          // Ignore
        }
        soundCacheRef.current.delete(cacheKey);
      }
    }
  }, [enabled, configureAudio]);

  // Play web tone
  const playWebTone = useCallback((config: SoundConfig) => {
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
        oscillator.frequency.linearRampToValueAtTime(
          config.frequency * 1.5,
          ctx.currentTime + config.duration
        );
      }

      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch (e) {
      // Silently fail
    }
  }, [initAudio]);

  // Play web melody
  const playWebMelody = useCallback((notes: Array<{ frequency: number; duration: number }>) => {
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
  }, [initAudio]);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    // Play haptic on native
    if (Platform.OS !== 'web') {
      playHaptic(HAPTICS[type]);
    }

    if (Platform.OS === 'web') {
      // Use Web Audio API
      if (type === 'success') {
        playWebMelody(SUCCESS_MELODY);
      } else if (type === 'gameOver') {
        playWebMelody(GAME_OVER_MELODY);
      } else {
        playWebTone(WEB_SOUND_CONFIGS[type]);
      }
    } else {
      // Use bundled audio files
      const soundFile = SOUND_FILES[type];
      if (soundFile) {
        playNativeSound(soundFile, type);
      }
    }
  }, [enabled, playHaptic, playWebTone, playWebMelody, playNativeSound]);

  // Simon Says specific
  const playSimonNote = useCallback((color: SimonColor) => {
    if (!enabled) return;

    // Play haptic on native
    if (Platform.OS !== 'web') {
      playHaptic('medium');
    }

    if (Platform.OS === 'web') {
      playWebTone({
        frequency: SIMON_NOTES[color],
        duration: 0.3,
        type: 'sine',
        volume: 0.4,
      });
    } else {
      const soundFile = SIMON_SOUND_FILES[color];
      if (soundFile) {
        playNativeSound(soundFile, `simon-${color}`);
      }
    }
  }, [enabled, playHaptic, playWebTone, playNativeSound]);

  return {
    playSound,
    playSimonNote,
    initAudio,
    preloadAllSounds,
  };
}

export default useGameSounds;

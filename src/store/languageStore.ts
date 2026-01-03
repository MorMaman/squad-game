import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';
import i18n, { SupportedLanguage, isRTL as checkIsRTL } from '../lib/i18n';

// Key for storing pending RTL change that needs restart
const RTL_PENDING_KEY = '@squad_game_rtl_pending';
// Key for storing whether user has acknowledged RTL change (and we're waiting for full restart)
const RTL_ACKNOWLEDGED_KEY = '@squad_game_rtl_acknowledged';

interface LanguageState {
  // State
  language: SupportedLanguage;
  isRTL: boolean;
  isInitialized: boolean;
  needsRestart: boolean;

  // Actions
  setLanguage: (language: SupportedLanguage) => Promise<{ needsRestart: boolean }>;
  initializeLanguage: () => Promise<void>;
  restartApp: () => Promise<boolean>;
  clearRestartFlag: () => void;
  acknowledgeRestart: () => Promise<void>;
}

// Get device's default language
const getDeviceLanguage = (): SupportedLanguage => {
  // SDK 54 uses getLocales() instead of locale
  const locales = Localization.getLocales();
  const deviceLocale = locales?.[0]?.languageCode || 'en';
  if (deviceLocale === 'he' || deviceLocale.startsWith('he')) {
    return 'he';
  }
  return 'en';
};

/**
 * Force RTL layout direction
 * This must be called before any components render
 */
export function forceRTLLayout(enable: boolean): void {
  if (Platform.OS === 'web') return;

  // Always allow RTL first
  I18nManager.allowRTL(enable);

  // Force RTL if needed
  if (I18nManager.isRTL !== enable) {
    I18nManager.forceRTL(enable);
  }
}

/**
 * Check if RTL layout matches expected state
 */
export function isRTLLayoutCorrect(expectedRTL: boolean): boolean {
  if (Platform.OS === 'web') return true;
  return I18nManager.isRTL === expectedRTL;
}

/**
 * Restart the app to apply RTL changes
 * On native, uses expo-updates to reload (only works in standalone builds)
 * On web, reloads the page
 * In Expo Go, user must manually shake and reload
 */
export async function restartAppForRTL(): Promise<boolean> {
  if (Platform.OS === 'web') {
    window.location.reload();
    return true;
  }

  try {
    // Check if we're in a development build or Expo Go
    // expo-updates only works in standalone/production builds
    if (__DEV__) {
      // In development/Expo Go, we can't programmatically restart
      // User must shake device and tap "Reload"
      console.log('[RTL] Development mode - user must manually reload');
      return false;
    }

    // Use expo-updates to reload the app (standalone builds only)
    await Updates.reloadAsync();
    return true;
  } catch (error) {
    console.error('Failed to restart app:', error);
    return false;
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      isRTL: false,
      isInitialized: false,
      needsRestart: false,

      setLanguage: async (language: SupportedLanguage) => {
        const newIsRTL = checkIsRTL(language);
        const currentRTL = I18nManager.isRTL;

        // Update i18next language immediately
        await i18n.changeLanguage(language);

        // Update state
        set({ language, isRTL: newIsRTL });

        // Handle RTL layout changes (native only)
        if (Platform.OS !== 'web') {
          // Check if RTL setting needs to change
          if (currentRTL !== newIsRTL) {
            // Store pending RTL change
            await AsyncStorage.setItem(RTL_PENDING_KEY, newIsRTL.toString());

            // Apply RTL settings (will only fully take effect after restart)
            I18nManager.allowRTL(newIsRTL);
            I18nManager.forceRTL(newIsRTL);

            set({ needsRestart: true });
            return { needsRestart: true };
          }
        }

        return { needsRestart: false };
      },

      restartApp: async () => {
        return await restartAppForRTL();
      },

      clearRestartFlag: () => {
        set({ needsRestart: false });
        AsyncStorage.removeItem(RTL_PENDING_KEY).catch(console.error);
        AsyncStorage.removeItem(RTL_ACKNOWLEDGED_KEY).catch(console.error);
      },

      acknowledgeRestart: async () => {
        // User has acknowledged they need to restart
        // Clear needsRestart flag so the banner goes away
        // Store acknowledged flag so we know RTL change is expected on next full restart
        set({ needsRestart: false });
        await AsyncStorage.setItem(RTL_ACKNOWLEDGED_KEY, 'true');
      },

      initializeLanguage: async () => {
        const state = get();

        // Check for pending RTL change from previous session
        const pendingRTL = await AsyncStorage.getItem(RTL_PENDING_KEY);
        const hadPendingRTL = pendingRTL !== null;

        // Check if user has already acknowledged the restart requirement
        const acknowledgedRTL = await AsyncStorage.getItem(RTL_ACKNOWLEDGED_KEY);
        const hadAcknowledged = acknowledgedRTL !== null;

        if (hadPendingRTL) {
          // Clear the pending flag - the user has reloaded/restarted
          await AsyncStorage.removeItem(RTL_PENDING_KEY);
        }

        // If already initialized from persisted storage, use that
        // Otherwise, use device language as default
        if (!state.isInitialized) {
          const deviceLanguage = getDeviceLanguage();
          const initialLanguage = state.language || deviceLanguage;
          const initialIsRTL = checkIsRTL(initialLanguage);

          // Set i18next language
          await i18n.changeLanguage(initialLanguage);

          // Set RTL for native platforms
          if (Platform.OS !== 'web') {
            I18nManager.allowRTL(initialIsRTL);
            if (I18nManager.isRTL !== initialIsRTL) {
              I18nManager.forceRTL(initialIsRTL);
            }
          }

          // Check if RTL state matches layout
          const rtlMismatch = Platform.OS !== 'web' && I18nManager.isRTL !== initialIsRTL;

          // If RTL now matches what we expected, clear the acknowledged flag
          // This means the full restart was successful
          if (!rtlMismatch && hadAcknowledged) {
            await AsyncStorage.removeItem(RTL_ACKNOWLEDGED_KEY);
          }

          set({
            language: initialLanguage,
            isRTL: initialIsRTL,
            isInitialized: true,
            // Only show restart if:
            // 1. There's an RTL mismatch AND
            // 2. User hasn't already acknowledged the restart requirement
            needsRestart: rtlMismatch && !hadAcknowledged,
          });
        } else {
          // Even if initialized, sync i18next with stored language
          await i18n.changeLanguage(state.language);

          // Check for RTL mismatch
          const expectedRTL = checkIsRTL(state.language);
          const rtlMismatch = Platform.OS !== 'web' && I18nManager.isRTL !== expectedRTL;

          // If RTL now matches what we expected, clear the acknowledged flag
          if (!rtlMismatch && hadAcknowledged) {
            await AsyncStorage.removeItem(RTL_ACKNOWLEDGED_KEY);
          }

          set({
            isInitialized: true,
            // Only show restart if there's a mismatch AND user hasn't acknowledged
            needsRestart: rtlMismatch && !hadAcknowledged,
          });
        }
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        isRTL: state.isRTL,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // After rehydration, sync i18next with stored language
          i18n.changeLanguage(state.language);

          // Apply RTL immediately on rehydration (before first render)
          if (Platform.OS !== 'web') {
            const expectedRTL = checkIsRTL(state.language);
            I18nManager.allowRTL(expectedRTL);
            if (I18nManager.isRTL !== expectedRTL) {
              I18nManager.forceRTL(expectedRTL);
            }
          }
        }
      },
    }
  )
);

/**
 * Initialize RTL settings synchronously before app renders
 * This should be called at the top level of the app entry point
 */
export async function initializeRTLSync(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Read stored language preference
    const storedData = await AsyncStorage.getItem('language-storage');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const state = parsed.state;
      if (state?.language) {
        const expectedRTL = checkIsRTL(state.language);
        I18nManager.allowRTL(expectedRTL);
        if (I18nManager.isRTL !== expectedRTL) {
          I18nManager.forceRTL(expectedRTL);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize RTL sync:', error);
  }
}

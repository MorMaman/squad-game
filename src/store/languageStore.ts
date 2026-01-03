import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import i18n, { SupportedLanguage, isRTL as checkIsRTL } from '../lib/i18n';

interface LanguageState {
  // State
  language: SupportedLanguage;
  isRTL: boolean;
  isInitialized: boolean;

  // Actions
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  initializeLanguage: () => Promise<void>;
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

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      isRTL: false,
      isInitialized: false,

      setLanguage: async (language: SupportedLanguage) => {
        const newIsRTL = checkIsRTL(language);

        // Update i18next language
        await i18n.changeLanguage(language);

        // Update state
        set({ language, isRTL: newIsRTL });

        // Handle RTL layout changes (native only)
        if (Platform.OS !== 'web') {
          // Check if RTL setting needs to change
          const currentRTL = I18nManager.isRTL;
          if (currentRTL !== newIsRTL) {
            I18nManager.allowRTL(newIsRTL);
            I18nManager.forceRTL(newIsRTL);
            // Note: For the RTL change to fully take effect,
            // the app needs to be restarted. This is a limitation of React Native.
            // You may want to show a message to the user about this.
          }
        }
      },

      initializeLanguage: async () => {
        const state = get();

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

          set({
            language: initialLanguage,
            isRTL: initialIsRTL,
            isInitialized: true,
          });
        } else {
          // Even if initialized, sync i18next with stored language
          await i18n.changeLanguage(state.language);
          set({ isInitialized: true });
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
        }
      },
    }
  )
);

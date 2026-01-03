import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../translations/en.json';
import he from '../translations/he.json';

// Define the resources type for type safety
export const resources = {
  en: { translation: en },
  he: { translation: he },
} as const;

// Get the device locale
const getDeviceLanguage = (): 'en' | 'he' => {
  // SDK 54 uses getLocales() instead of locale
  const locales = Localization.getLocales();
  const deviceLocale = locales?.[0]?.languageCode || 'en';
  // Check if device language is Hebrew
  if (deviceLocale === 'he' || deviceLocale.startsWith('he')) {
    return 'he';
  }
  // Default to English
  return 'en';
};

// Supported languages
export const supportedLanguages = {
  en: 'English',
  he: 'עברית',
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Check if a language is RTL
export const isRTL = (language: SupportedLanguage): boolean => {
  return language === 'he';
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for React Native
  },
});

// Function to change language programmatically
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || 'en';
};

export default i18n;

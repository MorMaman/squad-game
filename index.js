/**
 * Custom entry point for Squad Game
 * Initializes RTL settings before the app renders
 */

// Polyfill Reanimated globals for web FIRST (before any other imports)
import './src/polyfills/reanimated-web';

import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize RTL synchronously before app loads
// This ensures the correct layout direction is set before any components render
async function initializeRTL() {
  if (Platform.OS === 'web') return;

  try {
    // Read stored language preference
    const storedData = await AsyncStorage.getItem('language-storage');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const state = parsed.state;
      if (state?.language) {
        const isHebrew = state.language === 'he';
        I18nManager.allowRTL(isHebrew);
        if (I18nManager.isRTL !== isHebrew) {
          I18nManager.forceRTL(isHebrew);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize RTL:', error);
  }
}

// Start RTL initialization immediately
initializeRTL();

// Import and register the Expo Router entry point
import 'expo-router/entry';

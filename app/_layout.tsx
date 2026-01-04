import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  I18nManager,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/lib/i18n';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/authStore';
import { useLanguageStore } from '../src/store/languageStore';
import { supabase } from '../src/lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  addNotificationResponseReceivedListener,
} from '../src/services/notifications';
import { useRouter, Href } from 'expo-router';
import { RTLProvider } from '../src/providers/RTLProvider';
import { useRTL } from '../src/utils/rtl';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * RTL Restart Banner Component
 * Shows when the layout direction needs a restart to apply
 */
function RTLRestartBanner() {
  const { needsRestart, restartApp, acknowledgeRestart, language } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!needsRestart || Platform.OS === 'web') {
    return null;
  }

  const isHebrew = language === 'he';

  const handleRestart = async () => {
    if (__DEV__) {
      // In Expo Go/dev mode, we can't programmatically restart
      // Acknowledge the restart so the banner goes away
      // and show instructions for manual reload
      await acknowledgeRestart();
      Alert.alert(
        isHebrew ? '\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA \u05E0\u05E9\u05DE\u05E8\u05D5!' : 'Settings Saved!',
        isHebrew
          ? '\u05DB\u05D3\u05D9 \u05DC\u05D4\u05D7\u05D9\u05DC \u05D0\u05EA \u05DB\u05D9\u05D5\u05D5\u05DF \u05D4\u05D8\u05E7\u05E1\u05D8:\n\n1. \u05E0\u05E2\u05E8 \u05D0\u05EA \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\n2. \u05DC\u05D7\u05E5 \u05E2\u05DC "Reload"\n\n\u05D0\u05D5 \u05DC\u05D7\u05E5 Cmd+R (iOS) / R+R (Android)'
          : 'To apply the text direction change:\n\n1. Shake your device\n2. Tap "Reload"\n\nOr press Cmd+R (iOS) / R+R (Android)',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      // In production, try to restart the app
      const restarted = await restartApp();
      if (!restarted) {
        // If restart failed, acknowledge and show manual instructions
        await acknowledgeRestart();
        Alert.alert(
          isHebrew ? '\u05E0\u05D3\u05E8\u05E9 \u05D4\u05E4\u05E2\u05DC\u05D4 \u05DE\u05D7\u05D3\u05E9' : 'Manual Restart Required',
          isHebrew
            ? '\u05E1\u05D2\u05D5\u05E8 \u05D0\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D5\u05E4\u05EA\u05D7 \u05DE\u05D7\u05D3\u05E9 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05D7\u05D9\u05DC \u05D0\u05EA \u05DB\u05D9\u05D5\u05D5\u05DF \u05D4\u05D8\u05E7\u05E1\u05D8.'
            : 'Please close and reopen the app to apply the text direction change.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  };

  return (
    <View style={[styles.restartBanner, { paddingTop: insets.top + 8 }]}>
      <View style={styles.restartContent}>
        <Ionicons name="refresh-circle" size={24} color="#FFFFFF" />
        <Text style={styles.restartText}>
          {isHebrew
            ? '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05DE\u05D7\u05D3\u05E9 \u05DC\u05D4\u05D7\u05DC\u05EA \u05D4\u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD'
            : 'Restart required to apply changes'}
        </Text>
      </View>
      <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
        <Text style={styles.restartButtonText}>
          {isHebrew ? '\u05D4\u05E4\u05E2\u05DC \u05E2\u05DB\u05E9\u05D9\u05D5' : 'Restart'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutInner() {
  const { isLoading, isInitialized, initialize, user } = useAuthStore();
  const { initializeLanguage, isInitialized: isLanguageInitialized, language } = useLanguageStore();
  const router = useRouter();
  const { isRTL } = useRTL();

  useEffect(() => {
    // Initialize language settings
    initializeLanguage();
  }, []);

  useEffect(() => {
    // On web, check for auth tokens in URL hash (from magic link redirect)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set session from URL hash
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          initialize();
        });
        return;
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    // Register for push notifications (native only)
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        savePushToken(user.id, token);
      }
    });

    // Handle notification taps
    const subscription = addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.screen) {
        router.push(data.screen as Href);
      }
    });

    return () => subscription.remove();
  }, [user, router]);

  // Only show loading during initial auth check, NOT during login/signup
  // (login screen has its own loading state via Button component)
  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Determine animation direction based on RTL
  // In RTL mode, slide_from_right should visually appear as slide_from_left
  const slideAnimation = isRTL ? 'slide_from_left' : 'slide_from_right';

  return (
    <>
      <StatusBar style="light" />
      <RTLRestartBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#111827',
          },
          animation: slideAnimation,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="squad" />
        <Stack.Screen name="events/live-selfie" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="events/pressure-tap" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="events/poll" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="games/color-match" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="games/memory-match" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0A0E27' } }} />
        <Stack.Screen name="games/simon-says" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0A0E27' } }} />
        <Stack.Screen name="games/quick-math" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0A0E27' } }} />
        <Stack.Screen name="games/reaction-time" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0A0E27' } }} />
        <Stack.Screen name="results/[eventId]" />
        <Stack.Screen name="judge" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RTLProvider>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <RootLayoutInner />
            </QueryClientProvider>
          </SafeAreaProvider>
        </I18nextProvider>
      </RTLProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  restartBanner: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  restartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  restartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginStart: 12,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

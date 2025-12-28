import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  addNotificationResponseReceivedListener,
} from '../src/services/notifications';
import { useRouter, Href } from 'expo-router';

function RootLayoutInner() {
  const { isLoading, isInitialized, initialize, user } = useAuthStore();
  const router = useRouter();

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

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111827',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#111827',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="events/live-selfie"
          options={{ title: 'Live Selfie', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="events/pressure-tap"
          options={{ title: 'Pressure Tap', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="events/poll"
          options={{ title: 'Daily Poll', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="games/color-match"
          options={{
            title: 'Color Match',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="games/memory-match"
          options={{
            title: 'Memory Match',
            presentation: 'fullScreenModal',
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0E27' },
          }}
        />
        <Stack.Screen
          name="games/simon-says"
          options={{
            title: 'Simon Says',
            presentation: 'fullScreenModal',
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0E27' },
          }}
        />
        <Stack.Screen
          name="games/quick-math"
          options={{
            title: 'Quick Math',
            presentation: 'fullScreenModal',
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0E27' },
          }}
        />
        <Stack.Screen
          name="games/reaction-time"
          options={{
            title: 'Reaction Time',
            presentation: 'fullScreenModal',
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0E27' },
          }}
        />
        <Stack.Screen name="results/[eventId]" options={{ title: 'Results' }} />
        <Stack.Screen name="judge" options={{ title: 'Judge Panel' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutInner />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthCallback() {
  const router = useRouter();
  const { initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The supabase client will automatically handle the hash fragment
        // when detectSessionInUrl is true
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setTimeout(() => router.replace('/(auth)/login'), 3000);
          return;
        }

        if (data.session) {
          console.log('Session established from callback');
          // Re-initialize auth store to pick up the new session
          await initialize();
          router.replace('/');
        } else {
          // No session yet, might still be processing
          // Wait a bit and check again
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData.session) {
              await initialize();
              router.replace('/');
            } else {
              setError('Authentication failed. Please try again.');
              setTimeout(() => router.replace('/(auth)/login'), 3000);
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setError('Something went wrong. Redirecting to login...');
        setTimeout(() => router.replace('/(auth)/login'), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.subText}>Redirecting to login...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.text}>Verifying your email...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    color: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

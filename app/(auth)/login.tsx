import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';

// Convert Supabase errors to user-friendly messages
const getErrorMessage = (errorMessage: string): string => {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials or sign up for a new account.';
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.';
  }
  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (errorMessage.includes('Password should be')) {
    return 'Password must be at least 6 characters long.';
  }
  if (errorMessage.includes('Unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  return errorMessage;
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState('');
  const { signUp, signIn, isLoading, error: authError, clearError } = useAuthStore();
  const router = useRouter();

  // Use auth store error if available (converted to user-friendly), otherwise use local validation error
  const error = authError ? getErrorMessage(authError) : localError;

  // Clear errors when component mounts or when switching between sign in/sign up
  const clearErrors = () => {
    setLocalError('');
    clearError();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    clearErrors();

    if (isSignUp) {
      const { error: signUpError } = await signUp(email.trim(), password);
      if (!signUpError) {
        router.replace('/');
      }
      // Error is already set in authStore, no need to set it here
    } else {
      const { error: signInError } = await signIn(email.trim(), password);
      if (!signInError) {
        router.replace('/');
      }
      // Error is already set in authStore, no need to set it here
    }
  };

  const content = (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color="#6366f1" />
          </View>
          <Text style={styles.title}>Squad Game</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearErrors();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearErrors();
            }}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            title={isSignUp ? 'Sign Up' : 'Sign In'}
            onPress={handleSubmit}
            loading={isLoading}
            size="large"
          />
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              clearErrors();
            }}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // On web, don't wrap with Pressable (blocks input focus)
  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 14,
    lineHeight: 20,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    color: '#6366f1',
    fontSize: 14,
  },
});

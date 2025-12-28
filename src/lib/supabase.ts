import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Custom storage adapter - use AsyncStorage for both web and native
// expo-secure-store doesn't work on web
const StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Helper to get signed URL for media
export async function getSignedMediaUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('event-media')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

// Helper to upload media
export async function uploadEventMedia(
  eventId: string,
  userId: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  try {
    const path = `${eventId}/${userId}-${Date.now()}.jpg`;

    // Convert base64 to blob
    const response = await fetch(`data:${contentType};base64,${base64Data}`);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('event-media')
      .upload(path, blob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading media:', error);
      return null;
    }

    return path;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
}

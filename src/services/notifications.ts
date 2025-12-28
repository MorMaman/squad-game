import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Only import notifications on native platforms
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Configure how notifications are handled when app is in foreground
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications || !Device) {
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

interface NotificationSubscription {
  remove: () => void;
}

export function addNotificationReceivedListener(
  callback: (notification: unknown) => void
): NotificationSubscription {
  if (Platform.OS === 'web' || !Notifications) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(callback as any);
}

export function addNotificationResponseReceivedListener(
  callback: (response: unknown) => void
): NotificationSubscription {
  if (Platform.OS === 'web' || !Notifications) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(callback as any);
}

// Schedule a local notification (for testing/fallback)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds?: number
): Promise<string> {
  if (Platform.OS === 'web' || !Notifications) {
    return '';
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: seconds ? { seconds } : null,
  });
  return id;
}

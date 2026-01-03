import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nManager, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../../src/store/languageStore';

/**
 * Tab bar icon wrapper that handles RTL flipping for directional icons
 */
function TabBarIcon({
  name,
  color,
  size,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Use language store's isRTL instead of I18nManager.isRTL
  // This ensures RTL works even when device language is English
  const { isRTL } = useLanguageStore();
  const { t } = useTranslation();

  const tabBarStyle = {
    backgroundColor: '#0A0E27',
    borderTopColor: '#1A1A2E',
    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
    paddingTop: 8,
    height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
    // Force RTL direction on the tab bar based on app language setting
    ...(isRTL && { direction: 'rtl' as const }),
  };

  // Define tab screens - we'll control order via flexDirection in tabBarStyle
  // For RTL, we want: Settings | Leaderboard | Games | Today (right to left)
  // Expo Router doesn't support dynamic tab reordering, so we use flexDirection
  const tabBarContainerStyle = isRTL ? { flexDirection: 'row-reverse' as const } : {};

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          ...tabBarStyle,
          ...tabBarContainerStyle,
        },
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#0A0E27',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        // Ensure proper RTL layout for header
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.today'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="today" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: t('navigation.play'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="game-controller" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t('navigation.leaderboard'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

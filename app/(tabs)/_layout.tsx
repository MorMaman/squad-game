import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nManager, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../src/utils/rtl';

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
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  // Define tabs in the order they should appear
  // For RTL, expo-router handles the visual order, but we need to ensure
  // swipe gestures work correctly
  const tabBarStyle = {
    backgroundColor: '#0A0E27',
    borderTopColor: '#1A1A2E',
    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
    paddingTop: 8,
    height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
    // RTL layout is handled automatically by React Native's I18nManager
    // but we can add explicit direction if needed
    ...(isRTL && { direction: 'rtl' as const }),
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle,
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

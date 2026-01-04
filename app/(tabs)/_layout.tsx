import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../../src/store/languageStore';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect as useEffectReact } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { PagerView } from '../../src/components/PagerViewWrapper';
import * as Haptics from 'expo-haptics';

// Import tab screens
import HomeScreen from './index';
import GamesScreen from './games';
import LeaderboardScreen from './leaderboard';
import ShopScreen from './shop';
import SettingsScreen from './settings';

// Battle Game UI Colors - Modern Dark Theme
const COLORS = {
  // Backgrounds
  TAB_BG: '#0A0E27', // Deep navy
  TAB_BG_GRADIENT: '#1A1A2E', // Slightly lighter
  TAB_BG_CARD: '#16213E', // Card background

  // Primary Colors
  LIME: '#A3E635', // Main accent - lime green
  LIME_DARK: '#65A30D',
  CYAN: '#00D4FF', // Secondary accent
  PURPLE: '#9B59FF', // Tertiary accent
  GOLD: '#FFD700', // Special/premium
  ORANGE: '#FF6B00', // Hot items
  PINK: '#FF69B4', // Highlights

  // Text & States
  ACTIVE: '#A3E635', // Lime for active
  INACTIVE: '#4A5568', // Muted gray
  TEXT_MUTED: '#6B7280',

  // Borders & Effects
  BORDER: 'rgba(163, 230, 53, 0.2)', // Lime border
  GLOW: 'rgba(163, 230, 53, 0.5)',
  BADGE_RED: '#EF4444',
};

// Tab configuration - order matches visual tab bar layout
// GAMES | SHOP | TODAY | BATTLE | MORE
const TAB_SCREENS = [
  { key: 'games', component: GamesScreen },
  { key: 'shop', component: ShopScreen },
  { key: 'index', component: HomeScreen },      // TODAY - center
  { key: 'leaderboard', component: LeaderboardScreen },
  { key: 'settings', component: SettingsScreen },
];

// Notification Badge Component
function NotificationBadge({ count }: { count?: number }) {
  if (!count || count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

// Center Icon with glow animation (used for Today tab)
function AnimatedCenterIcon({ isFocused }: { isFocused: boolean }) {
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  useEffectReact(() => {
    if (isFocused) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotateValue.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
      pulseScale.value = withTiming(1, { duration: 300 });
      rotateValue.value = withTiming(0, { duration: 300 });
    }
  }, [isFocused]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: `${rotateValue.value}deg` },
    ],
  }));

  return (
    <View style={styles.centerIconContainer}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.centerGlowOuter, glowStyle]} />
      {/* Inner glow */}
      <Animated.View style={[styles.centerGlowInner, glowStyle]} />
      {/* Icon */}
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons
          name="crown"
          size={34}
          color={isFocused ? COLORS.LIME : COLORS.INACTIVE}
        />
      </Animated.View>
    </View>
  );
}

// Tab Icon Component with optional animation
function TabIcon({
  name,
  library = 'material',
  size = 26,
  isFocused,
  color,
}: {
  name: string;
  library?: 'ionicons' | 'material' | 'fontawesome';
  size?: number;
  isFocused: boolean;
  color: string;
}) {
  const scale = useSharedValue(1);

  useEffectReact(() => {
    if (isFocused) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const IconComponent = library === 'ionicons'
    ? Ionicons
    : library === 'fontawesome'
      ? FontAwesome5
      : MaterialCommunityIcons;

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

// Tab Configuration with icons - matches TAB_SCREENS order
const TAB_CONFIG = [
  {
    routeIndex: 0, // games
    icon: 'gamepad-variant',
    label: 'GAMES',
    library: 'material' as const,
  },
  {
    routeIndex: 1, // shop
    icon: 'cart',
    label: 'SHOP',
    library: 'material' as const,
  },
  {
    routeIndex: 2, // index/today (center)
    icon: 'crown',
    label: 'TODAY',
    library: 'material' as const,
    isCenter: true,
  },
  {
    routeIndex: 3, // leaderboard
    icon: 'trophy',
    label: 'BATTLE',
    library: 'ionicons' as const,
  },
  {
    routeIndex: 4, // settings
    icon: 'cog',
    label: 'MORE',
    library: 'material' as const,
  },
];

// Custom Tab Bar Component
function CustomTabBar({
  currentIndex,
  onTabPress,
  isRTL,
}: {
  currentIndex: number;
  onTabPress: (index: number) => void;
  isRTL: boolean;
}) {
  const insets = useSafeAreaInsets();

  // Adjust tab order for RTL
  const tabs = isRTL ? [...TAB_CONFIG].reverse() : TAB_CONFIG;

  const tabBarHeight = 80 + (insets.bottom > 0 ? insets.bottom : 12);

  // Find the center tab
  const centerTab = tabs.find(t => t.isCenter);
  const centerTabIndex = tabs.findIndex(t => t.isCenter);
  const isCenterFocused = centerTab ? currentIndex === centerTab.routeIndex : false;

  return (
    <View style={styles.tabBarWrapper}>
      {/* Center tab rendered above the gradient - pointerEvents allows taps to pass through */}
      {centerTab && (
        <View style={styles.centerTabFloating} pointerEvents="box-none">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isCenterFocused ? { selected: true } : {}}
            onPress={() => {
              if (!isCenterFocused) {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onTabPress(centerTab.routeIndex);
              }
            }}
            style={styles.centerTabTouchable}
            activeOpacity={0.7}
          >
            <View style={[
              styles.centerIconWrapper,
              isCenterFocused && styles.centerIconWrapperActive,
            ]}>
              <AnimatedCenterIcon isFocused={isCenterFocused} />
            </View>
            <Text style={[
              styles.centerTabLabel,
              isCenterFocused && styles.tabLabelActive,
            ]}>
              {centerTab.label}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <LinearGradient
        colors={[COLORS.TAB_BG_GRADIENT, COLORS.TAB_BG]}
        style={[
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        {/* Top border glow */}
        <View style={styles.tabBarTopBorder} />

        {tabs.map((tab, displayIndex) => {
          if (tab.isCenter) {
            // Render empty space for center tab
            return <View key={tab.routeIndex} style={styles.tabButton} />;
          }

          const isFocused = currentIndex === tab.routeIndex;
          const color = isFocused ? COLORS.LIME : COLORS.INACTIVE;

          const onPress = () => {
            if (!isFocused) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onTabPress(tab.routeIndex);
            }
          };

          return (
            <TouchableOpacity
              key={tab.routeIndex}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.regularTabContainer}>
                <View style={[
                  styles.iconWrapper,
                  isFocused && styles.iconWrapperActive,
                ]}>
                  <TabIcon
                    name={tab.icon}
                    library={tab.library}
                    size={24}
                    isFocused={isFocused}
                    color={color}
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                ]}>
                  {tab.label}
                </Text>
                {/* Active indicator dot */}
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const pagerRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(2); // Start on TODAY

  const handleTabPress = useCallback((index: number) => {
    if (Platform.OS !== 'web') {
      pagerRef.current?.setPage(index);
    } else {
      setCurrentIndex(index);
    }
  }, []);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const newIndex = e.nativeEvent.position;
    setCurrentIndex(newIndex);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  // Web version - render current screen only
  if (Platform.OS === 'web') {
    const CurrentScreen = TAB_SCREENS[currentIndex].component;
    return (
      <View style={styles.container}>
        <View style={styles.pagerView}>
          <CurrentScreen />
        </View>
        <CustomTabBar
          key={isRTL ? 'rtl' : 'ltr'}
          currentIndex={currentIndex}
          onTabPress={handleTabPress}
          isRTL={isRTL}
        />
      </View>
    );
  }

  // Native version - use PagerView for swipe navigation
  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={2}
        onPageSelected={handlePageSelected}
        overdrag={true}
        overScrollMode="always"
        layoutDirection={isRTL ? 'rtl' : 'ltr'}
      >
        {TAB_SCREENS.map((screen, index) => {
          const ScreenComponent = screen.component;
          return (
            <View key={screen.key} style={styles.page}>
              <ScreenComponent />
            </View>
          );
        })}
      </PagerView>

      <CustomTabBar
        key={isRTL ? 'rtl' : 'ltr'}
        currentIndex={currentIndex}
        onTabPress={handleTabPress}
        isRTL={isRTL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.TAB_BG,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },

  // Tab Bar Container
  tabBarWrapper: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.BORDER,
  },

  // Tab Button
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerTabButton: {
    marginTop: -24,
    zIndex: 10,
  },
  centerTabFloating: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  centerTabTouchable: {
    alignItems: 'center',
  },

  // Regular Tab
  regularTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: `${COLORS.LIME}15`,
  },

  // Center Tab
  centerTabContainer: {
    alignItems: 'center',
    overflow: 'visible',
  },
  centerIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.TAB_BG_CARD,
    borderWidth: 3,
    borderColor: COLORS.INACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  centerIconWrapperActive: {
    borderColor: COLORS.LIME,
    backgroundColor: COLORS.TAB_BG_GRADIENT,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.LIME,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },

  // Labels
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.INACTIVE,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: COLORS.LIME,
  },
  centerTabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.INACTIVE,
    marginTop: 8,
    letterSpacing: 1,
  },

  // Active Indicator
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.LIME,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.LIME,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      default: {},
    }),
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.BADGE_RED,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.TAB_BG,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.BADGE_RED,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Center Icon Glow Effects
  centerIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  centerGlowOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GLOW,
    opacity: 0,
  },
  centerGlowInner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.LIME,
    opacity: 0,
  },
});

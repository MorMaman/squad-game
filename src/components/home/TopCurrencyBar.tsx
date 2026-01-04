/**
 * TopCurrencyBar.tsx
 * Clash Royale-style top bar with level badge, XP progress, and currency displays
 * Designed to exactly match the Clash Royale aesthetic
 *
 * Layout (left to right):
 * 1. Level badge (skull/king icon in blue shield with level number)
 * 2. XP progress bar (current/max format with thin progress bar)
 * 3. Gold display (coin icon + number + green plus button)
 * 4. Gems/Stars display (gem icon + number + green plus button)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clashRoyaleTheme } from '../../theme/clashRoyaleTheme';
import { GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { GameHaptics } from '../../utils/haptics';

export interface TopCurrencyBarProps {
  /** Current player level */
  level: number;
  /** Current XP in this level */
  xp: number;
  /** XP required to reach next level */
  xpMax: number;
  /** Amount of gold currency */
  gold: number;
  /** Amount of gems/stars currency */
  gems: number;
  /** Called when user taps the add gold button */
  onAddGold?: () => void;
  /** Called when user taps the add gems button */
  onAddGems?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Animated number component for smooth value transitions
 */
function AnimatedCurrencyValue({
  value,
  prevValue,
}: {
  value: number;
  prevValue: React.MutableRefObject<number>;
}) {
  const scale = useSharedValue(1);
  const displayValue = useSharedValue(prevValue.current);

  useEffect(() => {
    if (value !== prevValue.current) {
      // Bounce animation on change
      scale.value = withSequence(
        withSpring(1.2, GAME_SPRINGS.wobbly),
        withSpring(1, GAME_SPRINGS.gentle)
      );
      // Animate the number
      displayValue.value = withTiming(value, {
        duration: GAME_DURATIONS.counting,
        easing: Easing.out(Easing.cubic),
      });
      prevValue.current = value;
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.currencyText, animatedStyle]}>
      {formatNumber(value)}
    </Animated.Text>
  );
}

/**
 * Green plus button component
 */
function AddButton({
  onPress,
  testID,
}: {
  onPress?: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(clashRoyaleTheme.animation.buttonScale, {
      duration: clashRoyaleTheme.animation.duration.fast,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, GAME_SPRINGS.bouncy);
  };

  const handlePress = () => {
    GameHaptics.buttonPress();
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.addButton, animatedStyle]}
      testID={testID}
    >
      <LinearGradient
        colors={[...clashRoyaleTheme.addButton.backgroundGradient]}
        style={styles.addButtonGradient}
      >
        <Ionicons
          name="add"
          size={16}
          color={clashRoyaleTheme.addButton.icon}
        />
      </LinearGradient>
    </AnimatedPressable>
  );
}

/**
 * Level badge component - Blue shield with skull/king icon
 */
function LevelBadge({ level }: { level: number }) {
  const scale = useSharedValue(1);
  const prevLevel = useRef(level);

  useEffect(() => {
    if (level !== prevLevel.current) {
      scale.value = withSequence(
        withSpring(1.3, GAME_SPRINGS.wobbly),
        withSpring(1, GAME_SPRINGS.gentle)
      );
      prevLevel.current = level;
      GameHaptics.levelUp();
    }
  }, [level]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.levelBadgeContainer, animatedStyle]}>
      <LinearGradient
        colors={[...clashRoyaleTheme.levelBadge.gradient]}
        style={styles.levelBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Shield icon - using crown/skull style */}
        <MaterialCommunityIcons
          name="shield-crown"
          size={clashRoyaleTheme.iconSizes.levelIcon}
          color={clashRoyaleTheme.levelBadge.text}
          style={styles.levelIcon}
        />
        {/* Level number below the icon */}
        <Text style={styles.levelText}>{level}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * XP Progress section - Shows "current/max" with thin progress bar
 */
function XPProgress({ xp, xpMax }: { xp: number; xpMax: number }) {
  const progress = useSharedValue(0);
  const targetProgress = Math.min(xp / xpMax, 1);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: GAME_DURATIONS.normal,
      easing: Easing.out(Easing.cubic),
    });
  }, [xp, xpMax]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.xpContainer}>
      {/* XP Text: "23/100" */}
      <Text style={styles.xpText}>
        {xp}/{xpMax}
      </Text>
      {/* Thin progress bar */}
      <View style={styles.xpBarBackground}>
        <Animated.View style={[styles.xpBarFill, animatedBarStyle]}>
          <LinearGradient
            colors={[...clashRoyaleTheme.xpBar.fillGradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Currency pill component - Icon + value + optional add button
 */
function CurrencyPill({
  icon,
  iconColor,
  value,
  onAdd,
  testID,
}: {
  icon: React.ReactNode;
  iconColor: string;
  value: number;
  onAdd?: () => void;
  testID?: string;
}) {
  const prevValue = useRef(value);

  return (
    <View style={styles.currencyPill}>
      {/* Currency icon */}
      <View style={styles.currencyIconWrapper}>{icon}</View>
      {/* Currency value with animation */}
      <AnimatedCurrencyValue value={value} prevValue={prevValue} />
      {/* Add button */}
      {onAdd && <AddButton onPress={onAdd} testID={testID} />}
    </View>
  );
}

/**
 * Gold icon component
 */
function GoldIcon() {
  return (
    <View style={styles.goldIcon}>
      <FontAwesome5
        name="coins"
        size={clashRoyaleTheme.iconSizes.medium}
        color={clashRoyaleTheme.gold.iconColor}
      />
    </View>
  );
}

/**
 * Gem/Star icon component
 */
function GemIcon() {
  return (
    <View style={styles.gemIcon}>
      <MaterialCommunityIcons
        name="diamond-stone"
        size={clashRoyaleTheme.iconSizes.medium}
        color={clashRoyaleTheme.gems.iconColor}
      />
    </View>
  );
}

/**
 * Format large numbers for display (e.g., 1500 -> "1.5K")
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

/**
 * TopCurrencyBar - Main component
 * Clash Royale-style top bar with level, XP, and currencies
 */
export function TopCurrencyBar({
  level,
  xp,
  xpMax,
  gold,
  gems,
  onAddGold,
  onAddGems,
}: TopCurrencyBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 4 },
      ]}
    >
      {/* Left section: Level badge + XP progress */}
      <View style={styles.leftSection}>
        <LevelBadge level={level} />
        <XPProgress xp={xp} xpMax={xpMax} />
      </View>

      {/* Right section: Currency displays */}
      <View style={styles.rightSection}>
        {/* Gold currency */}
        <CurrencyPill
          icon={<GoldIcon />}
          iconColor={clashRoyaleTheme.gold.iconColor}
          value={gold}
          onAdd={onAddGold}
          testID="add-gold-button"
        />
        {/* Gems/Stars currency */}
        <CurrencyPill
          icon={<GemIcon />}
          iconColor={clashRoyaleTheme.gems.iconColor}
          value={gems}
          onAdd={onAddGems}
          testID="add-gems-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: clashRoyaleTheme.topBar.background,
    height: 'auto',
    minHeight: clashRoyaleTheme.topBar.height,
  },

  // Left section: Level + XP
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },

  // Right section: Currencies
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Level Badge
  levelBadgeContainer: {
    ...Platform.select({
      ios: {
        shadowColor: clashRoyaleTheme.levelBadge.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  levelBadge: {
    width: 44,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: clashRoyaleTheme.levelBadge.border,
    paddingTop: 2,
  },
  levelIcon: {
    marginBottom: -2,
  },
  levelText: {
    color: clashRoyaleTheme.levelBadge.text,
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // XP Progress
  xpContainer: {
    flex: 1,
    maxWidth: 80,
    gap: 2,
  },
  xpText: {
    color: clashRoyaleTheme.xpBar.text,
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xpBarBackground: {
    height: 6,
    backgroundColor: clashRoyaleTheme.xpBar.background,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: clashRoyaleTheme.xpBar.border,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },

  // Currency Pill
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: clashRoyaleTheme.currencyPill.background,
    borderRadius: clashRoyaleTheme.currencyPill.borderRadius,
    paddingHorizontal: clashRoyaleTheme.currencyPill.paddingHorizontal,
    paddingVertical: clashRoyaleTheme.currencyPill.paddingVertical,
    borderWidth: 1,
    borderColor: clashRoyaleTheme.currencyPill.border,
    gap: 6,
  },
  currencyIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: {
    color: clashRoyaleTheme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textShadowColor: clashRoyaleTheme.text.shadow.color,
    textShadowOffset: clashRoyaleTheme.text.shadow.offset,
    textShadowRadius: clashRoyaleTheme.text.shadow.radius,
    minWidth: 32,
  },

  // Currency Icons
  goldIcon: {
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
      },
    }),
  },
  gemIcon: {
    ...Platform.select({
      ios: {
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
      },
    }),
  },

  // Add Button
  addButton: {
    marginLeft: 2,
  },
  addButtonGradient: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: clashRoyaleTheme.addButton.border,
    ...Platform.select({
      ios: {
        shadowColor: clashRoyaleTheme.addButton.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

export default TopCurrencyBar;

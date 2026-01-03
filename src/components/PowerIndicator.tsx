/**
 * PowerIndicator.tsx
 * Small badge component shown next to player names to indicate active powers
 * Compact design for use in leaderboards and player lists
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { GAME_COLORS } from '../theme/gameColors';
import type { UnderdogPowerType } from './UnderdogPowerBadge';

interface PowerIndicatorProps {
  /** The type of underdog power */
  powerType: UnderdogPowerType;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Whether this indicator is on the target (for target_lock) */
  isTarget?: boolean;
  /** Show tooltip on press (for target indicator) */
  showTooltip?: boolean;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    container: { height: 20, paddingHorizontal: 6, borderRadius: 10 },
    icon: 12,
    text: 10,
  },
  medium: {
    container: { height: 26, paddingHorizontal: 8, borderRadius: 13 },
    icon: 16,
    text: 12,
  },
};

// Power indicator configurations
const INDICATOR_CONFIG: Record<UnderdogPowerType, {
  icon?: keyof typeof Ionicons.glyphMap;
  text?: string;
  colors: readonly [string, string, ...string[]];
  targetIcon?: keyof typeof Ionicons.glyphMap;
  targetText?: string;
  targetColors?: readonly [string, string, ...string[]];
}> = {
  double_chance: {
    text: 'x2',
    colors: [GAME_COLORS.primary.orange, GAME_COLORS.primary.coral] as const,
  },
  target_lock: {
    icon: 'locate-outline',
    colors: [GAME_COLORS.primary.coral, '#DC2626'] as const,
    targetIcon: 'crosshairs-sharp' as keyof typeof Ionicons.glyphMap,
    targetText: 'TARGETED',
    targetColors: [GAME_COLORS.primary.coral, '#DC2626'] as const,
  },
  chaos_card: {
    icon: 'shuffle-outline',
    colors: [GAME_COLORS.primary.purple, '#7C3AED'] as const,
  },
  streak_shield: {
    icon: 'shield-checkmark',
    colors: [GAME_COLORS.energy.cyan, GAME_COLORS.energy.blue] as const,
  },
};

export function PowerIndicator({
  powerType,
  size = 'small',
  isTarget = false,
  showTooltip = false,
}: PowerIndicatorProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const config = INDICATOR_CONFIG[powerType];
  const sizeConfig = SIZE_CONFIG[size];

  // Animation values
  const pulse = useSharedValue(0);
  const targetPulse = useSharedValue(1);

  useEffect(() => {
    // Subtle pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // For target lock targets, add a more aggressive pulse
    if (isTarget && powerType === 'target_lock') {
      targetPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isTarget, powerType]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = isTarget && powerType === 'target_lock' ? targetPulse.value : 1;
    const opacity = interpolate(pulse.value, [0, 1], [0.85, 1]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(pulse.value, [0, 1], [0.3, 0.6]);
    return {
      shadowOpacity: glowOpacity,
    };
  });

  // Determine what to render based on power type and target status
  const renderContent = () => {
    // Special case: target_lock on the targeted player
    if (isTarget && powerType === 'target_lock') {
      return (
        <>
          <Ionicons
            name="locate"
            size={sizeConfig.icon}
            color={colors.textPrimary}
          />
          {size === 'medium' && (
            <Text style={[styles.text, { fontSize: sizeConfig.text }]}>
              TARGETED
            </Text>
          )}
        </>
      );
    }

    // Double chance shows "x2"
    if (powerType === 'double_chance') {
      return (
        <Text style={[styles.doubleText, { fontSize: sizeConfig.text + 2 }]}>
          x2
        </Text>
      );
    }

    // Streak shield shows shield icon
    if (powerType === 'streak_shield') {
      return (
        <Ionicons
          name="shield-checkmark"
          size={sizeConfig.icon}
          color={colors.textPrimary}
        />
      );
    }

    // Default: show icon from config
    if (config.icon) {
      return (
        <Ionicons
          name={config.icon}
          size={sizeConfig.icon}
          color={colors.textPrimary}
        />
      );
    }

    return null;
  };

  // Determine gradient colors
  const gradientColors = isTarget && config.targetColors
    ? config.targetColors
    : config.colors;

  // Platform-specific glow
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 8px ${gradientColors[0]}`,
    } as any,
    default: {
      shadowColor: gradientColors[0],
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 6,
      elevation: 4,
    },
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[animatedStyle, animatedGlowStyle, glowStyle]}>
        <LinearGradient
          colors={gradientColors as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            {
              height: sizeConfig.container.height,
              paddingHorizontal: sizeConfig.container.paddingHorizontal,
              borderRadius: sizeConfig.container.borderRadius,
            },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </Animated.View>

      {/* Tooltip for target indicator */}
      {showTooltip && tooltipVisible && isTarget && powerType === 'target_lock' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>You are targeted!</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}
    </View>
  );
}

// Convenience component for showing streak shield next to streak count
interface StreakShieldIndicatorProps {
  streakDays: number;
  hasShield: boolean;
  size?: 'small' | 'medium';
}

export function StreakShieldIndicator({
  streakDays,
  hasShield,
  size = 'small',
}: StreakShieldIndicatorProps) {
  if (!hasShield) return null;

  return (
    <View style={styles.streakShieldWrapper}>
      <PowerIndicator powerType="streak_shield" size={size} />
    </View>
  );
}

// Convenience component for double chance badge
interface DoubleChanceBadgeProps {
  size?: 'small' | 'medium';
}

export function DoubleChanceBadge({ size = 'small' }: DoubleChanceBadgeProps) {
  return <PowerIndicator powerType="double_chance" size={size} />;
}

// Target crosshair component for target_lock
interface TargetCrosshairProps {
  size?: 'small' | 'medium';
}

export function TargetCrosshair({ size = 'small' }: TargetCrosshairProps) {
  return <PowerIndicator powerType="target_lock" size={size} isTarget />;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  doubleText: {
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  streakShieldWrapper: {
    marginLeft: spacing.xs,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%' as any,
    left: '50%' as any,
    transform: [{ translateX: -50 }],
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GAME_COLORS.primary.coral,
  },
  tooltipText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: GAME_COLORS.primary.coral,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%' as any,
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: GAME_COLORS.primary.coral,
  },
});

export default PowerIndicator;

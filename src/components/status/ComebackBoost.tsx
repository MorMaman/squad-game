/**
 * ComebackBoost.tsx
 * Animated pulsing glow effect for comeback status
 * Shows "Comeback" label badge with bonus XP multiplier
 * Active for one day after poor performance
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../../theme/gameColors';
import { StatusTooltip } from './StatusTooltip';

export interface ComebackBoostProps {
  /** Whether the comeback boost is currently active */
  isActive: boolean;
  /** The XP multiplier bonus (e.g., 1.5 for 50% bonus) */
  bonusMultiplier: number;
  /** When the comeback boost expires */
  expiresAt: Date | number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show extended label with multiplier */
  showLabel?: boolean;
  /** Custom tooltip content */
  tooltipTitle?: string;
  tooltipDescription?: string;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    height: 22,
    paddingHorizontal: 8,
    fontSize: 10,
    iconSize: 12,
    gap: 4,
  },
  medium: {
    height: 28,
    paddingHorizontal: 12,
    fontSize: 12,
    iconSize: 14,
    gap: 6,
  },
  large: {
    height: 34,
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 18,
    gap: 8,
  },
};

// Comeback boost colors - vibrant cyan/blue gradient
const COMEBACK_PRIMARY = GAME_COLORS.energy.cyan;
const COMEBACK_SECONDARY = GAME_COLORS.energy.blue;
const COMEBACK_GRADIENT: readonly [string, string, ...string[]] = [
  COMEBACK_PRIMARY,
  COMEBACK_SECONDARY,
];

export function ComebackBoost({
  isActive,
  bonusMultiplier,
  expiresAt,
  size = 'medium',
  showLabel = true,
  tooltipTitle = 'Comeback Boost',
  tooltipDescription,
}: ComebackBoostProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const sizeConfig = SIZE_CONFIG[size];

  // Animation values
  const glowPulse = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const pressScale = useSharedValue(1);

  // Calculate time remaining
  useEffect(() => {
    if (!isActive) return;

    const updateTimer = () => {
      const target = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();
      const now = Date.now();
      const remaining = Math.max(0, target - now);

      if (remaining <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isActive, expiresAt]);

  // Initialize animations
  useEffect(() => {
    if (isActive) {
      // Pulsing glow effect - more pronounced for comeback
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Icon scale pulse
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowPulse.value = withTiming(0, { duration: 300 });
      iconScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(glowPulse.value, [0, 1], [0.5, 1]);
    const glowRadius = interpolate(glowPulse.value, [0, 1], [8, 18]);
    const scale = interpolate(glowPulse.value, [0, 1], [1, 1.02]);

    return {
      transform: [{ scale: pressScale.value * scale }],
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Press handlers
  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, GAME_SPRINGS.bouncy);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, GAME_SPRINGS.bouncy);
  };

  const handlePress = () => {
    setShowTooltip(true);
  };

  // Generate description
  const bonusPercent = Math.round((bonusMultiplier - 1) * 100);
  const description = tooltipDescription ||
    `You're earning ${bonusPercent}% bonus XP! This comeback boost was activated because of your previous performance. Make the most of it - expires in ${timeLeft}.`;

  // Platform-specific shadow
  const shadowStyle = Platform.select({
    web: {
      boxShadow: `0 0 15px ${COMEBACK_PRIMARY}`,
    } as any,
    default: {
      shadowColor: COMEBACK_PRIMARY,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
  });

  if (!isActive) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <Animated.View style={[shadowStyle, animatedContainerStyle]}>
          <LinearGradient
            colors={COMEBACK_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.container,
              {
                height: sizeConfig.height,
                paddingHorizontal: sizeConfig.paddingHorizontal,
                gap: sizeConfig.gap,
              },
            ]}
          >
            {/* Rocket/Arrow up icon for comeback */}
            <Animated.View style={animatedIconStyle}>
              <Ionicons
                name="rocket"
                size={sizeConfig.iconSize}
                color={colors.textPrimary}
              />
            </Animated.View>

            {/* Label and multiplier */}
            {showLabel && (
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.label,
                    { fontSize: sizeConfig.fontSize },
                  ]}
                >
                  COMEBACK
                </Text>
                {size !== 'small' && (
                  <Text
                    style={[
                      styles.multiplier,
                      { fontSize: sizeConfig.fontSize },
                    ]}
                  >
                    x{bonusMultiplier.toFixed(1)}
                  </Text>
                )}
              </View>
            )}

            {/* Multiplier only (when no label or small size) */}
            {(!showLabel || size === 'small') && (
              <Text
                style={[
                  styles.multiplierOnly,
                  { fontSize: sizeConfig.fontSize + 2 },
                ]}
              >
                x{bonusMultiplier.toFixed(1)}
              </Text>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Tooltip */}
      <StatusTooltip
        title={tooltipTitle}
        description={description}
        isVisible={showTooltip}
        onDismiss={() => setShowTooltip(false)}
        accentColor={COMEBACK_PRIMARY}
      />
    </>
  );
}

/**
 * Compact indicator for lists - just shows the multiplier
 */
export interface ComebackIndicatorProps {
  isActive: boolean;
  bonusMultiplier: number;
}

export function ComebackIndicator({ isActive, bonusMultiplier }: ComebackIndicatorProps) {
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowPulse.value, [0, 1], [0.7, 1]);
    return { opacity };
  });

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.indicator, animatedStyle]}>
      <Ionicons name="rocket" size={10} color={COMEBACK_PRIMARY} />
      <Text style={styles.indicatorText}>x{bonusMultiplier.toFixed(1)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  labelContainer: {
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  multiplier: {
    fontWeight: typography.weightExtrabold,
    color: GAME_COLORS.reward.gold,
    marginTop: -2,
  },
  multiplierOnly: {
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COMEBACK_PRIMARY}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  indicatorText: {
    fontSize: 9,
    fontWeight: typography.weightBold,
    color: COMEBACK_PRIMARY,
  },
});

export default ComebackBoost;

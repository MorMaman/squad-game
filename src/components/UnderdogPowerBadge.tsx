/**
 * UnderdogPowerBadge.tsx
 * Shows active underdog power with countdown timer and pulsing glow animation
 * Displays icon based on power type with red/orange gradient background
 */

import React, { useEffect, useState } from 'react';
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
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../theme/gameColors';

// Underdog power types
export type UnderdogPowerType = 'double_chance' | 'target_lock' | 'chaos_card' | 'streak_shield';

interface UnderdogPowerBadgeProps {
  /** The type of underdog power */
  powerType: UnderdogPowerType;
  /** When the power expires (timestamp or Date) */
  expiresAt: Date | number;
  /** Optional press handler */
  onPress?: () => void;
  /** Whether to show the "UNDERDOG ACTIVE" label */
  showLabel?: boolean;
}

// Power type configurations
const POWER_CONFIG: Record<UnderdogPowerType, {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}> = {
  double_chance: {
    icon: 'copy-outline',
    label: 'Double Chance',
    description: 'Two attempts at the challenge',
  },
  target_lock: {
    icon: 'locate-outline',
    label: 'Target Lock',
    description: 'Lock onto a leader',
  },
  chaos_card: {
    icon: 'shuffle-outline',
    label: 'Chaos Card',
    description: 'Random rule modification',
  },
  streak_shield: {
    icon: 'shield-outline',
    label: 'Streak Shield',
    description: 'Protect your streak',
  },
};

export function UnderdogPowerBadge({
  powerType,
  expiresAt,
  onPress,
  showLabel = true,
}: UnderdogPowerBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const config = POWER_CONFIG[powerType];

  // Animation values
  const glowPulse = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const badgeScale = useSharedValue(1);

  // Calculate and update time left
  useEffect(() => {
    const target = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();

    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, target - now);
      setTimeLeft(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Initialize animations
  useEffect(() => {
    // Pulsing glow effect
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Icon scale pulse
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Format time remaining
  const formatTimeLeft = () => {
    if (timeLeft <= 0) return 'EXPIRED';

    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Animated styles
  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowPulse.value, [0, 1], [0.4, 0.9]);
    const radius = interpolate(glowPulse.value, [0, 1], [15, 30]);

    return {
      opacity,
      shadowRadius: radius,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  const animatedBadgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });

  // Handle press animation
  const handlePressIn = () => {
    badgeScale.value = withSpring(0.95, GAME_SPRINGS.bouncy);
  };

  const handlePressOut = () => {
    badgeScale.value = withSpring(1, GAME_SPRINGS.bouncy);
  };

  // Platform-specific glow effect
  const glowStyle = Platform.select({
    web: {
      boxShadow: '0 0 25px rgba(255, 107, 0, 0.7)',
    } as any,
    default: {
      shadowColor: GAME_COLORS.primary.orange,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 15,
    },
  });

  const content = (
    <Animated.View style={[styles.container, animatedBadgeStyle, glowStyle, animatedGlowStyle]}>
      <LinearGradient
        colors={['#FF6B00', '#EF4444', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated glow overlay */}
        <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />

        <View style={styles.content}>
          {/* Power Icon */}
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <View style={styles.iconBackground}>
              <Ionicons
                name={config.icon}
                size={28}
                color={colors.textPrimary}
              />
            </View>
          </Animated.View>

          {/* Power Info */}
          <View style={styles.infoContainer}>
            {showLabel && (
              <Text style={styles.activeLabel}>UNDERDOG ACTIVE</Text>
            )}
            <Text style={styles.powerName}>{config.label}</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.timerText}>{formatTimeLeft()}</Text>
            </View>
          </View>

          {/* Chevron if pressable */}
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
              style={styles.chevron}
            />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    position: 'relative',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 107, 0, 0.3)',
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoContainer: {
    flex: 1,
  },
  activeLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  powerName: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timerText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});

export default UnderdogPowerBadge;

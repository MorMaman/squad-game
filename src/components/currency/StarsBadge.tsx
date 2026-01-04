/**
 * StarsBadge.tsx
 * Animated stars display component showing the star count with icon
 * Features glow effect, pulse animation when stars change, and formatted numbers
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { formatStars } from '../../types/stars';

export interface StarsBadgeProps {
  /** Current star count */
  stars: number;
  /** Size variant */
  variant?: 'compact' | 'full';
  /** Show add button */
  showAddButton?: boolean;
  /** Callback when add button is pressed */
  onAddPress?: () => void;
  /** Whether to animate glow */
  animated?: boolean;
  /** Whether stars recently changed (triggers pulse) */
  recentlyChanged?: boolean;
}

const STAR_GOLD = '#FFD700';
const STAR_GRADIENT = ['#FFD700', '#FFA500'] as const;

export function StarsBadge({
  stars,
  variant = 'full',
  showAddButton = false,
  onAddPress,
  animated = true,
  recentlyChanged = false,
}: StarsBadgeProps) {
  const { t } = useTranslation();

  // Store previous value to detect changes
  const previousStars = useRef(stars);

  // Animation values
  const glowIntensity = useSharedValue(0.5);
  const starScale = useSharedValue(1);
  const starRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Glow animation (continuous)
  useEffect(() => {
    if (!animated) return;

    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle star rotation
    starRotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [animated]);

  // Pulse animation when stars change
  useEffect(() => {
    if (stars !== previousStars.current || recentlyChanged) {
      // Star icon bounce
      starScale.value = withSequence(
        withSpring(1.4, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 6, stiffness: 200 })
      );

      // Pulse ring effect
      pulseScale.value = 1;
      pulseOpacity.value = 0.8;

      pulseScale.value = withTiming(2, { duration: 600, easing: Easing.out(Easing.ease) });
      pulseOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });

      previousStars.current = stars;
    }
  }, [stars, recentlyChanged]);

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: starScale.value },
      { rotate: `${starRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowIntensity.value, [0.5, 1], [8, 16]);
    const shadowOpacity = interpolate(glowIntensity.value, [0.5, 1], [0.4, 0.8]);

    return {
      shadowColor: STAR_GOLD,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const isCompact = variant === 'compact';
  const iconSize = isCompact ? 16 : 24;
  const fontSize = isCompact ? typography.sizeSm : typography.sizeLg;

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <Animated.View style={[styles.badge, glowAnimatedStyle, isCompact && styles.badgeCompact]}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 165, 0, 0.1)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Pulse ring */}
        <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />

        <View style={styles.content}>
          {/* Star Icon */}
          <Animated.View style={starAnimatedStyle}>
            <Ionicons
              name="star"
              size={iconSize}
              color={STAR_GOLD}
            />
          </Animated.View>

          {/* Star Count */}
          <Text style={[styles.starsText, { fontSize }]}>
            {formatStars(stars)}
          </Text>
        </View>

        {/* Add Button */}
        {showAddButton && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={STAR_GRADIENT}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={14} color={colors.backgroundDark} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerCompact: {
    // No additional styles needed
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    minWidth: 90,
  },
  badgeCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starsText: {
    color: STAR_GOLD,
    fontWeight: typography.weightBold,
    letterSpacing: 0.5,
  },
  pulseRing: {
    position: 'absolute',
    top: '50%',
    left: spacing.md,
    width: 24,
    height: 24,
    marginTop: -12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: STAR_GOLD,
  },
  addButton: {
    marginLeft: spacing.sm,
  },
  addButtonGradient: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StarsBadge;

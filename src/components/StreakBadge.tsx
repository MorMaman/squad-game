import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, streakConfig, typography, spacing, borderRadius } from '../theme/colors';

interface StreakBadgeProps {
  days: number;
  isAtRisk?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const sizes = {
  small: { iconSize: 16, fontSize: typography.sizeXs, padding: spacing.xs, minWidth: 40 },
  medium: { iconSize: 24, fontSize: typography.sizeSm, padding: spacing.sm, minWidth: 56 },
  large: { iconSize: 32, fontSize: typography.sizeMd, padding: spacing.md, minWidth: 72 },
};

export function StreakBadge({
  days,
  isAtRisk = false,
  showLabel = true,
  size = 'medium',
  animated = true,
}: StreakBadgeProps) {
  const tier = streakConfig.getTier(days);
  const tierColor = streakConfig.tiers[tier].color;
  const tierLabel = streakConfig.tiers[tier].label;
  const sizeConfig = sizes[size];

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const glowIntensity = useSharedValue(0.5);

  useEffect(() => {
    if (!animated) return;

    // Different animations based on tier
    if (tier === 'legendary') {
      // Legendary: Continuous golden glow pulse + subtle rotation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 500 }),
          withTiming(5, { duration: 500 })
        ),
        -1,
        true
      );
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        true
      );
    } else if (tier === 'fire') {
      // Fire: Rapid flicker + scale pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 150 }),
          withTiming(3, { duration: 150 })
        ),
        -1,
        true
      );
    } else if (tier === 'hot') {
      // Hot: Moderate pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      // Warm: Gentle breathing
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }

    // At risk: Add warning pulsing
    if (isAtRisk) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [tier, isAtRisk, animated]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowIntensity.value,
    };
  });

  // Get the appropriate flame icon based on tier
  const getFlameIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (tier) {
      case 'legendary':
        return 'flame';
      case 'fire':
        return 'flame';
      case 'hot':
        return 'flame';
      default:
        return 'flame-outline';
    }
  };

  // Platform-specific glow effect
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 ${tier === 'legendary' ? 20 : 10}px ${tierColor}`,
    } as any,
    default: {
      shadowColor: tierColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: tier === 'legendary' ? 15 : 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          padding: sizeConfig.padding,
          minWidth: sizeConfig.minWidth,
          borderColor: isAtRisk ? colors.warning : tierColor,
        },
        animated && animatedContainerStyle,
      ]}
    >
      {/* Glow background for higher tiers */}
      {(tier === 'fire' || tier === 'legendary') && (
        <Animated.View
          style={[
            styles.glowBackground,
            { backgroundColor: tierColor },
            glowStyle,
            animated && animatedGlowStyle,
          ]}
        />
      )}

      <View style={styles.content}>
        {/* Flame Icon */}
        <Animated.View style={animated ? animatedIconStyle : undefined}>
          <Ionicons
            name={getFlameIcon()}
            size={sizeConfig.iconSize}
            color={tierColor}
          />
          {/* Extra sparkles for legendary */}
          {tier === 'legendary' && (
            <View style={styles.sparkleContainer}>
              <Ionicons
                name="sparkles"
                size={sizeConfig.iconSize / 2}
                color={colors.energy}
                style={styles.sparkle}
              />
            </View>
          )}
        </Animated.View>

        {/* Days count */}
        <Text
          style={[
            styles.daysText,
            { fontSize: sizeConfig.fontSize, color: tierColor },
          ]}
        >
          {days}
        </Text>
      </View>

      {/* Label */}
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: sizeConfig.fontSize - 2 },
            isAtRisk && styles.atRiskLabel,
          ]}
        >
          {isAtRisk ? 'At Risk!' : tierLabel}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  daysText: {
    fontWeight: typography.weightBold,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
    marginTop: 2,
  },
  atRiskLabel: {
    color: colors.warning,
    fontWeight: typography.weightBold,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  sparkle: {
    transform: [{ rotate: '15deg' }],
  },
});

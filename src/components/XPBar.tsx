import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, gradients, typography, spacing, borderRadius, levelConfig } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  showNumbers?: boolean;
  showLevelBadge?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  glowEffect?: boolean;
}

const sizes = {
  small: { height: 8, fontSize: typography.sizeXs, badgeSize: 20, iconSize: 10 },
  medium: { height: 12, fontSize: typography.sizeSm, badgeSize: 28, iconSize: 14 },
  large: { height: 20, fontSize: typography.sizeMd, badgeSize: 36, iconSize: 18 },
};

export function XPBar({
  currentXP,
  maxXP,
  level,
  showNumbers = true,
  showLevelBadge = true,
  animated = true,
  size = 'medium',
  glowEffect = true,
}: XPBarProps) {
  const progress = useSharedValue(0);
  const glow = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  const targetProgress = Math.min(currentXP / maxXP, 1);
  const sizeConfig = sizes[size];

  useEffect(() => {
    if (animated) {
      // Animate the progress bar fill
      progress.value = withTiming(targetProgress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });

      // Pulse glow effect
      if (glowEffect) {
        glow.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }

      // Bounce the level badge
      badgeScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    } else {
      progress.value = targetProgress;
    }
  }, [currentXP, maxXP, animated, glowEffect]);

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glow.value,
    };
  });

  const animatedBadgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });

  const levelTitle = levelConfig.getTitle(level);

  // Platform-specific glow style
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 10px ${colors.glowPurple}`,
    } as any,
    default: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
  });

  return (
    <View style={styles.container}>
      {/* Level Badge */}
      {showLevelBadge && (
        <Animated.View
          style={[
            styles.levelBadge,
            {
              width: sizeConfig.badgeSize,
              height: sizeConfig.badgeSize,
              borderRadius: sizeConfig.badgeSize / 2,
            },
            animatedBadgeStyle,
          ]}
        >
          <Ionicons name="star" size={sizeConfig.iconSize} color={colors.energy} />
          <Text style={[styles.levelText, { fontSize: sizeConfig.fontSize }]}>{level}</Text>
        </Animated.View>
      )}

      {/* Progress Bar Container */}
      <View style={styles.barWrapper}>
        <View
          style={[
            styles.barBackground,
            { height: sizeConfig.height, borderRadius: sizeConfig.height / 2 },
          ]}
        >
          {/* Animated Fill */}
          <Animated.View
            style={[
              styles.barFill,
              { height: sizeConfig.height, borderRadius: sizeConfig.height / 2 },
              animatedFillStyle,
            ]}
          >
            {/* Gradient overlay using multiple views */}
            <View style={styles.gradientOverlay}>
              <View style={[styles.gradientPart, { backgroundColor: gradients.xp[0] }]} />
              <View style={[styles.gradientPart, { backgroundColor: gradients.xp[1] }]} />
            </View>

            {/* Glow effect on leading edge */}
            {glowEffect && (
              <Animated.View
                style={[
                  styles.glowEdge,
                  {
                    height: sizeConfig.height,
                    width: sizeConfig.height,
                    borderRadius: sizeConfig.height / 2,
                  },
                  glowStyle,
                  animatedGlowStyle,
                ]}
              />
            )}
          </Animated.View>
        </View>

        {/* XP Numbers */}
        {showNumbers && (
          <View style={styles.numbersContainer}>
            <Text style={[styles.xpText, { fontSize: sizeConfig.fontSize }]}>
              {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
            </Text>
            <Text style={[styles.levelTitleText, { fontSize: sizeConfig.fontSize - 2 }]}>
              {levelTitle}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  levelText: {
    color: colors.textPrimary,
    fontWeight: typography.weightBold,
  },
  barWrapper: {
    flex: 1,
  },
  barBackground: {
    backgroundColor: colors.backgroundCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradientPart: {
    flex: 1,
  },
  glowEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: colors.secondary,
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  xpText: {
    color: colors.textPrimary,
    fontWeight: typography.weightSemibold,
  },
  levelTitleText: {
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
  },
});

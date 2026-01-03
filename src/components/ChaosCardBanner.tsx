/**
 * ChaosCardBanner.tsx
 * Full-width banner shown before an event when chaos card is active
 * Features animated entrance (slide down) with purple/chaos gradient
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../theme/gameColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChaosCardBannerProps {
  /** The name of the chaos rule being applied */
  ruleName: string;
  /** The player who activated the chaos card */
  activatedBy: string;
  /** Optional description of the rule effect */
  ruleDescription?: string;
  /** Whether the banner is visible */
  visible?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// Predefined chaos rules for variety
export const CHAOS_RULES = {
  DOUBLE_POINTS: {
    name: 'Double Points',
    description: 'All points earned this round are doubled!',
  },
  REVERSE_ORDER: {
    name: 'Reverse Order',
    description: 'Last place wins, first place loses!',
  },
  SPEED_ROUND: {
    name: 'Speed Round',
    description: 'Time limit cut in half!',
  },
  MYSTERY_PENALTY: {
    name: 'Mystery Penalty',
    description: 'Random player loses 10 points!',
  },
  POWER_SURGE: {
    name: 'Power Surge',
    description: 'All active powers are amplified!',
  },
  IMMUNITY_BREAK: {
    name: 'Immunity Break',
    description: 'All shields are temporarily disabled!',
  },
  BONUS_XP: {
    name: 'Bonus XP',
    description: 'Everyone earns 2x XP this round!',
  },
  WILDCARD: {
    name: 'Wildcard',
    description: 'Anything can happen...',
  },
} as const;

export function ChaosCardBanner({
  ruleName,
  activatedBy,
  ruleDescription,
  visible = true,
  onAnimationComplete,
}: ChaosCardBannerProps) {
  // Animation values
  const slideY = useSharedValue(-150);
  const scale = useSharedValue(0.8);
  const iconRotate = useSharedValue(0);
  const shimmerPosition = useSharedValue(-SCREEN_WIDTH);
  const glowOpacity = useSharedValue(0.3);
  const borderPulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Slide down with bounce
      slideY.value = withSpring(0, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      });

      // Scale up
      scale.value = withSpring(1, GAME_SPRINGS.bouncy);

      // Rotate icon continuously
      iconRotate.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // Shimmer effect
      shimmerPosition.value = withRepeat(
        withSequence(
          withTiming(SCREEN_WIDTH, { duration: 2000, easing: Easing.linear }),
          withTiming(-SCREEN_WIDTH, { duration: 0 })
        ),
        -1,
        false
      );

      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Border color pulse
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Trigger animation complete callback
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 500);
      }
    } else {
      // Slide up to hide
      slideY.value = withSpring(-150, GAME_SPRINGS.snappy);
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: slideY.value },
        { scale: scale.value },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${iconRotate.value}deg` },
      ],
    };
  });

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerPosition.value }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolate(
      borderPulse.value,
      [0, 1],
      [0.3, 0.8]
    );

    return {
      shadowOpacity: glowOpacity.value,
      borderColor: `rgba(155, 89, 255, ${borderColor})`,
    };
  });

  if (!visible) return null;

  // Platform-specific glow
  const glowStyle = Platform.select({
    web: {
      boxShadow: '0 0 30px rgba(155, 89, 255, 0.6)',
    } as any,
    default: {
      shadowColor: GAME_COLORS.primary.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 20,
      elevation: 15,
    },
  });

  return (
    <Animated.View style={[styles.wrapper, containerAnimatedStyle]}>
      <Animated.View style={[styles.container, glowStyle, glowAnimatedStyle]}>
        <LinearGradient
          colors={['#6366f1', '#9B59FF', '#EC4899', '#FF2D92']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Shimmer effect overlay */}
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>

          {/* Chaos pattern background */}
          <View style={styles.patternOverlay}>
            {[...Array(6)].map((_, i) => (
              <Ionicons
                key={i}
                name="shuffle"
                size={40}
                color="rgba(255, 255, 255, 0.05)"
                style={[
                  styles.patternIcon,
                  { left: `${(i * 20) - 10}%`, top: i % 2 === 0 ? -5 : 15 },
                ]}
              />
            ))}
          </View>

          <View style={styles.content}>
            {/* Left side: Chaos icon */}
            <View style={styles.iconSection}>
              <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
                <View style={styles.iconBackground}>
                  <Ionicons
                    name="shuffle-outline"
                    size={32}
                    color={colors.textPrimary}
                  />
                </View>
              </Animated.View>
            </View>

            {/* Center: Rule info */}
            <View style={styles.textSection}>
              <View style={styles.labelRow}>
                <Ionicons name="warning" size={14} color={GAME_COLORS.reward.gold} />
                <Text style={styles.chaosLabel}>CHAOS CARD ACTIVE</Text>
                <Ionicons name="warning" size={14} color={GAME_COLORS.reward.gold} />
              </View>

              <Text style={styles.ruleName}>{ruleName}</Text>

              {ruleDescription && (
                <Text style={styles.ruleDescription}>{ruleDescription}</Text>
              )}

              <View style={styles.activatedRow}>
                <Ionicons name="person" size={12} color={colors.textSecondary} />
                <Text style={styles.activatedBy}>
                  Activated by <Text style={styles.playerName}>{activatedBy}</Text>
                </Text>
              </View>
            </View>

            {/* Right side: Decorative sparks */}
            <View style={styles.sparkSection}>
              <Ionicons
                name="sparkles"
                size={24}
                color={GAME_COLORS.reward.gold}
              />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

// Compact version for inline display
interface ChaosCardBadgeProps {
  ruleName: string;
  size?: 'small' | 'medium';
}

export function ChaosCardBadge({ ruleName, size = 'small' }: ChaosCardBadgeProps) {
  const iconSize = size === 'small' ? 14 : 18;
  const fontSize = size === 'small' ? typography.sizeXs : typography.sizeSm;
  const padding = size === 'small' ? spacing.xs : spacing.sm;

  return (
    <LinearGradient
      colors={['#6366f1', '#9B59FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { paddingHorizontal: padding, paddingVertical: padding / 2 }]}
    >
      <Ionicons name="shuffle-outline" size={iconSize} color={colors.textPrimary} />
      <Text style={[styles.badgeText, { fontSize }]}>{ruleName}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    zIndex: 100,
  },
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 255, 0.5)',
  },
  gradient: {
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternIcon: {
    position: 'absolute',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSection: {
    marginRight: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  textSection: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  chaosLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: GAME_COLORS.reward.gold,
    letterSpacing: 2,
  },
  ruleName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: typography.sizeSm,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  activatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activatedBy: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
  },
  playerName: {
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  sparkSection: {
    marginLeft: spacing.sm,
    opacity: 0.9,
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
});

export default ChaosCardBanner;

/**
 * JudgeBonusPenalty.tsx
 * Shows judge bonus/penalty status with animated icons
 * Displays star/coin for bonus earned, warning for penalty when overturned
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GAME_COLORS } from '../../theme/gameColors';

// Battle Game UI Colors
const JUDGE_COLORS = {
  LIME: '#A3E635',
  CYAN: '#00D4FF',
  PURPLE: '#9B59FF',
  GOLD: '#FFD700',
  RED: '#EF4444',
  DARK_BG: '#0A0E27',
  CARD_BG: '#16213E',
};

export interface JudgeBonusPenaltyProps {
  /** Whether the judge earned a bonus */
  hasBonus?: boolean;
  /** Whether the judge received a penalty */
  hasPenalty?: boolean;
  /** Bonus amount in points */
  bonusAmount?: number;
  /** Penalty amount in points */
  penaltyAmount?: number;
  /** Whether the decision was overturned (shows overturned marker) */
  isOverturned?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
}

export function JudgeBonusPenalty({
  hasBonus = false,
  hasPenalty = false,
  bonusAmount = 10,
  penaltyAmount = 10,
  isOverturned = false,
  compact = false,
  animateOnMount = true,
}: JudgeBonusPenaltyProps) {
  // Animation values
  const iconScale = useSharedValue(animateOnMount ? 0 : 1);
  const iconRotation = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const pointsOpacity = useSharedValue(animateOnMount ? 0 : 1);
  const pointsTranslateY = useSharedValue(animateOnMount ? 10 : 0);

  useEffect(() => {
    if (animateOnMount) {
      // Icon entrance animation
      iconScale.value = withDelay(
        100,
        withSpring(1, {
          damping: 8,
          stiffness: 200,
        })
      );

      // Points fade in
      pointsOpacity.value = withDelay(
        300,
        withTiming(1, { duration: 400 })
      );
      pointsTranslateY.value = withDelay(
        300,
        withSpring(0, { damping: 12 })
      );
    }

    // Continuous glow animation
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Icon rotation for bonus (star spin)
    if (hasBonus) {
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2000 }),
          withTiming(360, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }

    // Icon shake for penalty
    if (hasPenalty) {
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 100 }),
          withTiming(8, { duration: 100 }),
          withTiming(-6, { duration: 100 }),
          withTiming(6, { duration: 100 }),
          withTiming(0, { duration: 100 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      );
    }
  }, [hasBonus, hasPenalty, animateOnMount]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const color = hasBonus ? JUDGE_COLORS.GOLD : JUDGE_COLORS.RED;
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [8, 20]);
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.4, 0.8]);

    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const pointsStyle = useAnimatedStyle(() => ({
    opacity: pointsOpacity.value,
    transform: [{ translateY: pointsTranslateY.value }],
  }));

  // Determine what to show
  const showBonus = hasBonus && !hasPenalty && !isOverturned;
  const showPenalty = hasPenalty || isOverturned;

  if (!showBonus && !showPenalty) {
    return null;
  }

  const iconColor = showBonus ? JUDGE_COLORS.GOLD : JUDGE_COLORS.RED;
  const pointsText = showBonus ? `+${bonusAmount}` : `-${penaltyAmount}`;
  const gradientColors = showBonus
    ? ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']
    : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'];

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, glowStyle]}>
        <Animated.View style={iconAnimatedStyle}>
          {showBonus ? (
            <MaterialCommunityIcons name="star" size={16} color={iconColor} />
          ) : (
            <Ionicons name="warning" size={16} color={iconColor} />
          )}
        </Animated.View>
        <Text style={[styles.compactPoints, { color: iconColor }]}>
          {pointsText}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, glowStyle]}>
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          {showBonus ? (
            <MaterialCommunityIcons name="star" size={32} color={iconColor} />
          ) : (
            <Ionicons name="warning" size={32} color={iconColor} />
          )}
        </Animated.View>

        {/* Points display */}
        <Animated.View style={[styles.pointsContainer, pointsStyle]}>
          <Text style={[styles.pointsText, { color: iconColor }]}>
            {pointsText}
          </Text>
          <Text style={styles.pointsLabel}>
            {showBonus ? 'Judge Bonus' : 'Judge Penalty'}
          </Text>
        </Animated.View>

        {/* Overturned marker */}
        {isOverturned && (
          <View style={styles.overturnedBadge}>
            <MaterialCommunityIcons
              name="close-circle"
              size={14}
              color={JUDGE_COLORS.RED}
            />
            <Text style={styles.overturnedText}>OVERTURNED</Text>
          </View>
        )}

        {/* Description */}
        <Text style={styles.description}>
          {showBonus
            ? 'Decision was approved by the squad'
            : isOverturned
            ? 'Decision was overturned by the squad'
            : 'Penalty received for challenged decision'}
        </Text>

        {/* Web glow fallback */}
        {Platform.OS === 'web' && (
          <View style={[styles.webGlow, { backgroundColor: iconColor }]} />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * JudgeBonusBadge - Small inline badge showing bonus/penalty
 * For use in event history or leaderboards
 */
export interface JudgeBonusBadgeProps {
  type: 'bonus' | 'penalty';
  amount?: number;
  showAmount?: boolean;
}

export function JudgeBonusBadge({
  type,
  amount = 10,
  showAmount = true,
}: JudgeBonusBadgeProps) {
  const isBonus = type === 'bonus';
  const iconColor = isBonus ? JUDGE_COLORS.GOLD : JUDGE_COLORS.RED;
  const backgroundColor = isBonus
    ? 'rgba(255, 215, 0, 0.15)'
    : 'rgba(239, 68, 68, 0.15)';

  return (
    <View style={[styles.badgeContainer, { backgroundColor }]}>
      {isBonus ? (
        <MaterialCommunityIcons name="star" size={12} color={iconColor} />
      ) : (
        <Ionicons name="warning" size={12} color={iconColor} />
      )}
      {showAmount && (
        <Text style={[styles.badgeText, { color: iconColor }]}>
          {isBonus ? '+' : '-'}{amount}
        </Text>
      )}
    </View>
  );
}

/**
 * OverturnedMarker - Shows that a decision was overturned
 * For use in event history
 */
export function OverturnedMarker() {
  return (
    <View style={styles.overturnedMarker}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={14}
        color={JUDGE_COLORS.RED}
      />
      <Text style={styles.overturnedMarkerText}>Overturned</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsContainer: {
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overturnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  overturnedText: {
    fontSize: 11,
    fontWeight: '700',
    color: JUDGE_COLORS.RED,
    letterSpacing: 1,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  webGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.2,
    top: -20,
    zIndex: -1,
    ...(Platform.OS === 'web' && ({
      filter: 'blur(30px)',
    } as any)),
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: JUDGE_COLORS.CARD_BG,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  compactPoints: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Badge styles
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Overturned marker styles
  overturnedMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overturnedMarkerText: {
    fontSize: 12,
    fontWeight: '600',
    color: JUDGE_COLORS.RED,
  },
});

export default JudgeBonusPenalty;

/**
 * AnimatedNumber - Number counting animation with dopamine-inducing effects
 * Numbers count up over time with scale pop and color flash
 * Never just change numbers - animate them for maximum dopamine!
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { GameHaptics } from '../../utils/haptics';

export interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Duration of the counting animation in ms (default: 800) */
  duration?: number;
  /** Text style for the number */
  textStyle?: StyleProp<TextStyle>;
  /** Prefix before the number (e.g., "+", "$") */
  prefix?: string;
  /** Suffix after the number (e.g., " XP", "pts") */
  suffix?: string;
  /** Color when value increases */
  flashColor?: string;
  /** Final color after flash */
  finalColor?: string;
  /** Enable haptic feedback during counting */
  hapticEnabled?: boolean;
  /** Format large numbers with commas */
  formatNumber?: boolean;
  /** Number of decimal places */
  decimals?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function AnimatedNumber({
  value,
  duration = GAME_DURATIONS.counting,
  textStyle,
  prefix = '',
  suffix = '',
  flashColor = GAME_COLORS.reward.gold,
  finalColor = GAME_COLORS.accent.ice,
  hapticEnabled = true,
  formatNumber = true,
  decimals = 0,
  onComplete,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  // Track previous value to determine direction
  const previousValue = useSharedValue(0);

  useEffect(() => {
    const isIncreasing = value > previousValue.value;

    // Animate the number counting
    animatedValue.value = withTiming(
      value,
      {
        duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );

    // Pop effect when value changes
    if (value !== previousValue.value) {
      scale.value = withSequence(
        withSpring(1.3, GAME_SPRINGS.wobbly),
        withSpring(1, GAME_SPRINGS.gentle)
      );

      // Flash color (gold for increase, red for decrease)
      colorProgress.value = 1;
      colorProgress.value = withTiming(0, { duration: 500 });

      // Haptic feedback
      if (hapticEnabled && isIncreasing) {
        GameHaptics.xpGain();
      }
    }

    previousValue.value = value;
  }, [value]);

  // Update display value based on animated value
  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(setDisplayValue)(current);

      // Trigger haptic during counting (throttled)
      if (hapticEnabled) {
        const progress = current / value;
        if (progress > 0 && progress < 1 && Math.random() < 0.1) {
          runOnJS(GameHaptics.scoreCount)();
        }
      }
    }
  );

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Format the display value
  const formattedValue = (() => {
    const rounded = decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue);

    if (formatNumber && typeof rounded === 'number') {
      return rounded.toLocaleString();
    }
    return rounded.toString();
  })();

  return (
    <Animated.Text
      style={[
        styles.text,
        { color: finalColor },
        textStyle,
        animatedTextStyle,
      ]}
    >
      {prefix}{formattedValue}{suffix}
    </Animated.Text>
  );
}

/**
 * AnimatedXP - Specialized component for XP displays
 */
export function AnimatedXP({
  value,
  duration = GAME_DURATIONS.countingLong,
  textStyle,
  showPlus = true,
}: {
  value: number;
  duration?: number;
  textStyle?: StyleProp<TextStyle>;
  showPlus?: boolean;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix={showPlus ? '+' : ''}
      suffix=" XP"
      flashColor={GAME_COLORS.reward.gold}
      textStyle={StyleSheet.flatten([styles.xpText, textStyle])}
      hapticEnabled
    />
  );
}

/**
 * AnimatedScore - Specialized component for score displays
 */
export function AnimatedScore({
  value,
  duration = GAME_DURATIONS.counting,
  textStyle,
}: {
  value: number;
  duration?: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      suffix=" pts"
      flashColor={GAME_COLORS.energy.cyan}
      textStyle={StyleSheet.flatten([styles.scoreText, textStyle])}
      hapticEnabled
    />
  );
}

/**
 * AnimatedRank - Specialized component for rank displays
 */
export function AnimatedRank({
  value,
  duration = GAME_DURATIONS.quick,
  textStyle,
}: {
  value: number;
  duration?: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix="#"
      flashColor={GAME_COLORS.reward.champion}
      textStyle={StyleSheet.flatten([styles.rankText, textStyle])}
      formatNumber={false}
      hapticEnabled
    />
  );
}

/**
 * AnimatedStreak - Specialized component for streak displays
 */
export function AnimatedStreak({
  value,
  duration = GAME_DURATIONS.counting,
  textStyle,
}: {
  value: number;
  duration?: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      suffix=" days"
      flashColor={GAME_COLORS.primary.coral}
      textStyle={StyleSheet.flatten([styles.streakText, textStyle])}
      formatNumber={false}
      hapticEnabled
    />
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    fontSize: 24,
  },
  xpText: {
    color: GAME_COLORS.reward.gold,
    fontWeight: '800',
    fontSize: 28,
  },
  scoreText: {
    color: GAME_COLORS.energy.cyan,
    fontWeight: '700',
    fontSize: 24,
  },
  rankText: {
    color: GAME_COLORS.reward.champion,
    fontWeight: '800',
    fontSize: 32,
  },
  streakText: {
    color: GAME_COLORS.primary.coral,
    fontWeight: '700',
    fontSize: 20,
  },
});

export default AnimatedNumber;

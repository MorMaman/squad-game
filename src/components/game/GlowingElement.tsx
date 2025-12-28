/**
 * GlowingElement - Wrapper component with pulsing glow effect
 * Makes any element look premium and "alive" with a pulsing shadow
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { GAME_COLORS } from '../../theme/gameColors';

export interface GlowingElementProps {
  children: React.ReactNode;
  /** The color of the glow */
  glowColor?: string;
  /** Intensity of the glow (0-1, default: 1) */
  intensity?: number;
  /** Duration of one pulse cycle in ms */
  duration?: number;
  /** Whether the glow is active */
  active?: boolean;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Minimum shadow radius */
  minRadius?: number;
  /** Maximum shadow radius */
  maxRadius?: number;
}

export function GlowingElement({
  children,
  glowColor = GAME_COLORS.primary.orange,
  intensity = 1,
  duration = 2000,
  active = true,
  style,
  minRadius = 10,
  maxRadius = 25,
}: GlowingElementProps) {
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      glowProgress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // infinite
        false
      );
    } else {
      glowProgress.value = withTiming(0, { duration: 300 });
    }
  }, [active, duration]);

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      glowProgress.value,
      [0, 1],
      [minRadius * intensity, maxRadius * intensity]
    );

    const shadowOpacity = interpolate(
      glowProgress.value,
      [0, 1],
      [0.4 * intensity, 0.9 * intensity]
    );

    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  return (
    <Animated.View style={[styles.container, glowStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * GlowingBorder - Creates a glowing border effect around content
 */
export function GlowingBorder({
  children,
  glowColor = GAME_COLORS.primary.orange,
  intensity = 1,
  borderRadius = 16,
  borderWidth = 2,
  style,
}: {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: number;
  borderRadius?: number;
  borderWidth?: number;
  style?: ViewStyle;
}) {
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const borderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowProgress.value, [0, 1], [0.5, 1]);

    return {
      borderColor: glowColor,
      borderWidth,
      borderRadius,
      opacity: opacity * intensity,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowProgress.value, [0, 1], [5, 15]) * intensity;

    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: interpolate(glowProgress.value, [0, 1], [0.3, 0.7]) * intensity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  return (
    <Animated.View style={[styles.borderContainer, borderStyle, shadowStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * GlowingText - Wrapper for text with glow effect using shadow on container
 * Note: This uses a View shadow to create a glow behind text content
 */
export function GlowingText({
  children,
  glowColor = GAME_COLORS.reward.gold,
  intensity = 0.8,
  style,
}: {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: number;
  style?: ViewStyle;
}) {
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowProgress.value, [0, 1], [4, 12]) * intensity;
    const shadowOpacity = interpolate(glowProgress.value, [0, 1], [0.4, 0.8]) * intensity;

    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  return (
    <Animated.View style={[glowStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * PulsingGlow - A more intense, attention-grabbing glow for CTAs
 */
export function PulsingGlow({
  children,
  glowColor = GAME_COLORS.energy.green,
  style,
}: {
  children: React.ReactNode;
  glowColor?: string;
  style?: ViewStyle;
}) {
  return (
    <GlowingElement
      glowColor={glowColor}
      intensity={1.2}
      duration={1500}
      minRadius={15}
      maxRadius={35}
      style={style}
    >
      {children}
    </GlowingElement>
  );
}

const styles = StyleSheet.create({
  container: {},
  borderContainer: {
    overflow: 'hidden',
  },
});

export default GlowingElement;

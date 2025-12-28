/**
 * BreathingAnimation - Subtle idle "alive" animation
 * Makes elements feel alive with gentle scale and opacity pulsing
 * Use on cards, avatars, and important elements to create engagement
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
} from 'react-native-reanimated';
import { GAME_DURATIONS } from '../../theme/gameColors';

export interface BreathingAnimationProps {
  children: React.ReactNode;
  /** Whether the animation is active */
  active?: boolean;
  /** Duration of one breathing cycle in ms (default: 4000) */
  duration?: number;
  /** Minimum scale (default: 1.0) */
  minScale?: number;
  /** Maximum scale (default: 1.02) */
  maxScale?: number;
  /** Enable opacity pulsing (default: true) */
  pulseOpacity?: boolean;
  /** Minimum opacity (default: 0.9) */
  minOpacity?: number;
  /** Maximum opacity (default: 1.0) */
  maxOpacity?: number;
  /** Additional styles */
  style?: ViewStyle;
}

export function BreathingAnimation({
  children,
  active = true,
  duration = GAME_DURATIONS.breathing,
  minScale = 1.0,
  maxScale = 1.02,
  pulseOpacity = true,
  minOpacity = 0.9,
  maxOpacity = 1.0,
  style,
}: BreathingAnimationProps) {
  const scale = useSharedValue(minScale);
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    if (active) {
      // Continuous gentle scale pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(maxScale, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(minScale, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // infinite
        false
      );

      // Continuous gentle opacity pulse
      if (pulseOpacity) {
        opacity.value = withRepeat(
          withSequence(
            withTiming(minOpacity, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(maxOpacity, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      }
    } else {
      // Reset to initial state
      scale.value = withTiming(minScale, { duration: 300 });
      opacity.value = withTiming(maxOpacity, { duration: 300 });
    }
  }, [active, duration, minScale, maxScale, pulseOpacity, minOpacity, maxOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * HeartbeatAnimation - More pronounced pulsing for attention-grabbing elements
 */
export function HeartbeatAnimation({
  children,
  active = true,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          // Quick pulse up
          withTiming(1.08, { duration: 150, easing: Easing.out(Easing.ease) }),
          // Quick return
          withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
          // Second smaller pulse
          withTiming(1.04, { duration: 100, easing: Easing.out(Easing.ease) }),
          // Return
          withTiming(1, { duration: 100, easing: Easing.in(Easing.ease) }),
          // Rest
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * FloatingAnimation - Gentle up-down floating motion
 */
export function FloatingAnimation({
  children,
  active = true,
  distance = 6,
  duration = 3000,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (active) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-distance, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [active, distance, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * WiggleAnimation - Playful rotation wiggle for elements
 */
export function WiggleAnimation({
  children,
  active = true,
  angle = 3,
  duration = 200,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  angle?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-angle, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(angle, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          // Pause between wiggles
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [active, angle, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * BounceInAnimation - Entrance animation with bounce
 */
export function BounceInAnimation({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) })
      );
      opacity.value = withTiming(1, { duration: 200 });
    };

    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay);
      return () => clearTimeout(timeout);
    } else {
      startAnimation();
    }
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

export default BreathingAnimation;

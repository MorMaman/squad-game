/**
 * VSIndicator.tsx
 * Animated "VS" text with dramatic glow and pulsing effects
 * Center element of the VS Battle screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { GAME_COLORS } from '../../theme/gameColors';

export interface VSIndicatorProps {
  /** Delay before entrance animation starts (ms) */
  entranceDelay?: number;
  /** Primary glow color */
  glowColor?: string;
  /** Size multiplier (1 = default) */
  scale?: number;
  /** Whether to show lightning bolts */
  showLightning?: boolean;
}

export function VSIndicator({
  entranceDelay = 0,
  glowColor = GAME_COLORS.reward.gold,
  scale = 1,
  showLightning = true,
}: VSIndicatorProps) {
  // Animation values
  const vsScale = useSharedValue(0);
  const vsOpacity = useSharedValue(0);
  const vsRotation = useSharedValue(-20);
  const glowPulse = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);
  const lightningFlash = useSharedValue(0);

  useEffect(() => {
    // Entrance animation - dramatic pop-in with rotation
    vsScale.value = withDelay(
      entranceDelay,
      withSpring(scale, {
        damping: 8,
        stiffness: 200,
        velocity: 5,
      })
    );

    vsRotation.value = withDelay(
      entranceDelay,
      withSpring(0, {
        damping: 10,
        stiffness: 150,
      })
    );

    vsOpacity.value = withDelay(
      entranceDelay,
      withTiming(1, { duration: 200 })
    );

    // Start pulsing glow after entrance
    glowPulse.value = withDelay(
      entranceDelay + 400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Lightning flash effect
    if (showLightning) {
      lightningOpacity.value = withDelay(
        entranceDelay + 200,
        withTiming(1, { duration: 150 })
      );

      lightningFlash.value = withDelay(
        entranceDelay + 300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0.3, { duration: 200 }),
            withTiming(0.8, { duration: 100 }),
            withTiming(0.4, { duration: 300 }),
            withTiming(1, { duration: 150 }),
            withTiming(0.5, { duration: 1000 })
          ),
          -1,
          false
        )
      );
    }
  }, [entranceDelay, scale, showLightning]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: vsScale.value },
      { rotate: `${vsRotation.value}deg` },
    ],
    opacity: vsOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [20, 50]);
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.5, 1]);

    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius),
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const textScale = interpolate(glowPulse.value, [0, 1], [1, 1.05]);

    return {
      transform: [{ scale: textScale }],
    };
  });

  const leftLightningStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value * lightningFlash.value,
    transform: [{ rotate: '-15deg' }],
  }));

  const rightLightningStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value * lightningFlash.value,
    transform: [{ rotate: '15deg' }, { scaleX: -1 }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Left lightning bolt */}
      {showLightning && (
        <Animated.Text style={[styles.lightning, styles.lightningLeft, leftLightningStyle]}>
          {'\u26A1'}
        </Animated.Text>
      )}

      {/* VS text with glow */}
      <Animated.View style={[styles.vsContainer, glowStyle]}>
        <Animated.View style={pulseStyle}>
          {/* Text shadow layer for depth */}
          <Text style={[styles.vsTextShadow]}>VS</Text>
          {/* Main VS text */}
          <Text style={[styles.vsText]}>VS</Text>
        </Animated.View>

        {/* Inner glow ring (web fallback) */}
        {Platform.OS === 'web' && (
          <View style={[styles.webGlow, { backgroundColor: glowColor }]} />
        )}
      </Animated.View>

      {/* Right lightning bolt */}
      {showLightning && (
        <Animated.Text style={[styles.lightning, styles.lightningRight, rightLightningStyle]}>
          {'\u26A1'}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vsText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    textAlign: 'center',
    position: 'absolute',
    top: 0,
  },
  vsTextShadow: {
    fontSize: 72,
    fontWeight: '900',
    color: GAME_COLORS.primary.coral,
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: GAME_COLORS.primary.coral,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  webGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    zIndex: -1,
    ...(Platform.OS === 'web' && ({
      filter: 'blur(30px)',
    } as any)),
  },
  lightning: {
    fontSize: 36,
    color: GAME_COLORS.reward.gold,
  },
  lightningLeft: {
    marginRight: 8,
  },
  lightningRight: {
    marginLeft: 8,
  },
});

export default VSIndicator;

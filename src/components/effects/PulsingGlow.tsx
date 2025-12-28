/**
 * PulsingGlow.tsx
 * Ambient pulsing glow effect for highlighting important elements
 * Creates visual emphasis and draws attention to key UI elements
 */

import React, { useEffect, ReactNode } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface PulsingGlowProps {
  /** Child element to wrap with glow */
  children: ReactNode;
  /** Glow color */
  color?: string;
  /** Glow intensity (0-1, default 0.6) */
  intensity?: number;
  /** Pulse duration in ms (default 1500) */
  duration?: number;
  /** Whether glow is active */
  active?: boolean;
  /** Glow radius */
  radius?: number;
  /** Container style */
  style?: ViewStyle;
  /** Pulse mode: 'gentle' for subtle, 'strong' for pronounced */
  mode?: 'gentle' | 'strong';
}

export function PulsingGlow({
  children,
  color = colors.primary,
  intensity = 0.6,
  duration = 1500,
  active = true,
  radius = 20,
  style,
  mode = 'gentle',
}: PulsingGlowProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: duration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite
        false
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [active, duration]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const minOpacity = mode === 'gentle' ? intensity * 0.4 : intensity * 0.2;
    const maxOpacity = intensity;
    const opacityValue = interpolate(pulse.value, [0, 1], [minOpacity, maxOpacity]);

    const minRadius = mode === 'gentle' ? radius * 0.8 : radius * 0.5;
    const maxRadius = mode === 'gentle' ? radius * 1.2 : radius * 1.5;
    const radiusValue = interpolate(pulse.value, [0, 1], [minRadius, maxRadius]);

    const minScale = mode === 'gentle' ? 0.98 : 0.95;
    const maxScale = mode === 'gentle' ? 1.02 : 1.05;
    const scaleValue = interpolate(pulse.value, [0, 1], [minScale, maxScale]);

    return {
      shadowOpacity: opacityValue,
      shadowRadius: radiusValue,
      transform: [{ scale: scaleValue }],
    };
  });

  const webGlowStyle = useAnimatedStyle(() => {
    const minOpacity = mode === 'gentle' ? intensity * 0.4 : intensity * 0.2;
    const maxOpacity = intensity;
    const opacityValue = interpolate(pulse.value, [0, 1], [minOpacity, maxOpacity]);

    const minRadius = mode === 'gentle' ? radius * 0.8 : radius * 0.5;
    const maxRadius = mode === 'gentle' ? radius * 1.2 : radius * 1.5;
    const radiusValue = interpolate(pulse.value, [0, 1], [minRadius, maxRadius]);

    return {
      opacity: opacityValue,
      width: radiusValue * 4,
      height: radiusValue * 4,
    };
  });

  if (!active) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.OS !== 'web' && animatedGlowStyle,
      ]}
    >
      {/* Web-specific glow layer */}
      {Platform.OS === 'web' && (
        <Animated.View
          style={[
            styles.webGlow,
            { backgroundColor: color },
            webGlowStyle,
          ]}
        />
      )}
      {children}
    </Animated.View>
  );
}

// Preset glow configurations for common use cases
export const GlowPresets = {
  gold: {
    color: colors.energy,
    intensity: 0.7,
    radius: 25,
  },
  success: {
    color: colors.success,
    intensity: 0.6,
    radius: 20,
  },
  primary: {
    color: colors.primary,
    intensity: 0.6,
    radius: 20,
  },
  urgent: {
    color: colors.warning,
    intensity: 0.8,
    radius: 30,
    mode: 'strong' as const,
    duration: 800,
  },
  legendary: {
    color: colors.energy,
    intensity: 0.9,
    radius: 35,
    mode: 'strong' as const,
    duration: 1000,
  },
} as const;

// Convenience wrapper with presets
interface GlowWrapperProps extends Omit<PulsingGlowProps, 'color' | 'intensity' | 'radius'> {
  preset?: keyof typeof GlowPresets;
}

export function GlowWrapper({ preset = 'primary', ...props }: GlowWrapperProps) {
  const presetConfig = GlowPresets[preset];
  return <PulsingGlow {...presetConfig} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    // iOS/Android shadow properties
    elevation: 10,
  },
  webGlow: {
    position: 'absolute',
    borderRadius: 9999,
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -40, // Will be adjusted by animation
    marginTop: -40,
    zIndex: -1,
    // Web-specific blur
    ...(Platform.OS === 'web' && ({
      filter: 'blur(20px)',
    } as any)),
  },
});

export default PulsingGlow;

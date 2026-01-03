/**
 * CrownBadge.tsx
 * Crown icon shown next to first place player's avatar
 * Features golden glow and shimmer animation for the crown holder
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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/colors';

// Crown color constants
const CROWN_COLORS = {
  gold: '#FFD700',
  goldDark: '#FFA500',
  goldLight: '#FFEC8B',
  glow: 'rgba(255, 215, 0, 0.6)',
} as const;

export interface CrownBadgeProps {
  /** Size variant of the crown badge */
  size?: 'small' | 'medium' | 'large';
  /** Whether to animate the crown with shimmer effect */
  animated?: boolean;
  /** Additional styles for the container */
  style?: ViewStyle;
}

const sizes = {
  small: { iconSize: 14, containerSize: 20, offset: -4 },
  medium: { iconSize: 20, containerSize: 28, offset: -6 },
  large: { iconSize: 28, containerSize: 36, offset: -8 },
};

/**
 * CrownBadge - Standalone crown icon with optional animation
 * Use this when you need just the crown icon without wrapping an avatar
 */
export function CrownBadge({
  size = 'medium',
  animated = true,
  style,
}: CrownBadgeProps) {
  const sizeConfig = sizes[size];

  // Animation values
  const shimmer = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;

    // Shimmer/glow pulse effect
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Subtle scale breathing
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Gentle rotation wiggle
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [animated]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(shimmer.value, [0, 1], [0.5, 1]);
    const shadowRadius = interpolate(shimmer.value, [0, 1], [8, 16]);

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      shadowOpacity: glowOpacity,
      shadowRadius: shadowRadius,
    };
  });

  // Platform-specific glow effect
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 12px ${CROWN_COLORS.glow}`,
    } as any,
    default: {
      shadowColor: CROWN_COLORS.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: sizeConfig.containerSize,
          height: sizeConfig.containerSize,
          borderRadius: sizeConfig.containerSize / 2,
        },
        glowStyle,
        animated && animatedContainerStyle,
        style,
      ]}
    >
      <Ionicons
        name="ribbon"
        size={sizeConfig.iconSize}
        color={CROWN_COLORS.gold}
      />
    </Animated.View>
  );
}

export interface CrownOverlayProps {
  /** Child element (typically an Avatar) to wrap with crown */
  children: ReactNode;
  /** Size variant of the crown */
  size?: 'small' | 'medium' | 'large';
  /** Whether to animate the crown */
  animated?: boolean;
  /** Position of the crown relative to the child */
  position?: 'top-right' | 'top-left' | 'top-center';
  /** Additional styles for the wrapper */
  style?: ViewStyle;
}

/**
 * CrownOverlay - Wraps an element (like Avatar) and positions a crown badge over it
 * Use this to add a crown to any element, typically avatars
 */
export function CrownOverlay({
  children,
  size = 'medium',
  animated = true,
  position = 'top-right',
  style,
}: CrownOverlayProps) {
  const sizeConfig = sizes[size];

  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top-left':
        return {
          top: sizeConfig.offset,
          left: sizeConfig.offset,
        };
      case 'top-center':
        return {
          top: sizeConfig.offset,
          left: '50%',
          marginLeft: -sizeConfig.containerSize / 2,
        };
      case 'top-right':
      default:
        return {
          top: sizeConfig.offset,
          right: sizeConfig.offset,
        };
    }
  };

  return (
    <View style={[styles.overlayWrapper, style]}>
      {children}
      <View style={[styles.crownPosition, getPositionStyle()]}>
        <CrownBadge size={size} animated={animated} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CROWN_COLORS.goldDark,
  },
  overlayWrapper: {
    position: 'relative',
  },
  crownPosition: {
    position: 'absolute',
    zIndex: 10,
  },
});

export { CROWN_COLORS };
export default CrownBadge;

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

interface RivalryBadgeProps {
  size?: 'tiny' | 'small' | 'medium';
}

// Rivalry colors - competitive red/orange scheme
const rivalryColors = {
  primary: '#EF4444', // Red
  secondary: '#F97316', // Orange
  glow: 'rgba(239, 68, 68, 0.5)',
};

const sizes = {
  tiny: { iconSize: 10, fontSize: 8, padding: 2, minWidth: 20 },
  small: { iconSize: 14, fontSize: typography.sizeXs, padding: spacing.xs, minWidth: 28 },
  medium: { iconSize: 20, fontSize: typography.sizeSm, padding: spacing.sm, minWidth: 48 },
};

export function RivalryBadge({ size = 'medium' }: RivalryBadgeProps) {
  const sizeConfig = sizes[size];

  // Animation values for pulsing effect
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowIntensity = useSharedValue(0.5);

  useEffect(() => {
    // Pulsing scale animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow intensity animation
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.5, { duration: 500 })
      ),
      -1,
      true
    );

    // Subtle opacity pulse
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.85, { duration: 400 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  // Platform-specific glow effect
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 12px ${rivalryColors.glow}`,
    } as any,
    default: {
      shadowColor: rivalryColors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          padding: sizeConfig.padding,
          minWidth: sizeConfig.minWidth,
        },
        animatedContainerStyle,
      ]}
    >
      {/* Glow background */}
      <Animated.View
        style={[
          styles.glowBackground,
          glowStyle,
          animatedGlowStyle,
        ]}
      />

      <View style={styles.content}>
        {/* Crossed swords / flame icon */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          {/* Left sword */}
          <Ionicons
            name="flash"
            size={sizeConfig.iconSize}
            color={rivalryColors.primary}
            style={styles.leftIcon}
          />
          {/* Right sword (mirrored) */}
          <Ionicons
            name="flash"
            size={sizeConfig.iconSize}
            color={rivalryColors.secondary}
            style={styles.rightIcon}
          />
        </Animated.View>

        {/* Text label for medium size */}
        {size === 'medium' && (
          <Text style={[styles.labelText, { fontSize: sizeConfig.fontSize }]}>
            RIVAL
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: rivalryColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rivalryColors.primary,
    opacity: 0.1,
    borderRadius: borderRadius.md,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    transform: [{ rotate: '-15deg' }],
    marginRight: -4,
  },
  rightIcon: {
    transform: [{ rotate: '15deg' }, { scaleX: -1 }],
    marginLeft: -4,
  },
  labelText: {
    color: rivalryColors.primary,
    fontWeight: typography.weightBold,
    letterSpacing: 1,
    marginTop: 2,
  },
});

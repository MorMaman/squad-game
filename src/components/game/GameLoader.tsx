/**
 * GameLoader - Exciting spinner with game-like aesthetics
 * Features spinning gradient circle, pulsing glow, and dynamic text
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GAME_COLORS, GAME_DURATIONS } from '../../theme/gameColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GameLoaderProps {
  /** Loading text to display */
  text?: string;
  /** Size of the loader */
  size?: 'small' | 'medium' | 'large';
  /** Primary color for the gradient */
  color?: string;
  /** Secondary color for the gradient */
  secondaryColor?: string;
  /** Whether to show the text */
  showText?: boolean;
  /** Whether to show the pulsing glow effect */
  showGlow?: boolean;
}

export function GameLoader({
  text = 'Loading...',
  size = 'medium',
  color = GAME_COLORS.primary.orange,
  secondaryColor = GAME_COLORS.primary.purple,
  showText = true,
  showGlow = true,
}: GameLoaderProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  const dotOpacity = useSharedValue(1);

  // Spinner dimensions based on size
  const dimensions = {
    small: { outer: 40, inner: 28, stroke: 4 },
    medium: { outer: 60, inner: 44, stroke: 6 },
    large: { outer: 80, inner: 60, stroke: 8 },
  }[size];

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1, // infinite
      false
    );

    // Pulsing scale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow pulse
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Animated loading dots
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 300 })
      ),
      -1,
      true
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pulseOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: interpolate(pulseOpacity.value, [0.3, 0.7], [0.3, 0.6]),
    shadowRadius: interpolate(pulseOpacity.value, [0.3, 0.7], [10, 25]),
    elevation: 10,
  }));

  return (
    <View style={styles.container}>
      {/* Glow circle behind */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowCircle,
            {
              width: dimensions.outer * 1.5,
              height: dimensions.outer * 1.5,
              borderRadius: dimensions.outer * 0.75,
              backgroundColor: color,
            },
            pulseStyle,
          ]}
        />
      )}

      {/* Spinning gradient ring */}
      <Animated.View style={[rotateStyle, glowStyle]}>
        <View
          style={[
            styles.spinnerOuter,
            {
              width: dimensions.outer,
              height: dimensions.outer,
              borderRadius: dimensions.outer / 2,
            },
          ]}
        >
          <LinearGradient
            colors={[color, secondaryColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.spinnerGradient,
              { borderRadius: dimensions.outer / 2 },
            ]}
          />
          <View
            style={[
              styles.spinnerInner,
              {
                width: dimensions.inner,
                height: dimensions.inner,
                borderRadius: dimensions.inner / 2,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Loading text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.loadingText, { fontSize: size === 'small' ? 12 : size === 'large' ? 18 : 14 }]}>
            {text}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * GameLoaderFullScreen - Full screen loading overlay
 */
export function GameLoaderFullScreen({
  text = 'Loading...',
  visible = true,
}: {
  text?: string;
  visible?: boolean;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={[styles.fullScreenContainer, containerStyle]}>
      <GameLoader text={text} size="large" />
    </Animated.View>
  );
}

/**
 * GameLoaderDots - Simple animated loading dots
 */
export function GameLoaderDots({
  color = GAME_COLORS.accent.ice,
  size = 8,
}: {
  color?: string;
  size?: number;
}) {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    // Staggered dot animations
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );

    setTimeout(() => {
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );
    }, 200);

    setTimeout(() => {
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );
    }, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: 3,
  };

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[dotStyle, dot1Style]} />
      <Animated.View style={[dotStyle, dot2Style]} />
      <Animated.View style={[dotStyle, dot3Style]} />
    </View>
  );
}

/**
 * GameLoaderBar - Animated progress bar style loader
 */
export function GameLoaderBar({
  width = SCREEN_WIDTH - 80,
  height = 6,
  color = GAME_COLORS.energy.cyan,
  secondaryColor = GAME_COLORS.primary.purple,
}: {
  width?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
}) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [width]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.barContainer,
        {
          width,
          height,
          borderRadius: height / 2,
        },
      ]}
    >
      <Animated.View style={barStyle}>
        <LinearGradient
          colors={['transparent', color, secondaryColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.barGradient,
            {
              width: width * 0.5,
              height,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
  },
  spinnerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  spinnerInner: {
    backgroundColor: GAME_COLORS.background.dark,
  },
  textContainer: {
    marginTop: 16,
  },
  loadingText: {
    color: GAME_COLORS.accent.ice,
    fontWeight: '600',
    letterSpacing: 1,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  barGradient: {},
});

export default GameLoader;

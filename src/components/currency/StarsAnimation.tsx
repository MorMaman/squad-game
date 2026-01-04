/**
 * StarsAnimation.tsx
 * Floating stars animation when earning stars
 * Stars float up and fade out with sparkle effects
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STAR_GOLD = '#FFD700';
const STAR_LIGHT = '#FFF8DC';
const SPARKLE_COLORS = ['#FFD700', '#FFFFFF', '#FFA500', '#FFEC8B'] as const;

interface FloatingStar {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  drift: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

export interface StarsAnimationProps {
  /** Whether the animation is active */
  active: boolean;
  /** Number of stars to animate */
  count?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Starting X position (0-1 relative to screen width) */
  originX?: number;
  /** Starting Y position (0-1 relative to screen height) */
  originY?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Show sparkle effects */
  showSparkles?: boolean;
}

// Individual floating star component
function FloatingStarParticle({
  star,
  duration,
  onComplete,
}: {
  star: FloatingStar;
  duration: number;
  onComplete?: (id: number) => void;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const floatDuration = duration + Math.random() * 500;

    // Initial pop-in
    scale.value = withDelay(
      star.delay,
      withSequence(
        withSpring(1.2, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      )
    );

    // Fade in
    opacity.value = withDelay(
      star.delay,
      withTiming(1, { duration: 200 })
    );

    // Float upward with easing
    translateY.value = withDelay(
      star.delay,
      withTiming(-150 - Math.random() * 100, {
        duration: floatDuration,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Horizontal drift
    translateX.value = withDelay(
      star.delay,
      withTiming(star.drift * 60, {
        duration: floatDuration,
        easing: Easing.out(Easing.ease),
      })
    );

    // Gentle rotation
    rotation.value = withDelay(
      star.delay,
      withTiming(star.drift * 30, {
        duration: floatDuration,
        easing: Easing.out(Easing.ease),
      })
    );

    // Fade out towards end
    const fadeDelay = star.delay + floatDuration * 0.6;
    const fadeOutTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: floatDuration * 0.4 });
      scale.value = withTiming(0.5, { duration: floatDuration * 0.4 });
    }, fadeDelay);

    // Completion
    const completionTimer = setTimeout(() => {
      if (onComplete) {
        onComplete(star.id);
      }
    }, star.delay + floatDuration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completionTimer);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        { left: star.x, top: star.y },
        animatedStyle,
      ]}
    >
      <Ionicons
        name="star"
        size={star.size}
        color={STAR_GOLD}
      />
      {/* Inner glow */}
      <View style={[styles.starGlow, { width: star.size * 1.5, height: star.size * 1.5 }]} />
    </Animated.View>
  );
}

// Individual sparkle component
function SparkleParticle({
  sparkle,
  duration,
  onComplete,
}: {
  sparkle: Sparkle;
  duration: number;
  onComplete?: (id: number) => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const sparkleDuration = 400 + Math.random() * 200;

    // Pop in and out
    scale.value = withDelay(
      sparkle.delay,
      withSequence(
        withTiming(1.2, { duration: sparkleDuration * 0.3, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: sparkleDuration * 0.2 }),
        withTiming(0, { duration: sparkleDuration * 0.5, easing: Easing.in(Easing.ease) })
      )
    );

    opacity.value = withDelay(
      sparkle.delay,
      withSequence(
        withTiming(1, { duration: sparkleDuration * 0.3 }),
        withTiming(1, { duration: sparkleDuration * 0.2 }),
        withTiming(0, { duration: sparkleDuration * 0.5 })
      )
    );

    rotation.value = withDelay(
      sparkle.delay,
      withTiming(45, { duration: sparkleDuration, easing: Easing.out(Easing.ease) })
    );

    const completionTimer = setTimeout(() => {
      if (onComplete) {
        onComplete(sparkle.id);
      }
    }, sparkle.delay + sparkleDuration);

    return () => clearTimeout(completionTimer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { left: sparkle.x, top: sparkle.y },
        animatedStyle,
      ]}
    >
      {/* 4-point star sparkle */}
      <View style={[styles.sparkleCore, { backgroundColor: sparkle.color, width: sparkle.size, height: sparkle.size / 3 }]} />
      <View style={[styles.sparkleCore, { backgroundColor: sparkle.color, width: sparkle.size / 3, height: sparkle.size, position: 'absolute' }]} />
    </Animated.View>
  );
}

export function StarsAnimation({
  active,
  count = 8,
  duration = 1500,
  originX = 0.5,
  originY = 0.5,
  onComplete,
  showSparkles = true,
}: StarsAnimationProps) {
  const [completedStars, setCompletedStars] = useState<Set<number>>(new Set());
  const [completedSparkles, setCompletedSparkles] = useState<Set<number>>(new Set());

  const stars = useMemo(() => {
    if (!active) return [];

    const centerX = SCREEN_WIDTH * originX;
    const centerY = SCREEN_HEIGHT * originY;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: centerX + (Math.random() - 0.5) * 80,
      y: centerY + (Math.random() - 0.5) * 40,
      size: 18 + Math.random() * 14,
      delay: Math.random() * 300,
      drift: (Math.random() - 0.5) * 2,
    }));
  }, [active, count, originX, originY]);

  const sparkles = useMemo(() => {
    if (!active || !showSparkles) return [];

    const centerX = SCREEN_WIDTH * originX;
    const centerY = SCREEN_HEIGHT * originY;
    const sparkleCount = count * 2;

    return Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      x: centerX + (Math.random() - 0.5) * 150,
      y: centerY + (Math.random() - 0.5) * 100 - 50,
      size: 8 + Math.random() * 8,
      delay: Math.random() * 600,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    }));
  }, [active, count, originX, originY, showSparkles]);

  const handleStarComplete = useCallback((id: number) => {
    setCompletedStars((prev) => new Set([...prev, id]));
  }, []);

  const handleSparkleComplete = useCallback((id: number) => {
    setCompletedSparkles((prev) => new Set([...prev, id]));
  }, []);

  // Check if all animations are complete
  useEffect(() => {
    if (!active) return;

    const allStarsComplete = completedStars.size >= stars.length;
    const allSparklesComplete = !showSparkles || completedSparkles.size >= sparkles.length;

    if (allStarsComplete && allSparklesComplete && onComplete) {
      onComplete();
    }
  }, [completedStars.size, completedSparkles.size, stars.length, sparkles.length, showSparkles, active, onComplete]);

  // Reset when becoming active
  useEffect(() => {
    if (active) {
      setCompletedStars(new Set());
      setCompletedSparkles(new Set());
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Sparkles (behind stars) */}
      {sparkles.map((sparkle) => (
        <SparkleParticle
          key={`sparkle-${sparkle.id}`}
          sparkle={sparkle}
          duration={duration}
          onComplete={handleSparkleComplete}
        />
      ))}

      {/* Floating stars */}
      {stars.map((star) => (
        <FloatingStarParticle
          key={`star-${star.id}`}
          star={star}
          duration={duration}
          onComplete={handleStarComplete}
        />
      ))}
    </View>
  );
}

// Hook for easy management of stars animation
export function useStarsAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [starCount, setStarCount] = useState(8);

  const showStars = useCallback((options?: { x?: number; y?: number; count?: number }) => {
    setPosition({ x: options?.x ?? 0.5, y: options?.y ?? 0.5 });
    setStarCount(options?.count ?? 8);
    setIsAnimating(true);
  }, []);

  const hideStars = useCallback(() => {
    setIsAnimating(false);
  }, []);

  return {
    isAnimating,
    position,
    starCount,
    showStars,
    hideStars,
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    zIndex: 1000,
  },
  star: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  starGlow: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    ...Platform.select({
      web: {
        filter: 'blur(8px)',
      } as any,
      default: {},
    }),
  },
  sparkle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  sparkleCore: {
    borderRadius: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 0 4px currentColor',
      } as any,
      default: {},
    }),
  },
});

export default StarsAnimation;

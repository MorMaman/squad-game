/**
 * Confetti.tsx
 * Epic celebration confetti explosion with colorful particles
 * Uses react-native-reanimated for 60fps performance
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game-inspired confetti colors from research
const CONFETTI_COLORS = [
  '#FF6B00', // Game Orange
  '#FFD700', // Gold
  '#00FF87', // Neon Green
  '#00D4FF', // Electric Cyan
  '#9B59FF', // Electric Purple
  '#FF2D92', // Hot Pink
] as const;

export type ConfettiIntensity = 'small' | 'medium' | 'large';

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
  driftDirection: number;
  shape: 'circle' | 'square' | 'rectangle';
}

interface ConfettiProps {
  /** Whether confetti is active */
  active: boolean;
  /** Intensity determines particle count: small=50, medium=100, large=150 */
  intensity?: ConfettiIntensity;
  /** Duration in milliseconds (default: 2500ms) */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Custom colors (defaults to game palette) */
  colors?: string[];
  /** Origin point for explosion (0-1, default center) */
  originX?: number;
}

const getParticleCount = (intensity: ConfettiIntensity): number => {
  switch (intensity) {
    case 'small':
      return 50;
    case 'medium':
      return 100;
    case 'large':
      return 150;
    default:
      return 100;
  }
};

const generateParticles = (
  count: number,
  colors: readonly string[] | string[],
  originX: number
): ConfettiParticle[] => {
  const shapes: Array<'circle' | 'square' | 'rectangle'> = ['circle', 'square', 'rectangle'];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: SCREEN_WIDTH * originX + (Math.random() - 0.5) * 150,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 400,
    size: Math.random() * 10 + 6,
    rotation: Math.random() * 360,
    driftDirection: (Math.random() - 0.5) * 2,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }));
};

// Individual confetti piece with physics-based animation
function ConfettiPiece({
  particle,
  duration,
}: {
  particle: ConfettiParticle;
  duration: number;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(particle.rotation);
  const rotateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const horizontalDrift = particle.driftDirection * (80 + Math.random() * 60);
    const fallDuration = duration + Math.random() * 800;
    const gravity = Easing.bezier(0.25, 0.1, 0.25, 1);

    // Fall with gravity
    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: fallDuration,
        easing: gravity,
      })
    );

    // Horizontal drift with wind-like oscillation
    translateX.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(horizontalDrift * 0.6, { duration: fallDuration * 0.3 }),
        withRepeat(
          withSequence(
            withTiming(horizontalDrift * 0.4, { duration: 300 }),
            withTiming(horizontalDrift * 0.8, { duration: 300 })
          ),
          -1,
          true
        )
      )
    );

    // Continuous rotation for tumbling effect
    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(particle.rotation + 360, {
          duration: 600 + Math.random() * 400,
          easing: Easing.linear,
        }),
        -1
      )
    );

    // 3D flip effect
    rotateX.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(360, {
          duration: 800 + Math.random() * 400,
          easing: Easing.linear,
        }),
        -1
      )
    );

    // Scale variation for depth effect
    scale.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(1.2, { duration: 200 })
        ),
        -1,
        true
      )
    );

    // Fade out towards the end
    opacity.value = withDelay(
      particle.delay + fallDuration * 0.7,
      withTiming(0, { duration: fallDuration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { rotateX: `${rotateX.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapeStyle = useMemo(() => {
    const base = {
      backgroundColor: particle.color,
    };

    switch (particle.shape) {
      case 'circle':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
        };
      case 'square':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          borderRadius: 2,
        };
      case 'rectangle':
        return {
          ...base,
          width: particle.size * 0.5,
          height: particle.size * 1.5,
          borderRadius: 1,
        };
    }
  }, [particle]);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { left: particle.x },
        shapeStyle,
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({
  active,
  intensity = 'medium',
  duration = 2500,
  onComplete,
  colors = CONFETTI_COLORS as unknown as string[],
  originX = 0.5,
}: ConfettiProps) {
  const particles = useMemo(() => {
    if (!active) return [];
    const count = getParticleCount(intensity);
    return generateParticles(count, colors, originX);
  }, [active, intensity, colors, originX]);

  useEffect(() => {
    if (active && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration + 1000);
      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiPiece
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: -50,
    ...Platform.select({
      web: {
        backfaceVisibility: 'visible',
      } as any,
      default: {},
    }),
  },
});

export default Confetti;

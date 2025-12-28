/**
 * SparkleEffect.tsx
 * Sparkles around achievements and rewards
 * Creates a magical, rewarding atmosphere for special elements
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Sparkle colors - gold and white for that premium feel
const SPARKLE_COLORS = ['#FFD700', '#FFFFFF', '#FFF8DC', '#FFFACD'] as const;

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

interface SparkleEffectProps {
  /** Child element to wrap with sparkles */
  children: React.ReactNode;
  /** Whether sparkles are active */
  active?: boolean;
  /** Sparkle intensity (particles per second) */
  intensity?: 'low' | 'medium' | 'high';
  /** Custom colors for sparkles */
  colors?: string[];
  /** Container padding for sparkle area */
  padding?: number;
}

const getSparkleInterval = (intensity: 'low' | 'medium' | 'high'): number => {
  switch (intensity) {
    case 'low':
      return 200;
    case 'medium':
      return 100;
    case 'high':
      return 50;
    default:
      return 100;
  }
};

// Individual sparkle component with star-like animation
function SparkleParticle({
  sparkle,
  onComplete,
}: {
  sparkle: Sparkle;
  onComplete: (id: number) => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Pop in
    scale.value = withDelay(
      sparkle.delay,
      withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
      )
    );

    // Fade in and out
    opacity.value = withDelay(
      sparkle.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      )
    );

    // Gentle rotation
    rotation.value = withDelay(
      sparkle.delay,
      withTiming(45, { duration: 550, easing: Easing.out(Easing.ease) })
    );

    // Cleanup
    const timer = setTimeout(() => {
      onComplete(sparkle.id);
    }, sparkle.delay + 600);

    return () => clearTimeout(timer);
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
        {
          left: sparkle.x,
          top: sparkle.y,
          width: sparkle.size,
          height: sparkle.size,
        },
        animatedStyle,
      ]}
    >
      {/* Star shape using rotated squares */}
      <View
        style={[
          styles.sparkleStar,
          { backgroundColor: sparkle.color, width: sparkle.size, height: sparkle.size / 3 },
        ]}
      />
      <View
        style={[
          styles.sparkleStar,
          {
            backgroundColor: sparkle.color,
            width: sparkle.size / 3,
            height: sparkle.size,
            position: 'absolute',
          },
        ]}
      />
      {/* Diagonal cross for 4-point star */}
      <View
        style={[
          styles.sparkleStar,
          {
            backgroundColor: sparkle.color,
            width: sparkle.size * 0.7,
            height: sparkle.size / 4,
            position: 'absolute',
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.sparkleStar,
          {
            backgroundColor: sparkle.color,
            width: sparkle.size / 4,
            height: sparkle.size * 0.7,
            position: 'absolute',
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </Animated.View>
  );
}

export function SparkleEffect({
  children,
  active = true,
  intensity = 'medium',
  colors = SPARKLE_COLORS as unknown as string[],
  padding = 20,
}: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const sparkleIdRef = useRef(0);

  const createSparkle = useCallback(() => {
    if (!active || containerSize.width === 0) return;

    const id = sparkleIdRef.current++;
    const size = Math.random() * 12 + 6;

    // Position sparkles around the edges of the container
    const edge = Math.random();
    let x: number;
    let y: number;

    if (edge < 0.25) {
      // Top edge
      x = Math.random() * (containerSize.width + padding * 2) - padding;
      y = -padding + Math.random() * padding;
    } else if (edge < 0.5) {
      // Right edge
      x = containerSize.width - padding + Math.random() * padding;
      y = Math.random() * (containerSize.height + padding * 2) - padding;
    } else if (edge < 0.75) {
      // Bottom edge
      x = Math.random() * (containerSize.width + padding * 2) - padding;
      y = containerSize.height - padding + Math.random() * padding;
    } else {
      // Left edge
      x = -padding + Math.random() * padding;
      y = Math.random() * (containerSize.height + padding * 2) - padding;
    }

    const newSparkle: Sparkle = {
      id,
      x,
      y,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: 0,
    };

    setSparkles((prev) => [...prev.slice(-15), newSparkle]);
  }, [active, containerSize, colors, padding]);

  const removeSparkle = useCallback((id: number) => {
    setSparkles((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    if (!active) {
      setSparkles([]);
      return;
    }

    const interval = setInterval(createSparkle, getSparkleInterval(intensity));
    return () => clearInterval(interval);
  }, [active, intensity, createSparkle]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        setContainerSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
    >
      {children}

      {/* Sparkle layer */}
      <View style={[styles.sparkleContainer, { margin: -padding }]} pointerEvents="none">
        {sparkles.map((sparkle) => (
          <SparkleParticle
            key={sparkle.id}
            sparkle={sparkle}
            onComplete={removeSparkle}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    zIndex: 10,
  },
  sparkle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleStar: {
    borderRadius: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 0 4px currentColor',
      } as any,
      default: {},
    }),
  },
});

export default SparkleEffect;

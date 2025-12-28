/**
 * FloatingXP.tsx
 * Floating "+XP" number that rises and fades
 * Creates satisfying visual feedback when earning XP
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface FloatingXPProps {
  /** XP amount to display */
  amount: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Starting position X (relative to container) */
  startX?: number;
  /** Starting position Y (relative to container) */
  startY?: number;
  /** Custom color (defaults to gold) */
  color?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Font size */
  fontSize?: number;
  /** Show "XP" suffix */
  showSuffix?: boolean;
  /** Prefix (e.g., "+") */
  prefix?: string;
}

export function FloatingXP({
  amount,
  onComplete,
  startX = 0,
  startY = 0,
  color = colors.energy,
  duration = 1500,
  fontSize = 24,
  showSuffix = true,
  prefix = '+',
}: FloatingXPProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Initial pop-in effect
    scale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    // Fade in quickly
    opacity.value = withTiming(1, { duration: 150 });

    // Glow pulse
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.6, { duration: 300 }),
      withTiming(0.8, { duration: 200 })
    );

    // Float upward
    translateY.value = withTiming(-80, {
      duration: duration,
      easing: Easing.out(Easing.cubic),
    });

    // Slight horizontal drift
    translateX.value = withTiming((Math.random() - 0.5) * 30, {
      duration: duration,
      easing: Easing.out(Easing.ease),
    });

    // Fade out towards the end
    const fadeDelay = duration * 0.6;
    const fadeOutTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: duration * 0.4 });
      scale.value = withTiming(0.8, { duration: duration * 0.4 });
    }, fadeDelay);

    // Completion callback
    const completionTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completionTimer);
    };
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { left: startX, top: startY },
        animatedContainerStyle,
      ]}
      pointerEvents="none"
    >
      {/* Glow background */}
      <Animated.View
        style={[
          styles.glowBackground,
          { backgroundColor: color },
          animatedGlowStyle,
        ]}
      />

      {/* Main text */}
      <Text style={[styles.text, { color, fontSize }]}>
        {prefix}{amount}{showSuffix ? ' XP' : ''}
      </Text>

      {/* Shadow text for depth */}
      <Text
        style={[
          styles.shadowText,
          {
            color: 'rgba(0,0,0,0.5)',
            fontSize,
            top: 2,
            left: 2,
          },
        ]}
      >
        {prefix}{amount}{showSuffix ? ' XP' : ''}
      </Text>
    </Animated.View>
  );
}

// Manager component to handle multiple floating XP instances
interface FloatingXPInstance {
  id: number;
  amount: number;
  x: number;
  y: number;
}

interface FloatingXPManagerProps {
  /** Array of XP instances to display */
  instances: FloatingXPInstance[];
  /** Called when an instance animation completes */
  onInstanceComplete?: (id: number) => void;
  /** Container style */
  style?: any;
}

export function FloatingXPManager({
  instances,
  onInstanceComplete,
  style,
}: FloatingXPManagerProps) {
  return (
    <View style={[styles.managerContainer, style]} pointerEvents="none">
      {instances.map((instance) => (
        <FloatingXP
          key={instance.id}
          amount={instance.amount}
          startX={instance.x}
          startY={instance.y}
          onComplete={() => onInstanceComplete?.(instance.id)}
        />
      ))}
    </View>
  );
}

// Hook for easy management of floating XP
import { useState, useCallback, useRef } from 'react';

export function useFloatingXP() {
  const [instances, setInstances] = useState<FloatingXPInstance[]>([]);
  const idCounter = useRef(0);

  const showXP = useCallback((amount: number, x: number = 0, y: number = 0) => {
    const id = idCounter.current++;
    setInstances((prev) => [...prev, { id, amount, x, y }]);
  }, []);

  const removeInstance = useCallback((id: number) => {
    setInstances((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    instances,
    showXP,
    removeInstance,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glowBackground: {
    position: 'absolute',
    width: 100,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
    ...Platform.select({
      web: {
        filter: 'blur(15px)',
      } as any,
      default: {},
    }),
  },
  text: {
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 2,
  },
  shadowText: {
    position: 'absolute',
    fontWeight: '800',
    letterSpacing: 1,
    zIndex: 1,
  },
  managerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
});

export default FloatingXP;

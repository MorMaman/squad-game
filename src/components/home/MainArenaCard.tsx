/**
 * MainArenaCard.tsx
 * Central visual area showing squad emblem with animated background effects
 * Features floating particles and gradient border
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { typography, spacing, borderRadius, colors } from '../../theme/colors';
import { GameHaptics } from '../../utils/haptics';

// Home screen colors
const HOME_COLORS = {
  background: '#0A0E27',
  card: '#1A1A2E',
  primary: '#FF6B00',
  secondary: '#3B82F6',
  accent: '#9B59FF',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CARD_HEIGHT = CARD_WIDTH * 0.75;

export interface MainArenaCardProps {
  /** URL or local path to squad emblem/logo */
  squadEmblem?: string | null;
  /** Preview of upcoming event type */
  eventPreview?: string | null;
  /** Squad name to display */
  squadName?: string;
  /** Called when card is tapped */
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Floating particle component
interface ParticleProps {
  index: number;
  color: string;
  delay: number;
}

function FloatingParticle({ index, color, delay }: ParticleProps) {
  const position = useSharedValue(0);
  const opacity = useSharedValue(0);
  const horizontalDrift = useSharedValue(0);

  // Random starting positions based on index
  const startX = useMemo(() => (index % 5) * (CARD_WIDTH / 5) + 20, [index]);
  const startY = useMemo(() => CARD_HEIGHT + 10, []);
  const endY = useMemo(() => -20, []);

  useEffect(() => {
    // Slight delay before starting
    const timeout = setTimeout(() => {
      // Vertical movement
      position.value = withRepeat(
        withTiming(1, {
          duration: 4000 + index * 300,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // Opacity fade in/out
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.6, { duration: 2000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );

      // Horizontal drift
      horizontalDrift.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(position.value, [0, 1], [startY, endY]);

    return {
      transform: [
        { translateX: startX + horizontalDrift.value },
        { translateY },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function MainArenaCard({
  squadEmblem,
  eventPreview,
  squadName = 'SQUAD',
  onPress,
}: MainArenaCardProps) {
  // Animation values
  const scale = useSharedValue(1);
  const borderRotation = useSharedValue(0);
  const logoGlow = useSharedValue(0.5);
  const logoScale = useSharedValue(1);

  // Setup ambient animations
  useEffect(() => {
    // Border gradient rotation effect (simulated via glow)
    borderRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Logo glow pulse
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Logo breathing
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.97, { duration: GAME_DURATIONS.fast }),
      withSpring(1, GAME_SPRINGS.bouncy)
    );
    GameHaptics.buttonPress();
    onPress?.();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    shadowOpacity: logoGlow.value,
  }));

  // Generate particles with different colors
  const particles = useMemo(() => {
    const particleColors = [
      HOME_COLORS.accent,
      HOME_COLORS.primary,
      HOME_COLORS.secondary,
      GAME_COLORS.reward.gold,
      GAME_COLORS.energy.cyan,
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      color: particleColors[i % particleColors.length],
      delay: i * 400,
    }));
  }, []);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.wrapper, containerAnimatedStyle]}
    >
      {/* Gradient border container */}
      <LinearGradient
        colors={[HOME_COLORS.accent, HOME_COLORS.primary, HOME_COLORS.secondary, HOME_COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        {/* Inner card */}
        <View style={styles.innerCard}>
          {/* Background gradient */}
          <LinearGradient
            colors={[HOME_COLORS.card, '#12162E', HOME_COLORS.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating particles */}
          <View style={styles.particleContainer} pointerEvents="none">
            {particles.map((particle) => (
              <FloatingParticle
                key={particle.id}
                index={particle.id}
                color={particle.color}
                delay={particle.delay}
              />
            ))}
          </View>

          {/* Center content */}
          <View style={styles.centerContent}>
            {/* Squad Emblem / Logo Placeholder */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  shadowColor: HOME_COLORS.accent,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                },
                logoAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={[HOME_COLORS.accent, HOME_COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBackground}
              >
                <Ionicons name="shield" size={60} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Squad Name */}
            <Text style={styles.squadName}>{squadName.toUpperCase()}</Text>

            {/* Event Preview */}
            {eventPreview && (
              <View style={styles.eventPreview}>
                <Ionicons name="flash" size={14} color={GAME_COLORS.reward.gold} />
                <Text style={styles.eventPreviewText}>{eventPreview}</Text>
              </View>
            )}
          </View>

          {/* Corner decorations */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: HOME_COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientBorder: {
    borderRadius: borderRadius.xl + 2,
    padding: 2,
  },
  innerCard: {
    width: CARD_WIDTH - 4,
    height: CARD_HEIGHT - 4,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.md,
    ...Platform.select({
      android: {
        elevation: 10,
      },
    }),
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  squadName: {
    fontSize: typography.size3xl,
    fontWeight: typography.weightExtrabold,
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  eventPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.full,
    gap: 6,
  },
  eventPreviewText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cornerTopLeft: {
    top: spacing.md,
    left: spacing.md,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: spacing.md,
    right: spacing.md,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
});

export default MainArenaCard;

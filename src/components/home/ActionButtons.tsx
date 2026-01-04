/**
 * ActionButtons.tsx
 * Two main action buttons - PLAY and GAMES
 * Features gradient backgrounds, icons, and press animations
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { typography, spacing, borderRadius } from '../../theme/colors';
import { GameHaptics } from '../../utils/haptics';

// Home screen colors
const HOME_COLORS = {
  background: '#0A0E27',
  card: '#1A1A2E',
  primary: '#FF6B00',
  secondary: '#3B82F6',
  accent: '#9B59FF',
};

export interface ActionButtonsProps {
  /** Called when PLAY button is pressed - joins current event */
  onPlayEvent?: () => void;
  /** Called when GAMES button is pressed - goes to mini-games */
  onPlayGames?: () => void;
  /** Whether an event is available to play */
  eventAvailable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: readonly [string, string, ...string[]];
  glowColor: string;
  onPress?: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
}

function ActionButton({
  title,
  icon,
  gradientColors,
  glowColor,
  onPress,
  disabled = false,
  isPrimary = false,
}: ActionButtonProps) {
  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const iconScale = useSharedValue(1);

  // Setup glow pulse for primary button
  useEffect(() => {
    if (isPrimary && !disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isPrimary, disabled]);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.95, { duration: GAME_DURATIONS.fast });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSequence(
        withSpring(1.02, GAME_SPRINGS.bouncy),
        withSpring(1, GAME_SPRINGS.gentle)
      );
    }
  };

  const handlePress = () => {
    if (!disabled) {
      GameHaptics.action();
      onPress?.();
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.buttonWrapper, containerAnimatedStyle]}
    >
      <Animated.View
        style={[
          styles.glowContainer,
          {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 15,
          },
          !disabled && isPrimary && glowAnimatedStyle,
          disabled && styles.disabledGlow,
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#4A5568', '#374151'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <View style={styles.buttonContent}>
            <Animated.View style={isPrimary && !disabled ? iconAnimatedStyle : undefined}>
              <Ionicons
                name={icon}
                size={24}
                color={disabled ? '#9CA3AF' : '#FFFFFF'}
              />
            </Animated.View>
            <Text style={[styles.buttonText, disabled && styles.disabledText]}>
              {title}
            </Text>
          </View>

          {/* Shine effect overlay */}
          {!disabled && (
            <View style={styles.shineOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function ActionButtons({
  onPlayEvent,
  onPlayGames,
  eventAvailable = true,
}: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      {/* PLAY Button - Orange Gradient */}
      <ActionButton
        title="PLAY"
        icon="play"
        gradientColors={[HOME_COLORS.primary, GAME_COLORS.primary.coral]}
        glowColor={HOME_COLORS.primary}
        onPress={onPlayEvent}
        disabled={!eventAvailable}
        isPrimary={true}
      />

      {/* GAMES Button - Blue Gradient */}
      <ActionButton
        title="GAMES"
        icon="game-controller"
        gradientColors={[HOME_COLORS.secondary, HOME_COLORS.accent]}
        glowColor={HOME_COLORS.secondary}
        onPress={onPlayGames}
        disabled={false}
        isPrimary={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  glowContainer: {
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  disabledGlow: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightExtrabold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
});

export default ActionButtons;

/**
 * GameButton - Bouncy button with glow effect
 * A vibrant, animated button that feels like a game CTA
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
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
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { GameHaptics } from '../../utils/haptics';

export interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'victory' | 'power' | 'fire' | 'legendary' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  glowEnabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  glowEnabled = true,
  style,
  textStyle,
  icon,
}: GameButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  // Pulsing glow effect
  useEffect(() => {
    if (glowEnabled && !disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true // reverse
      );
    }
  }, [glowEnabled, disabled]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.92, { duration: GAME_DURATIONS.fast });
      GameHaptics.buttonPress();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSequence(
        withSpring(1.08, GAME_SPRINGS.wobbly),
        withSpring(1, GAME_SPRINGS.gentle)
      );
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      GameHaptics.action();
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const glowColor = getGlowColor(variant);
    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: interpolate(glowOpacity.value, [0.5, 0.9], [0.4, 0.8]),
      shadowRadius: interpolate(glowOpacity.value, [0.5, 0.9], [10, 25]),
      elevation: 10,
    };
  });

  const gradientColors = getGradientColors(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, style]}
    >
      <Animated.View style={[glowEnabled && glowStyle, styles.glowContainer]}>
        <LinearGradient
          colors={disabled ? ['#4A5568', '#374151'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            sizeStyles.button,
            disabled && styles.disabled,
          ]}
        >
          <View style={styles.content}>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text
                  style={[
                    styles.text,
                    sizeStyles.text,
                    disabled && styles.disabledText,
                    textStyle,
                  ]}
                >
                  {title}
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Loading indicator with animation
function LoadingIndicator() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.loader, animatedStyle]}>
      <View style={styles.loaderDot} />
    </Animated.View>
  );
}

function getGradientColors(
  variant: GameButtonProps['variant']
): readonly [string, string, ...string[]] {
  switch (variant) {
    case 'victory':
      return GAME_COLORS.gradients.victory;
    case 'power':
      return GAME_COLORS.gradients.power;
    case 'fire':
      return GAME_COLORS.gradients.fire;
    case 'legendary':
      return GAME_COLORS.gradients.legendary;
    case 'success':
      return GAME_COLORS.gradients.success;
    case 'primary':
    default:
      return [GAME_COLORS.primary.orange, GAME_COLORS.primary.coral];
  }
}

function getGlowColor(variant: GameButtonProps['variant']): string {
  switch (variant) {
    case 'victory':
      return GAME_COLORS.reward.gold;
    case 'power':
      return GAME_COLORS.energy.cyan;
    case 'fire':
      return GAME_COLORS.primary.coral;
    case 'legendary':
      return GAME_COLORS.primary.purple;
    case 'success':
      return GAME_COLORS.energy.green;
    case 'primary':
    default:
      return GAME_COLORS.primary.orange;
  }
}

function getSizeStyles(size: GameButtonProps['size']) {
  switch (size) {
    case 'small':
      return {
        button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
        text: { fontSize: 14 },
      };
    case 'large':
      return {
        button: { paddingVertical: 20, paddingHorizontal: 40, borderRadius: 20 },
        text: { fontSize: 20 },
      };
    case 'medium':
    default:
      return {
        button: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16 },
        text: { fontSize: 16 },
      };
  }
}

const styles = StyleSheet.create({
  glowContainer: {
    borderRadius: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    color: GAME_COLORS.accent.ice,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  loader: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GAME_COLORS.accent.ice,
    position: 'absolute',
    top: 0,
  },
});

export default GameButton;

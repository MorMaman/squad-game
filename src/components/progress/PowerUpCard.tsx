/**
 * PowerUpCard - Account Progress Power-Up Display
 * Shows power-up items with progress bar and unlock status
 *
 * Design: Dark theme card with gradient background, lime green accents
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameHaptics } from '../../utils/haptics';

// Progress Card Colors - Battle Game UI inspired
const PROGRESS_COLORS = {
  background: '#0A0E27',
  cardBackground: '#1A1A2E',
  cardGradientStart: '#1A1A2E',
  cardGradientEnd: '#252542',
  lime: '#A3E635',
  limeDark: '#65A30D',
  limeGlow: 'rgba(163, 230, 53, 0.4)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  progressBackground: '#27272A',
};

export interface PowerUpCardProps {
  /** Unique identifier for the power-up */
  id: string;
  /** Power-up title */
  title: string;
  /** Power-up description */
  description: string;
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Current progress value (0-100) */
  progress: number;
  /** Whether the power-up is unlocked */
  isUnlocked?: boolean;
  /** Optional custom icon color */
  iconColor?: string;
  /** Optional callback when card is pressed */
  onPress?: () => void;
  /** Optional custom style */
  style?: ViewStyle;
  /** Whether to animate the progress bar on mount */
  animateOnMount?: boolean;
  /** Custom progress bar color */
  progressColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PowerUpCard({
  id,
  title,
  description,
  icon,
  progress,
  isUnlocked = false,
  iconColor = PROGRESS_COLORS.lime,
  onPress,
  style,
  animateOnMount = true,
  progressColor = PROGRESS_COLORS.lime,
}: PowerUpCardProps) {
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const iconPulse = useSharedValue(1);
  const shimmer = useSharedValue(0);

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Animate progress bar on mount
  useEffect(() => {
    if (animateOnMount) {
      progressWidth.value = withTiming(clampedProgress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progressWidth.value = clampedProgress;
    }
  }, [clampedProgress, animateOnMount]);

  // Pulsing icon effect for unlocked items
  useEffect(() => {
    if (isUnlocked) {
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isUnlocked]);

  // Shimmer effect on progress bar
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.02, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  const handlePress = () => {
    GameHaptics.buttonPress();
    onPress?.();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-100, 300]),
      },
    ],
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  // Platform-specific glow style
  const glowStyle = Platform.select({
    web: {
      boxShadow: isUnlocked
        ? `0 4px 20px ${PROGRESS_COLORS.limeGlow}`
        : 'none',
    } as ViewStyle,
    default: isUnlocked
      ? {
          shadowColor: PROGRESS_COLORS.lime,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }
      : {},
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress}
      style={[animatedCardStyle, style]}
    >
      <LinearGradient
        colors={[PROGRESS_COLORS.cardGradientStart, PROGRESS_COLORS.cardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          glowStyle,
          isUnlocked && styles.cardUnlocked,
        ]}
      >
        {/* Icon Container */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <LinearGradient
            colors={
              isUnlocked
                ? [progressColor, PROGRESS_COLORS.limeDark]
                : [PROGRESS_COLORS.border, '#1A1A2E']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBackground}
          >
            <Ionicons
              name={icon}
              size={28}
              color={isUnlocked ? '#FFFFFF' : iconColor}
            />
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {isUnlocked && (
              <View style={styles.unlockedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={PROGRESS_COLORS.lime} />
                <Text style={styles.unlockedText}>Unlocked</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: progressColor },
                  animatedProgressStyle,
                ]}
              >
                {/* Shimmer effect */}
                <Animated.View style={[styles.shimmer, animatedShimmerStyle]} />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>
              {Math.round(clampedProgress)}%
            </Text>
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PROGRESS_COLORS.border,
    overflow: 'hidden',
  },
  cardUnlocked: {
    borderColor: PROGRESS_COLORS.lime + '40',
  },
  iconContainer: {
    marginRight: 14,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PROGRESS_COLORS.textPrimary,
    flex: 1,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: PROGRESS_COLORS.lime + '20',
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: PROGRESS_COLORS.lime,
  },
  description: {
    fontSize: 13,
    color: PROGRESS_COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: PROGRESS_COLORS.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: PROGRESS_COLORS.lime,
    minWidth: 36,
    textAlign: 'right',
  },
});

export default PowerUpCard;

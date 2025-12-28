/**
 * SuccessOverlay.tsx
 * Full-screen success celebration with checkmark, confetti, and XP display
 * Creates a satisfying reward moment for completing tasks
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, spacing, typography } from '../../theme/colors';
import { Confetti } from './Confetti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuccessOverlayProps {
  /** Whether overlay is visible */
  visible: boolean;
  /** Title text (default: "NICE!") */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** XP earned (optional) */
  xpEarned?: number;
  /** Icon type */
  icon?: 'checkmark' | 'trophy' | 'star' | 'medal';
  /** Auto-dismiss after this many ms (default: 2000, 0 = manual) */
  autoDismissMs?: number;
  /** Called when overlay should dismiss */
  onDismiss: () => void;
  /** Show confetti (default: true) */
  showConfetti?: boolean;
  /** Confetti intensity */
  confettiIntensity?: 'small' | 'medium' | 'large';
  /** Custom gradient colors */
  gradientColors?: string[];
}

const ICONS = {
  checkmark: 'checkmark-circle',
  trophy: 'trophy',
  star: 'star',
  medal: 'medal',
} as const;

export function SuccessOverlay({
  visible,
  title = 'NICE!',
  subtitle,
  xpEarned,
  icon = 'checkmark',
  autoDismissMs = 2000,
  onDismiss,
  showConfetti = true,
  confettiIntensity = 'medium',
  gradientColors,
}: SuccessOverlayProps) {
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(-15);
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const xpScale = useSharedValue(0);
  const xpCounter = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Haptic feedback
  const triggerHaptics = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Haptics not available
      }
    }
  }, []);

  useEffect(() => {
    if (visible) {
      triggerHaptics();

      // Icon burst animation
      iconScale.value = withSequence(
        withSpring(1.4, { damping: 5, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      // Icon rotation wiggle
      iconRotation.value = withSequence(
        withTiming(-15, { duration: 0 }),
        withTiming(10, { duration: 100 }),
        withTiming(-8, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      // Title fade and scale
      titleOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      titleScale.value = withDelay(
        200,
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      // XP counter
      if (xpEarned && xpEarned > 0) {
        xpScale.value = withDelay(
          500,
          withSpring(1, { damping: 8, stiffness: 150 })
        );
        xpCounter.value = withDelay(
          600,
          withTiming(xpEarned, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
          })
        );
      }

      // Glow pulse
      glowOpacity.value = withDelay(
        100,
        withSequence(
          withTiming(0.8, { duration: 300 }),
          withTiming(0.4, { duration: 500 }),
          withTiming(0.6, { duration: 400 })
        )
      );

      // Auto dismiss
      if (autoDismissMs > 0) {
        const timer = setTimeout(onDismiss, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset values
      iconScale.value = 0;
      iconRotation.value = -15;
      titleOpacity.value = 0;
      titleScale.value = 0.8;
      xpScale.value = 0;
      xpCounter.value = 0;
      glowOpacity.value = 0;
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const animatedXpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
    opacity: xpScale.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  const iconName = ICONS[icon];
  const iconColor = icon === 'trophy' || icon === 'star' || icon === 'medal'
    ? colors.energy
    : colors.success;

  const finalGradient = gradientColors ||
    (icon === 'trophy' || icon === 'star' || icon === 'medal'
      ? [colors.energy, colors.warning]
      : [colors.success, colors.accent]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        {/* Confetti */}
        {showConfetti && (
          <Confetti active={visible} intensity={confettiIntensity} />
        )}

        {/* Content */}
        <TouchableOpacity
          style={styles.contentContainer}
          activeOpacity={1}
          onPress={onDismiss}
        >
          {/* Glow background */}
          <Animated.View
            style={[
              styles.glowBackground,
              { backgroundColor: iconColor },
              animatedGlowStyle,
            ]}
          />

          {/* Icon */}
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <LinearGradient
              colors={finalGradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={iconName as any} size={64} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, animatedTitleStyle]}>
            {title}
          </Animated.Text>

          {/* Subtitle */}
          {subtitle && (
            <Animated.Text style={[styles.subtitle, animatedTitleStyle]}>
              {subtitle}
            </Animated.Text>
          )}

          {/* XP Earned */}
          {xpEarned !== undefined && xpEarned > 0 && (
            <Animated.View style={[styles.xpContainer, animatedXpStyle]}>
              <Ionicons name="star" size={24} color={colors.energy} />
              <Text style={styles.xpText}>+{xpEarned} XP</Text>
            </Animated.View>
          )}

          {/* Dismiss hint */}
          <Animated.Text
            style={styles.dismissHint}
            entering={FadeIn.delay(1200).duration(300)}
          >
            Tap to continue
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 35, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
    maxWidth: 320,
  },
  glowBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 60,
      },
    }),
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
      } as any,
      default: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: typography.size4xl,
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizeLg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  xpText: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.energy,
    letterSpacing: 1,
  },
  dismissHint: {
    position: 'absolute',
    bottom: -80,
    fontSize: typography.sizeSm,
    color: colors.textMuted,
  },
});

export default SuccessOverlay;

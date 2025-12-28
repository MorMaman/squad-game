/**
 * LevelUpOverlay.tsx
 * Epic level up celebration with massive confetti and dramatic animations
 * The ultimate dopamine hit for player progression
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
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, spacing, typography, levelConfig } from '../../theme/colors';
import { Confetti } from './Confetti';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LevelUpOverlayProps {
  /** Whether overlay is visible */
  visible: boolean;
  /** New level reached */
  newLevel: number;
  /** New title unlocked (if any) */
  newTitle?: string;
  /** XP earned that triggered level up */
  xpEarned?: number;
  /** Called when overlay should dismiss */
  onDismiss: () => void;
  /** Auto-dismiss after this many ms (default: 4000, 0 = manual) */
  autoDismissMs?: number;
}

export function LevelUpOverlay({
  visible,
  newLevel,
  newTitle,
  xpEarned,
  onDismiss,
  autoDismissMs = 4000,
}: LevelUpOverlayProps) {
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const levelRotation = useSharedValue(-180);
  const levelNumberScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const titleScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const raysRotation = useSharedValue(0);
  const xpOpacity = useSharedValue(0);

  // Epic haptic pattern: Heavy > Medium > Light > Success
  const triggerHapticPattern = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      // Heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise((r) => setTimeout(r, 100));

      // Medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((r) => setTimeout(r, 100));

      // Light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((r) => setTimeout(r, 50));

      // Success notification
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics not available
    }
  }, []);

  useEffect(() => {
    if (visible) {
      triggerHapticPattern();

      // Overlay fade in
      overlayOpacity.value = withTiming(1, { duration: 300 });

      // Level badge dramatic entrance
      levelScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(
          200,
          withSpring(1.3, { damping: 4, stiffness: 150 })
        ),
        withSpring(1, { damping: 6, stiffness: 200 })
      );

      levelRotation.value = withDelay(
        200,
        withSpring(0, { damping: 8, stiffness: 80 })
      );

      // Level number pop
      levelNumberScale.value = withDelay(
        600,
        withSequence(
          withSpring(1.5, { damping: 4, stiffness: 200 }),
          withSpring(1, { damping: 6, stiffness: 150 })
        )
      );

      // Text animations
      textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
      textTranslateY.value = withDelay(
        400,
        withSpring(0, { damping: 10, stiffness: 100 })
      );

      // Title reveal
      if (newTitle) {
        titleScale.value = withDelay(
          800,
          withSpring(1, { damping: 8, stiffness: 150 })
        );
      }

      // Glow effects
      glowOpacity.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );

      glowScale.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        )
      );

      // Rotating rays
      raysRotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1
      );

      // XP display
      if (xpEarned) {
        xpOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
      }

      // Auto dismiss
      if (autoDismissMs > 0) {
        const timer = setTimeout(onDismiss, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset all values
      overlayOpacity.value = 0;
      levelScale.value = 0;
      levelRotation.value = -180;
      levelNumberScale.value = 0;
      textOpacity.value = 0;
      textTranslateY.value = 30;
      titleScale.value = 0;
      glowOpacity.value = 0;
      glowScale.value = 0.5;
      raysRotation.value = 0;
      xpOpacity.value = 0;
    }
  }, [visible]);

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const animatedLevelBadge = useAnimatedStyle(() => ({
    transform: [
      { scale: levelScale.value },
      { rotate: `${levelRotation.value}deg` },
    ],
  }));

  const animatedLevelNumber = useAnimatedStyle(() => ({
    transform: [{ scale: levelNumberScale.value }],
  }));

  const animatedText = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const animatedTitle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleScale.value,
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const animatedRays = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotation.value}deg` }],
  }));

  const animatedXp = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
  }));

  if (!visible) return null;

  const displayTitle = newTitle || levelConfig.getTitle(newLevel);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, animatedOverlay]}>
        {/* Massive confetti */}
        <Confetti active={visible} intensity="large" duration={3500} />

        {/* Rotating light rays */}
        <Animated.View style={[styles.raysContainer, animatedRays]}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.ray,
                { transform: [{ rotate: `${i * 30}deg` }] },
              ]}
            />
          ))}
        </Animated.View>

        {/* Central glow */}
        <Animated.View style={[styles.centralGlow, animatedGlow]} />

        {/* Content */}
        <TouchableOpacity
          style={styles.contentContainer}
          activeOpacity={1}
          onPress={onDismiss}
        >
          {/* LEVEL UP text */}
          <Animated.View style={animatedText}>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
          </Animated.View>

          {/* Level badge */}
          <Animated.View style={[styles.levelBadgeContainer, animatedLevelBadge]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary, colors.accent]}
              style={styles.levelBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.levelBadgeInner}>
                <Animated.Text
                  style={[styles.levelNumber, animatedLevelNumber]}
                >
                  {newLevel}
                </Animated.Text>
              </View>
            </LinearGradient>

            {/* Orbiting stars */}
            <View style={styles.orbitContainer}>
              {[0, 120, 240].map((angle, i) => (
                <View
                  key={i}
                  style={[
                    styles.orbitingStar,
                    { transform: [{ rotate: `${angle}deg` }, { translateX: 75 }] },
                  ]}
                >
                  <Ionicons name="star" size={16} color={colors.energy} />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* New title */}
          {displayTitle && (
            <Animated.View style={[styles.titleContainer, animatedTitle]}>
              <View style={styles.titleBadge}>
                <Ionicons name="ribbon" size={20} color={colors.energy} />
                <Text style={styles.titleText}>{displayTitle}</Text>
              </View>
            </Animated.View>
          )}

          {/* XP earned */}
          {xpEarned !== undefined && xpEarned > 0 && (
            <Animated.View style={[styles.xpContainer, animatedXp]}>
              <Ionicons name="star" size={20} color={colors.energy} />
              <Text style={styles.xpText}>+{xpEarned} XP</Text>
            </Animated.View>
          )}

          {/* Dismiss hint */}
          <Animated.Text
            style={styles.dismissHint}
            entering={FadeIn.delay(2000).duration(300)}
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
    backgroundColor: 'rgba(10, 10, 30, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 4,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.energy,
    opacity: 0.15,
    borderRadius: 2,
  },
  centralGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 80,
      },
    }),
  },
  contentContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  levelUpText: {
    fontSize: typography.size5xl,
    fontWeight: typography.weightExtrabold,
    color: colors.energy,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: spacing.xl,
    textShadowColor: colors.energy,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  levelBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  levelBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 0 60px rgba(124, 58, 237, 0.6)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  levelBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelNumber: {
    fontSize: 64,
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  orbitContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitingStar: {
    position: 'absolute',
  },
  titleContainer: {
    marginBottom: spacing.lg,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  titleText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.energy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  xpText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.energy,
  },
  dismissHint: {
    position: 'absolute',
    bottom: -100,
    fontSize: typography.sizeSm,
    color: colors.textMuted,
  },
});

export default LevelUpOverlay;

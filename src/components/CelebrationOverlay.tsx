import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, componentColors } from '../theme/colors';

// Confetti particle type
interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

interface CelebrationOverlayProps {
  type: 'win' | 'levelUp' | 'badge' | 'streak';
  title: string;
  subtitle?: string;
  xpEarned?: number;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  badgeColor?: string;
  streakDays?: number;
  newLevel?: number;
  visible: boolean;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 50;

// Generate confetti particles
const generateConfetti = (): Particle[] => {
  const confettiColors = componentColors.celebration.confettiColors;
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 500,
    size: Math.random() * 10 + 5,
    rotation: Math.random() * 360,
  }));
};

// Individual confetti piece component
function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const horizontalDrift = (Math.random() - 0.5) * 100;

    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: 3000 + Math.random() * 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(horizontalDrift, { duration: 500 }),
          withTiming(-horizontalDrift, { duration: 500 })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(particle.rotation + 360, { duration: 1000 }),
        -1
      )
    );

    opacity.value = withDelay(
      2500 + particle.delay,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: particle.x,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: Math.random() > 0.5 ? particle.size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationOverlay({
  type,
  title,
  subtitle,
  xpEarned,
  badgeIcon,
  badgeColor,
  streakDays,
  newLevel,
  visible,
  onDismiss,
  autoDismissMs = 4000,
}: CelebrationOverlayProps) {
  const confetti = React.useMemo(() => generateConfetti(), [visible]);

  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const xpCounter = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Haptic feedback
  const triggerHaptics = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        if (type === 'win') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise((r) => setTimeout(r, 100));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise((r) => setTimeout(r, 100));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (type === 'levelUp') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await new Promise((r) => setTimeout(r, 50));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        // Haptics not available
      }
    }
  }, [type]);

  useEffect(() => {
    if (visible) {
      triggerHaptics();

      // Icon animation
      iconScale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 100 }),
        withSpring(1, { damping: 8 })
      );

      if (type === 'win' || type === 'levelUp') {
        iconRotation.value = withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 200 }),
          withTiming(0, { duration: 100 })
        );
      }

      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        true
      );

      // XP counter animation
      if (xpEarned && xpEarned > 0) {
        xpCounter.value = withTiming(xpEarned, {
          duration: 1500,
          easing: Easing.out(Easing.cubic),
        });
      }

      // Auto dismiss
      if (autoDismissMs > 0) {
        const timer = setTimeout(onDismiss, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      iconScale.value = 0;
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

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedXpStyle = useAnimatedStyle(() => ({
    opacity: xpCounter.value > 0 ? 1 : 0,
  }));

  // Get icon and color based on type
  const getIconConfig = (): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'win':
        return { icon: 'trophy', color: componentColors.celebration.titleWin };
      case 'levelUp':
        return { icon: 'arrow-up-circle', color: componentColors.celebration.titleLevelUp };
      case 'badge':
        return { icon: badgeIcon || 'ribbon', color: badgeColor || componentColors.celebration.titleBadge };
      case 'streak':
        return { icon: 'flame', color: componentColors.celebration.titleStreak };
    }
  };

  const iconConfig = getIconConfig();

  // Get title color
  const getTitleColor = (): string => {
    switch (type) {
      case 'win':
        return componentColors.celebration.titleWin;
      case 'levelUp':
        return componentColors.celebration.titleLevelUp;
      case 'badge':
        return componentColors.celebration.titleBadge;
      case 'streak':
        return componentColors.celebration.titleStreak;
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
      >
        {/* Confetti */}
        {(type === 'win' || type === 'levelUp') && (
          <View style={styles.confettiContainer}>
            {confetti.map((particle) => (
              <ConfettiPiece key={particle.id} particle={particle} />
            ))}
          </View>
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
              { backgroundColor: iconConfig.color },
              animatedGlowStyle,
            ]}
          />

          {/* Icon */}
          <Animated.View
            style={[styles.iconContainer, animatedIconStyle]}
            entering={ZoomIn.delay(200).duration(400)}
          >
            <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '30' }]}>
              <Ionicons name={iconConfig.icon} size={64} color={iconConfig.color} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[styles.title, { color: getTitleColor() }]}
            entering={SlideInUp.delay(400).duration(400)}
          >
            {title}
          </Animated.Text>

          {/* Subtitle / Level Info */}
          {subtitle && (
            <Animated.Text
              style={styles.subtitle}
              entering={SlideInUp.delay(500).duration(400)}
            >
              {subtitle}
            </Animated.Text>
          )}

          {/* Level up info */}
          {type === 'levelUp' && newLevel && (
            <Animated.View
              style={styles.levelUpContainer}
              entering={SlideInUp.delay(600).duration(400)}
            >
              <Text style={styles.levelUpLabel}>NEW LEVEL</Text>
              <View style={styles.levelCircle}>
                <Text style={styles.levelNumber}>{newLevel}</Text>
              </View>
            </Animated.View>
          )}

          {/* Streak info */}
          {type === 'streak' && streakDays && (
            <Animated.View
              style={styles.streakContainer}
              entering={SlideInUp.delay(600).duration(400)}
            >
              <Ionicons name="flame" size={32} color={colors.streakFire} />
              <Text style={styles.streakNumber}>{streakDays}</Text>
              <Text style={styles.streakLabel}>DAYS</Text>
            </Animated.View>
          )}

          {/* XP Earned */}
          {xpEarned !== undefined && xpEarned > 0 && (
            <Animated.View
              style={[styles.xpContainer, animatedXpStyle]}
              entering={SlideInUp.delay(700).duration(400)}
            >
              <Ionicons name="star" size={20} color={colors.energy} />
              <Text style={styles.xpText}>+{xpEarned} XP</Text>
            </Animated.View>
          )}

          {/* Dismiss hint */}
          <Animated.Text
            style={styles.dismissHint}
            entering={FadeIn.delay(1500).duration(500)}
          >
            Tap anywhere to continue
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: componentColors.celebration.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: -50,
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
    opacity: 0.2,
    ...Platform.select({
      web: {
        boxShadow: '0 0 100px currentColor',
      } as any,
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
      },
    }),
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: typography.size4xl,
    fontWeight: typography.weightExtrabold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.sizeLg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  levelUpContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  levelUpLabel: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  levelCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primaryLight,
  },
  levelNumber: {
    fontSize: typography.size4xl,
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  streakNumber: {
    fontSize: typography.size3xl,
    fontWeight: typography.weightExtrabold,
    color: colors.streakFire,
  },
  streakLabel: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    fontWeight: typography.weightBold,
    letterSpacing: 1,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  xpText: {
    fontSize: typography.sizeXl,
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

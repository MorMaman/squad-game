import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

interface RivalPlayer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  score?: number;
}

interface RivalryPanelProps {
  rival1: RivalPlayer;
  rival2: RivalPlayer;
  declaredBy: string;
  expiresAt: number;
  visible: boolean;
}

// Rivalry colors - competitive red/orange scheme
const rivalryColors = {
  primary: '#EF4444', // Red
  secondary: '#F97316', // Orange
  gradient: ['#EF4444', '#DC2626', '#991B1B'] as const,
  backgroundGradient: ['rgba(239, 68, 68, 0.2)', 'rgba(153, 27, 27, 0.1)', 'rgba(17, 24, 39, 0.95)'] as const,
  glow: 'rgba(239, 68, 68, 0.5)',
  vsColor: '#FACC15', // Yellow for VS
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function RivalryPanel({
  rival1,
  rival2,
  declaredBy,
  expiresAt,
  visible,
}: RivalryPanelProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Animation values
  const vsScale = useSharedValue(0);
  const vsPulse = useSharedValue(1);
  const rival1SlideX = useSharedValue(-50);
  const rival2SlideX = useSharedValue(50);
  const glowOpacity = useSharedValue(0.3);

  // Calculate time remaining
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);

      if (remaining <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Trigger animations when visible
  useEffect(() => {
    if (visible) {
      // VS animation
      vsScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.3, { damping: 6, stiffness: 100 }),
          withSpring(1, { damping: 8 })
        )
      );

      // VS pulsing
      vsPulse.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(1.1, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        )
      );

      // Rival slides
      rival1SlideX.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 80 }));
      rival2SlideX.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 80 }));

      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      vsScale.value = 0;
      rival1SlideX.value = -50;
      rival2SlideX.value = 50;
      glowOpacity.value = 0.3;
    }
  }, [visible]);

  const animatedVsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vsScale.value * vsPulse.value }],
  }));

  const animatedRival1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: rival1SlideX.value }],
    opacity: rival1SlideX.value === 0 ? 1 : 0.5,
  }));

  const animatedRival2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: rival2SlideX.value }],
    opacity: rival2SlideX.value === 0 ? 1 : 0.5,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Determine leader
  const hasScores = rival1.score !== undefined && rival2.score !== undefined;
  const rival1IsLeading = hasScores && rival1.score! > rival2.score!;
  const rival2IsLeading = hasScores && rival2.score! > rival1.score!;
  const isTied = hasScores && rival1.score === rival2.score;

  // Platform-specific glow
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 30px ${rivalryColors.glow}`,
    } as any,
    default: {
      shadowColor: rivalryColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, glowStyle]}
      entering={SlideInDown.duration(400).springify()}
      exiting={FadeOut.duration(200)}
    >
      <LinearGradient
        colors={rivalryColors.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Animated glow overlay */}
      <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="flash" size={16} color={rivalryColors.primary} />
        <Text style={styles.headerText}>HEAD TO HEAD</Text>
        <Ionicons name="flash" size={16} color={rivalryColors.primary} />
      </View>

      {/* Rivals row */}
      <View style={styles.rivalsRow}>
        {/* Rival 1 */}
        <Animated.View style={[styles.rivalContainer, animatedRival1Style]}>
          <View style={[styles.avatarWrapper, rival1IsLeading && styles.leadingAvatar]}>
            <Avatar
              uri={rival1.avatarUrl}
              name={rival1.name}
              size="large"
              style={styles.avatar}
            />
            {rival1IsLeading && (
              <View style={styles.leaderBadge}>
                <Ionicons name="arrow-up" size={12} color={colors.success} />
              </View>
            )}
          </View>
          <Text style={styles.rivalName} numberOfLines={1}>
            {rival1.name}
          </Text>
          {hasScores && (
            <Text style={[styles.scoreText, rival1IsLeading && styles.leadingScore]}>
              {rival1.score}
            </Text>
          )}
        </Animated.View>

        {/* VS Circle */}
        <Animated.View style={[styles.vsContainer, animatedVsStyle]}>
          <LinearGradient
            colors={rivalryColors.gradient}
            style={styles.vsGradient}
          >
            <Text style={styles.vsText}>VS</Text>
          </LinearGradient>
        </Animated.View>

        {/* Rival 2 */}
        <Animated.View style={[styles.rivalContainer, animatedRival2Style]}>
          <View style={[styles.avatarWrapper, rival2IsLeading && styles.leadingAvatar]}>
            <Avatar
              uri={rival2.avatarUrl}
              name={rival2.name}
              size="large"
              style={styles.avatar}
            />
            {rival2IsLeading && (
              <View style={styles.leaderBadge}>
                <Ionicons name="arrow-up" size={12} color={colors.success} />
              </View>
            )}
          </View>
          <Text style={styles.rivalName} numberOfLines={1}>
            {rival2.name}
          </Text>
          {hasScores && (
            <Text style={[styles.scoreText, rival2IsLeading && styles.leadingScore]}>
              {rival2.score}
            </Text>
          )}
        </Animated.View>
      </View>

      {/* Timer */}
      <Animated.View
        style={styles.timerContainer}
        entering={FadeIn.delay(500).duration(300)}
      >
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.timerText}>{timeLeft}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: rivalryColors.primary,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rivalryColors.primary,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: rivalryColors.primary,
    letterSpacing: 2,
  },
  rivalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rivalContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 999,
    padding: 3,
    borderWidth: 2,
    borderColor: colors.border,
  },
  leadingAvatar: {
    borderColor: colors.success,
    borderWidth: 3,
  },
  avatar: {
    borderWidth: 0,
  },
  leaderBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.success,
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  rivalName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    maxWidth: 100,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.textSecondary,
  },
  leadingScore: {
    color: colors.success,
  },
  vsContainer: {
    marginHorizontal: spacing.md,
  },
  vsGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightExtrabold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  timerText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});

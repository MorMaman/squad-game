/**
 * HeadlineBanner.tsx
 * Banner showing the crown holder's headline at top of app
 * Features golden gradient, countdown timer, and shine animation
 * Supports RTL layout for Hebrew language
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  SlideInUp,
  SlideOutUp,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { useRTL, flipStyle } from '../utils/rtl';
import { RTLView, RTLIcon } from './RTLView';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Crown color constants
const CROWN_COLORS = {
  gold: '#FFD700',
  goldDark: '#FFA500',
  goldLight: '#FFEC8B',
  gradientStart: '#FFD700',
  gradientMid: '#FFA500',
  gradientEnd: '#FF8C00',
  glow: 'rgba(255, 215, 0, 0.4)',
} as const;

export interface HeadlineBannerProps {
  /** The headline text set by the crown holder */
  headline: string;
  /** Name of the player holding the crown */
  playerName: string;
  /** Avatar URL of the crown holder */
  avatarUrl?: string;
  /** Timestamp when the headline expires */
  expiresAt: number;
  /** Callback when dismiss button is pressed */
  onDismiss?: () => void;
  /** Whether the banner is visible */
  visible?: boolean;
}

/**
 * HeadlineBanner - Full-width banner displaying the crown holder's headline
 * Shown at the top of the app with animated entrance and sparkle effects
 */
export function HeadlineBanner({
  headline,
  playerName,
  avatarUrl,
  expiresAt,
  onDismiss,
  visible = true,
}: HeadlineBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  // Animation values
  const shimmerPosition = useSharedValue(-SCREEN_WIDTH);
  const glowPulse = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  // Calculate and update time left
  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Initialize animations
  useEffect(() => {
    // Shimmer sweep animation
    shimmerPosition.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH * 2, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        }),
        withDelay(1000, withTiming(-SCREEN_WIDTH, { duration: 0 }))
      ),
      -1,
      false
    );

    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Sparkle fade in/out
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  // Format time remaining
  const formatTimeLeft = () => {
    if (timeLeft <= 0) return t('home.expired');

    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Animated styles
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowPulse.value, [0.5, 1], [0.3, 0.6]);
    return { opacity };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  // Get initials for fallback avatar
  const initials = playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.container}
      entering={SlideInUp.duration(400).springify()}
      exiting={SlideOutUp.duration(300)}
    >
      <LinearGradient
        colors={[CROWN_COLORS.gradientStart, CROWN_COLORS.gradientMid, CROWN_COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated glow overlay */}
        <Animated.View style={[styles.glowOverlay, glowStyle]} />

        {/* Shimmer sweep effect */}
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmer}
          />
        </Animated.View>

        {/* Content - RTL-aware row */}
        <RTLView row style={styles.content}>
          {/* Crown icon + Avatar */}
          <View style={styles.avatarSection}>
            <View style={[
              styles.crownContainer,
              isRTL ? styles.crownContainerRTL : styles.crownContainerLTR
            ]}>
              <Ionicons name="ribbon" size={16} color="#FFFFFF" />
            </View>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          {/* Headline content */}
          <View style={styles.headlineSection}>
            <RTLView row style={styles.headlineHeader}>
              <Text style={[
                styles.playerName,
                isRTL && styles.playerNameRTL
              ]}>{playerName}</Text>
              <Animated.View style={sparkleStyle}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </Animated.View>
            </RTLView>
            <Text style={[
              styles.headline,
              isRTL && styles.headlineRTL
            ]} numberOfLines={2}>
              {headline}
            </Text>
          </View>

          {/* Timer + Dismiss */}
          <View style={[
            styles.rightSection,
            isRTL && styles.leftSection
          ]}>
            <RTLView row style={styles.timerContainer}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.timerText}>{formatTimeLeft()}</Text>
            </RTLView>
            {onDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </RTLView>

        {/* Sparkle decorations - position adjusted for RTL */}
        <Animated.View style={[
          styles.sparkle,
          isRTL ? styles.sparkle1RTL : styles.sparkle1,
          sparkleStyle
        ]}>
          <Ionicons name="star" size={8} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={[
          styles.sparkle,
          isRTL ? styles.sparkle2RTL : styles.sparkle2,
          sparkleStyle
        ]}>
          <Ionicons name="star" size={6} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={[
          styles.sparkle,
          isRTL ? styles.sparkle3RTL : styles.sparkle3,
          sparkleStyle
        ]}>
          <Ionicons name="star" size={10} color="#FFFFFF" />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: `0 4px 20px ${CROWN_COLORS.glow}`,
      } as any,
      default: {
        shadowColor: CROWN_COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmer: {
    flex: 1,
    width: 100,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSection: {
    position: 'relative',
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.full,
    padding: 2,
  },
  crownContainerLTR: {
    right: -4,
  },
  crownContainerRTL: {
    left: -4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
  },
  headlineSection: {
    flex: 1,
  },
  headlineHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  playerName: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  playerNameRTL: {
    textAlign: 'right',
  },
  headline: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  headlineRTL: {
    textAlign: 'right',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  leftSection: {
    alignItems: 'flex-start',
  },
  timerContainer: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timerText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: 'rgba(255, 255, 255, 0.9)',
    fontVariant: ['tabular-nums'],
  },
  dismissButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.full,
  },
  sparkle: {
    position: 'absolute',
  },
  // LTR sparkle positions
  sparkle1: {
    top: 8,
    left: '30%',
  },
  sparkle2: {
    bottom: 10,
    right: '25%',
  },
  sparkle3: {
    top: '50%',
    right: 60,
  },
  // RTL sparkle positions (mirrored)
  sparkle1RTL: {
    top: 8,
    right: '30%',
  },
  sparkle2RTL: {
    bottom: 10,
    left: '25%',
  },
  sparkle3RTL: {
    top: '50%',
    left: 60,
  },
});

export default HeadlineBanner;

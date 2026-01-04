/**
 * EventBanner.tsx
 * Daily event banner showing event status and countdown
 * Features gradient background and animated pulse when event is open
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { typography, spacing, borderRadius, colors } from '../../theme/colors';
import { GameHaptics } from '../../utils/haptics';
import type { DailyEvent, EventType } from '../../types';

// Home screen colors
const HOME_COLORS = {
  background: '#0A0E27',
  card: '#1A1A2E',
  primary: '#FF6B00',
  secondary: '#3B82F6',
  accent: '#9B59FF',
};

export type EventBannerStatus = 'locked' | 'upcoming' | 'open' | 'closed';

export interface EventBannerProps {
  /** The event data */
  event: DailyEvent | null;
  /** Time remaining in milliseconds (for countdown) */
  timeRemaining: number;
  /** Status of the event */
  status: EventBannerStatus;
  /** Called when banner is tapped */
  onPress?: () => void;
}

const EVENT_ICONS: Record<EventType, keyof typeof Ionicons.glyphMap> = {
  LIVE_SELFIE: 'camera',
  PRESSURE_TAP: 'finger-print',
  POLL: 'bar-chart',
};

const EVENT_NAMES: Record<EventType, string> = {
  LIVE_SELFIE: 'Live Selfie',
  PRESSURE_TAP: 'Pressure Tap',
  POLL: 'Daily Poll',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function EventBanner({
  event,
  timeRemaining,
  status,
  onPress,
}: EventBannerProps) {
  // Animation values
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  const glowIntensity = useSharedValue(0.5);
  const iconRotation = useSharedValue(0);

  // Setup animations based on status
  useEffect(() => {
    if (status === 'open') {
      // Pulse animation for open events
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Glow intensity pulse
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Subtle icon rotation
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(5, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 0;
      glowIntensity.value = 0.5;
      iconRotation.value = 0;
    }
  }, [status]);

  const handlePress = () => {
    if (status === 'locked' || status === 'closed') return;

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

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(pulse.value, [0, 1], [1, 1.02]);
    return {
      transform: [{ scale: scaleValue }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: glowIntensity.value,
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  // Format time remaining
  const formatTimeRemaining = (): string => {
    if (timeRemaining <= 0) {
      return status === 'open' ? 'Open now!' : 'Closed';
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Opens in ${hours}h ${minutes}m`;
    }
    return `Opens in ${minutes}m`;
  };

  // Get gradient colors based on status
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (status) {
      case 'open':
        return [HOME_COLORS.accent, '#EC4899'];
      case 'upcoming':
        return [HOME_COLORS.secondary, HOME_COLORS.accent];
      case 'locked':
        return ['#374151', '#4B5563'];
      case 'closed':
        return ['#374151', '#4B5563'];
      default:
        return [HOME_COLORS.accent, '#EC4899'];
    }
  };

  // Get status indicator config
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return {
          icon: 'radio-button-on' as keyof typeof Ionicons.glyphMap,
          color: GAME_COLORS.energy.green,
          label: 'LIVE',
        };
      case 'upcoming':
        return {
          icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
          color: GAME_COLORS.reward.gold,
          label: 'UPCOMING',
        };
      case 'locked':
        return {
          icon: 'lock-closed' as keyof typeof Ionicons.glyphMap,
          color: colors.textMuted,
          label: 'LOCKED',
        };
      case 'closed':
        return {
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          color: colors.textMuted,
          label: 'CLOSED',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const gradientColors = getGradientColors();
  const isInteractive = status === 'open' || status === 'upcoming';

  if (!event) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
        <Text style={styles.emptyText}>No event scheduled</Text>
      </View>
    );
  }

  const eventIcon = EVENT_ICONS[event.event_type];
  const eventName = EVENT_NAMES[event.event_type];

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={!isInteractive}
      style={[styles.wrapper, containerAnimatedStyle]}
    >
      <Animated.View
        style={[
          styles.glowContainer,
          {
            shadowColor: status === 'open' ? HOME_COLORS.accent : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 15,
          },
          status === 'open' && glowAnimatedStyle,
        ]}
      >
        <Animated.View style={status === 'open' ? pulseAnimatedStyle : undefined}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
          >
            {/* Left - Event Icon */}
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              <Ionicons name={eventIcon} size={28} color="#FFFFFF" />
            </Animated.View>

            {/* Center - Event Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.eventName}>{eventName}</Text>
              <Text style={styles.timeText}>{formatTimeRemaining()}</Text>
            </View>

            {/* Right - Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                {status === 'open' && (
                  <View style={[styles.liveDot, { backgroundColor: statusConfig.color }]} />
                )}
                {status !== 'open' && (
                  <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                )}
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              {isInteractive && (
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
  },
  glowContainer: {
    borderRadius: borderRadius.lg,
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: HOME_COLORS.card,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.textMuted,
  },
});

export default EventBanner;

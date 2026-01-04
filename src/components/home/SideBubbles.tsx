/**
 * SideBubbles.tsx
 * Floating status indicators on screen edges
 * Features animated entrance, glow effects, and tap interactions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { typography, spacing, borderRadius, colors } from '../../theme/colors';
import { GameHaptics } from '../../utils/haptics';
import type { Profile, PowerType } from '../../types';

// Home screen colors
const HOME_COLORS = {
  background: '#0A0E27',
  card: '#1A1A2E',
  primary: '#FF6B00',
  secondary: '#3B82F6',
  accent: '#9B59FF',
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CrownHolderData {
  profile: Profile;
  holdingSince?: string;
}

export interface ActivePowerData {
  type: PowerType;
  expiresAt?: string;
}

export interface SideBubblesProps {
  /** Crown holder data (shown on left side) */
  crownHolder?: CrownHolderData | null;
  /** Wild cards count (shown on left side below crown holder) */
  wildCardCount?: number;
  /** Whether current user is being targeted (shown on right side) */
  isTargeted?: boolean;
  /** Active power data (shown on right side) */
  activePower?: ActivePowerData | null;
  /** Called when a bubble is pressed */
  onBubblePress?: (bubbleType: 'crownHolder' | 'wildCards' | 'targeted' | 'power') => void;
}

type BubbleType = 'crownHolder' | 'wildCards' | 'targeted' | 'power';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BubbleProps {
  type: BubbleType;
  side: 'left' | 'right';
  onPress?: () => void;
  children: React.ReactNode;
  glowColor?: string;
  isActive?: boolean;
  delay?: number;
}

function Bubble({
  type,
  side,
  onPress,
  children,
  glowColor = HOME_COLORS.accent,
  isActive = false,
  delay = 0,
}: BubbleProps) {
  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const translateX = useSharedValue(side === 'left' ? -80 : 80);
  const opacity = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withSpring(0, GAME_SPRINGS.bouncy);
      opacity.value = withTiming(1, { duration: 300 });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  // Active glow animation
  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isActive]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: GAME_DURATIONS.fast }),
      withSpring(1, GAME_SPRINGS.bouncy)
    );
    GameHaptics.buttonPress();
    onPress?.();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.bubble,
        side === 'left' ? styles.bubbleLeft : styles.bubbleRight,
        containerAnimatedStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.bubbleInner,
          {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 12,
          },
          isActive && glowAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[HOME_COLORS.card, '#252542']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bubbleGradient,
            { borderColor: `${glowColor}40` },
          ]}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Crown Holder Bubble
interface CrownHolderBubbleProps {
  data: CrownHolderData;
  onPress?: () => void;
}

function CrownHolderBubble({ data, onPress }: CrownHolderBubbleProps) {
  const crownWiggle = useSharedValue(0);

  useEffect(() => {
    crownWiggle.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 300 }),
        withTiming(5, { duration: 300 })
      ),
      -1,
      true
    );
  }, []);

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownWiggle.value}deg` }],
  }));

  return (
    <Bubble
      type="crownHolder"
      side="left"
      onPress={onPress}
      glowColor={GAME_COLORS.reward.gold}
      isActive={true}
      delay={100}
    >
      <View style={styles.crownHolderContent}>
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={data.profile.avatar_url}
            name={data.profile.display_name}
            size="small"
          />
          <Animated.View style={[styles.crownIcon, crownAnimatedStyle]}>
            <Ionicons name="ribbon" size={14} color={GAME_COLORS.reward.gold} />
          </Animated.View>
        </View>
      </View>
    </Bubble>
  );
}

// Wild Cards Bubble
interface WildCardsBubbleProps {
  count: number;
  onPress?: () => void;
}

function WildCardsBubble({ count, onPress }: WildCardsBubbleProps) {
  return (
    <Bubble
      type="wildCards"
      side="left"
      onPress={onPress}
      glowColor={HOME_COLORS.accent}
      isActive={count > 0}
      delay={200}
    >
      <View style={styles.wildCardContent}>
        <Ionicons name="sparkles" size={18} color={HOME_COLORS.accent} />
        <Text style={styles.wildCardCount}>{count}</Text>
      </View>
    </Bubble>
  );
}

// Targeted Bubble
interface TargetedBubbleProps {
  onPress?: () => void;
}

function TargetedBubble({ onPress }: TargetedBubbleProps) {
  const targetPulse = useSharedValue(1);

  useEffect(() => {
    targetPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const targetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: targetPulse.value }],
  }));

  return (
    <Bubble
      type="targeted"
      side="right"
      onPress={onPress}
      glowColor={GAME_COLORS.primary.coral}
      isActive={true}
      delay={100}
    >
      <View style={styles.targetedContent}>
        <Animated.View style={targetAnimatedStyle}>
          <Ionicons name="locate" size={22} color={GAME_COLORS.primary.coral} />
        </Animated.View>
      </View>
    </Bubble>
  );
}

// Active Power Bubble
interface ActivePowerBubbleProps {
  data: ActivePowerData;
  onPress?: () => void;
}

const POWER_ICONS: Record<PowerType, keyof typeof Ionicons.glyphMap> = {
  double_chance: 'copy-outline',
  target_lock: 'locate-outline',
  chaos_card: 'shuffle-outline',
  streak_shield: 'shield-outline',
};

const POWER_COLORS: Record<PowerType, string> = {
  double_chance: HOME_COLORS.primary,
  target_lock: GAME_COLORS.primary.coral,
  chaos_card: HOME_COLORS.accent,
  streak_shield: GAME_COLORS.energy.cyan,
};

function ActivePowerBubble({ data, onPress }: ActivePowerBubbleProps) {
  const icon = POWER_ICONS[data.type];
  const color = POWER_COLORS[data.type];

  return (
    <Bubble
      type="power"
      side="right"
      onPress={onPress}
      glowColor={color}
      isActive={true}
      delay={200}
    >
      <View style={styles.powerContent}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
    </Bubble>
  );
}

export function SideBubbles({
  crownHolder,
  wildCardCount = 0,
  isTargeted = false,
  activePower,
  onBubblePress,
}: SideBubblesProps) {
  // Check if we have any bubbles to show
  const hasLeftBubbles = crownHolder || wildCardCount > 0;
  const hasRightBubbles = isTargeted || activePower;

  if (!hasLeftBubbles && !hasRightBubbles) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Left Side Bubbles */}
      <View style={styles.leftColumn} pointerEvents="box-none">
        {crownHolder && (
          <CrownHolderBubble
            data={crownHolder}
            onPress={() => onBubblePress?.('crownHolder')}
          />
        )}
        {wildCardCount > 0 && (
          <WildCardsBubble
            count={wildCardCount}
            onPress={() => onBubblePress?.('wildCards')}
          />
        )}
      </View>

      {/* Right Side Bubbles */}
      <View style={styles.rightColumn} pointerEvents="box-none">
        {isTargeted && (
          <TargetedBubble
            onPress={() => onBubblePress?.('targeted')}
          />
        )}
        {activePower && (
          <ActivePowerBubble
            data={activePower}
            onPress={() => onBubblePress?.('power')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.35, // Position below the main arena card
    zIndex: 100,
  },
  leftColumn: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  bubble: {
    marginHorizontal: spacing.xs,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleInner: {
    borderRadius: borderRadius.lg,
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
  bubbleGradient: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownHolderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  crownIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: HOME_COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GAME_COLORS.reward.gold,
  },
  wildCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wildCardCount: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: HOME_COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  targetedContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SideBubbles;

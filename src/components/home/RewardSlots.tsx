/**
 * RewardSlots.tsx
 * Clash Royale-style chest slots with 4 horizontal reward slots
 * Features: empty, locked/unlocking, ready states with proper animations
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
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { clashRoyaleTheme } from '../../theme/clashRoyaleTheme';
import { GameHaptics } from '../../utils/haptics';

const theme = clashRoyaleTheme;

// Chest colors based on rarity
const CHEST_COLORS = {
  common: {
    body: '#8B4513', // Brown
    accent: '#DAA520', // Gold accent
    lock: '#5D4037',
    gem: '#9E9E9E',
  },
  rare: {
    body: '#8B4513',
    accent: '#FFD700',
    lock: '#5D4037',
    gem: '#FF9800',
  },
  epic: {
    body: '#4A148C',
    accent: '#E040FB',
    lock: '#7B1FA2',
    gem: '#E040FB',
  },
  legendary: {
    body: '#FFD700',
    accent: '#FFF176',
    lock: '#DAA520',
    gem: '#E91E63',
  },
};

export type RewardSlotStatus = 'empty' | 'locked' | 'ready' | 'opening';

export interface RewardSlot {
  id: string;
  status: RewardSlotStatus;
  /** Time remaining to unlock in ms (for locked slots) */
  unlockTime?: number;
  /** Type of reward (for display purposes) */
  rewardType?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface RewardSlotsProps {
  /** Array of 4 reward slots */
  slots: RewardSlot[];
  /** Called when a slot is tapped to claim reward */
  onClaimReward?: (slotId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RewardSlotCardProps {
  slot: RewardSlot;
  index: number;
  onClaim?: (slotId: string) => void;
}

function ChestIcon({
  rarity,
  size = 40,
  isReady = false,
}: {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  size?: number;
  isReady?: boolean;
}) {
  const colors = CHEST_COLORS[rarity];

  return (
    <View style={[chestStyles.container, { width: size, height: size * 0.9 }]}>
      {/* Chest body */}
      <View style={[
        chestStyles.body,
        {
          backgroundColor: colors.body,
          borderColor: colors.accent,
          width: size,
          height: size * 0.65,
        }
      ]}>
        {/* Chest lid */}
        <View style={[
          chestStyles.lid,
          {
            backgroundColor: colors.body,
            borderColor: colors.accent,
            width: size * 0.9,
            height: size * 0.35,
          }
        ]} />

        {/* Gold band/latch */}
        <View style={[
          chestStyles.latch,
          {
            backgroundColor: colors.accent,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: size * 0.125,
          }
        ]}>
          {/* Gem decoration for epic/legendary */}
          {(rarity === 'epic' || rarity === 'legendary') && (
            <View style={[
              chestStyles.gem,
              {
                backgroundColor: colors.gem,
                width: size * 0.12,
                height: size * 0.12,
              }
            ]} />
          )}
        </View>

        {/* Side decorations */}
        <View style={[chestStyles.sideDecor, chestStyles.leftDecor, { backgroundColor: colors.accent }]} />
        <View style={[chestStyles.sideDecor, chestStyles.rightDecor, { backgroundColor: colors.accent }]} />
      </View>

      {/* Glow effect for ready chests */}
      {isReady && (
        <View style={[
          chestStyles.glow,
          {
            shadowColor: rarity === 'legendary' ? '#FFD700' : rarity === 'epic' ? '#E040FB' : '#FFD700',
          }
        ]} />
      )}
    </View>
  );
}

const chestStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  body: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lid: {
    position: 'absolute',
    top: -8,
    borderWidth: 2,
    borderRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  latch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  gem: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  sideDecor: {
    position: 'absolute',
    width: 3,
    height: '60%',
    borderRadius: 1,
  },
  leftDecor: {
    left: 4,
  },
  rightDecor: {
    right: 4,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
});

function RewardSlotCard({ slot, index, onClaim }: RewardSlotCardProps) {
  // Animation values
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const wobble = useSharedValue(0);

  // Setup animations based on status
  useEffect(() => {
    if (slot.status === 'ready') {
      // Ready to claim - bounce, glow, and wobble animation
      bounce.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      wobble.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          withTiming(-2, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500 }) // Pause
        ),
        -1,
        false
      );

      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else if (slot.status === 'locked') {
      // Locked - subtle pulse to indicate progress
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Reset animations for empty/opening states
      bounce.value = 0;
      glowOpacity.value = 0;
      wobble.value = 0;
      shimmer.value = 0;
    }
  }, [slot.status]);

  const handlePress = () => {
    if (slot.status !== 'ready') return;

    scale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withSpring(1.1, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    GameHaptics.action();
    onClaim?.(slot.id);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: bounce.value },
      { rotate: `${wobble.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Format unlock time
  const formatUnlockTime = (): string | null => {
    if (slot.status !== 'locked' || !slot.unlockTime) return null;

    const totalSeconds = Math.floor(slot.unlockTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return '<1m';
  };

  const unlockTimeText = formatUnlockTime();
  const rewardType = slot.rewardType || 'common';

  // Render empty slot
  if (slot.status === 'empty') {
    return (
      <View style={styles.slotWrapper}>
        <View style={styles.emptySlot}>
          <View style={styles.emptySlotInner}>
            <Ionicons
              name="lock-closed"
              size={24}
              color={theme.colors.cardBorder}
            />
          </View>
        </View>
      </View>
    );
  }

  // Render locked/unlocking slot
  if (slot.status === 'locked') {
    return (
      <View style={styles.slotWrapper}>
        <View style={styles.slotCard}>
          <LinearGradient
            colors={[theme.colors.cardLight, theme.colors.cardMedium]}
            style={styles.slotCardGradient}
          >
            {/* Chest icon */}
            <View style={styles.chestContainer}>
              <ChestIcon rarity={rewardType} size={36} />

              {/* Lock overlay */}
              <View style={styles.lockOverlay}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.textOnLight}
                />
              </View>
            </View>

            {/* Timer */}
            {unlockTimeText && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{unlockTimeText}</Text>
              </View>
            )}

            {/* Subtle glow animation */}
            <Animated.View
              style={[
                styles.lockedGlow,
                { backgroundColor: theme.colors.buttonBlue },
                glowAnimatedStyle,
              ]}
            />
          </LinearGradient>
        </View>
      </View>
    );
  }

  // Render ready slot
  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.slotWrapper, containerAnimatedStyle]}
    >
      <View style={styles.slotCard}>
        {/* Glow effect behind card */}
        <Animated.View
          style={[
            styles.readyGlow,
            {
              shadowColor: rewardType === 'legendary'
                ? theme.colors.gold
                : rewardType === 'epic'
                  ? theme.colors.purple
                  : theme.colors.gold,
            },
            glowAnimatedStyle,
          ]}
        />

        <LinearGradient
          colors={[theme.colors.cardLight, theme.colors.cardMedium]}
          style={styles.slotCardGradient}
        >
          {/* Chest icon with glow */}
          <View style={styles.chestContainer}>
            <ChestIcon rarity={rewardType} size={36} isReady />
          </View>

          {/* Open button */}
          <View style={styles.openButtonContainer}>
            <LinearGradient
              colors={[theme.colors.buttonGreen, theme.colors.buttonGreenDark]}
              style={styles.openButton}
            >
              <Text style={styles.openButtonText}>OPEN</Text>
            </LinearGradient>
          </View>

          {/* Sparkle effects */}
          <Animated.View style={[styles.sparkle, styles.sparkle1, glowAnimatedStyle]} />
          <Animated.View style={[styles.sparkle, styles.sparkle2, glowAnimatedStyle]} />
          <Animated.View style={[styles.sparkle, styles.sparkle3, glowAnimatedStyle]} />
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

export function RewardSlots({ slots, onClaimReward }: RewardSlotsProps) {
  // Ensure we always have 4 slots
  const normalizedSlots: RewardSlot[] = [
    slots[0] || { id: '1', status: 'empty' },
    slots[1] || { id: '2', status: 'empty' },
    slots[2] || { id: '3', status: 'empty' },
    slots[3] || { id: '4', status: 'empty' },
  ];

  return (
    <View style={styles.container}>
      {/* Slots Row */}
      <View style={styles.slotsRow}>
        {normalizedSlots.map((slot, index) => (
          <RewardSlotCard
            key={slot.id}
            slot={slot}
            index={index}
            onClaim={onClaimReward}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  slotWrapper: {
    flex: 1,
    maxWidth: 80,
  },

  // Empty slot styles
  emptySlot: {
    height: 100,
    borderRadius: theme.borderRadius.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.cardBorder,
    backgroundColor: 'rgba(168, 192, 216, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 172, 200, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Slot card styles (for locked and ready states)
  slotCard: {
    height: 100,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  slotCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },

  // Chest container
  chestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timer styles
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  timerText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.textOnLight,
    ...theme.shadows.text,
  },

  // Open button styles
  openButtonContainer: {
    marginTop: theme.spacing.xs,
  },
  openButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.button,
    borderWidth: 2,
    borderTopWidth: 1,
    borderBottomWidth: 3,
    borderColor: theme.colors.buttonGreenBorder,
    borderBottomColor: theme.colors.buttonGreenDark,
  },
  openButtonText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.extrabold,
    color: theme.colors.textOnDark,
    letterSpacing: 1,
    ...theme.shadows.text,
  },

  // Glow effects
  lockedGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.card,
  },
  readyGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.card + 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },

  // Sparkle effects
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  sparkle1: {
    top: 8,
    right: 12,
  },
  sparkle2: {
    top: 20,
    left: 8,
  },
  sparkle3: {
    bottom: 16,
    right: 8,
  },
});

export default RewardSlots;

/**
 * RewardSlot.tsx
 * A single chest-like reward slot with multiple states
 * States: empty, filling (progress bar), unlocking (countdown), ready (glowing)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import {
  RewardSlot as RewardSlotType,
  RewardSlotState,
  SlotRarity,
  SLOT_RARITY_CONFIG,
  getUnlockTimeRemaining,
  formatUnlockTime,
  getRewardIcon,
  isSlotReadyToClaim,
} from '../../types/rewardSlots';

export interface RewardSlotProps {
  /** Slot data */
  slot: RewardSlotType;
  /** Callback when slot is tapped */
  onPress?: (slot: RewardSlotType) => void;
  /** Whether the slot is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { width: 70, height: 85, iconSize: 28, fontSize: typography.sizeXs },
  medium: { width: 90, height: 110, iconSize: 36, fontSize: typography.sizeSm },
  large: { width: 110, height: 135, iconSize: 44, fontSize: typography.sizeMd },
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function RewardSlot({
  slot,
  onPress,
  disabled = false,
  size = 'medium',
}: RewardSlotProps) {
  const { t } = useTranslation();
  const sizeConfig = SIZES[size];
  const rarityConfig = SLOT_RARITY_CONFIG[slot.rarity];

  // Check if ready to claim (handles unlocking state with expired timer)
  const isReady = isSlotReadyToClaim(slot);
  const effectiveState: RewardSlotState = isReady && slot.state === 'unlocking' ? 'ready' : slot.state;

  // Time remaining for unlocking state
  const [timeRemaining, setTimeRemaining] = useState(getUnlockTimeRemaining(slot));

  // Animation values
  const glowIntensity = useSharedValue(0.5);
  const chestBounce = useSharedValue(1);
  const progressWidth = useSharedValue(slot.progress);
  const shakeRotation = useSharedValue(0);

  // Update countdown timer
  useEffect(() => {
    if (slot.state !== 'unlocking') return;

    const interval = setInterval(() => {
      const remaining = getUnlockTimeRemaining(slot);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [slot.state, slot.unlocks_at]);

  // Glow animation for ready state
  useEffect(() => {
    if (effectiveState === 'ready') {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Chest bounce
      chestBounce.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Shake animation
      shakeRotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 100 }),
          withTiming(3, { duration: 100 }),
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );
    } else {
      glowIntensity.value = withTiming(0.5, { duration: 300 });
      chestBounce.value = withTiming(1, { duration: 300 });
      shakeRotation.value = withTiming(0, { duration: 300 });
    }
  }, [effectiveState]);

  // Progress animation
  useEffect(() => {
    progressWidth.value = withTiming(slot.progress, { duration: 500 });
  }, [slot.progress]);

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowIntensity.value, [0.4, 1], [5, 20]);
    const shadowOpacity = interpolate(glowIntensity.value, [0.4, 1], [0.3, 0.8]);

    return {
      shadowColor: rarityConfig.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: effectiveState === 'ready' ? shadowOpacity : 0.3,
      shadowRadius: effectiveState === 'ready' ? shadowRadius : 5,
      elevation: effectiveState === 'ready' ? Math.round(shadowRadius / 2) : 3,
    };
  });

  const chestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestBounce.value },
      { rotate: `${shakeRotation.value}deg` },
    ],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Get chest icon based on state
  const getChestIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (effectiveState) {
      case 'empty':
        return 'cube-outline';
      case 'filling':
        return 'cube';
      case 'unlocking':
        return 'lock-closed';
      case 'ready':
        return 'gift';
      case 'claimed':
        return 'checkmark-circle';
      default:
        return 'cube-outline';
    }
  };

  // Get state-specific background
  const getBackgroundColors = (): [string, string] => {
    switch (effectiveState) {
      case 'empty':
        return [colors.backgroundCard, colors.backgroundElevated];
      case 'filling':
        return [colors.backgroundCard, rarityConfig.gradient[0] + '30'];
      case 'unlocking':
        return [colors.backgroundCard, rarityConfig.gradient[0] + '20'];
      case 'ready':
        return rarityConfig.gradient;
      case 'claimed':
        return [colors.backgroundCard, colors.backgroundCard];
      default:
        return [colors.backgroundCard, colors.backgroundElevated];
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress(slot);
    }
  };

  const iconColor = effectiveState === 'ready' ? '#FFFFFF' : rarityConfig.color;
  const isInteractive = !disabled && (effectiveState === 'ready' || effectiveState === 'unlocking');

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.container,
        { width: sizeConfig.width, height: sizeConfig.height },
        glowAnimatedStyle,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || effectiveState === 'empty'}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getBackgroundColors()}
        style={[styles.background, { borderRadius: borderRadius.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Rarity border */}
      <View
        style={[
          styles.rarityBorder,
          {
            borderColor: effectiveState === 'empty' ? colors.border : rarityConfig.color,
            borderWidth: effectiveState === 'ready' ? 2 : 1,
          },
        ]}
      />

      {/* Chest Icon */}
      <Animated.View style={[styles.chestContainer, chestAnimatedStyle]}>
        <Ionicons
          name={getChestIcon()}
          size={sizeConfig.iconSize}
          color={iconColor}
        />

        {/* Ready glow effect */}
        {effectiveState === 'ready' && (
          <View style={[styles.readyGlow, { backgroundColor: rarityConfig.glowColor }]} />
        )}
      </Animated.View>

      {/* State-specific content */}
      {effectiveState === 'empty' && (
        <Text style={[styles.stateText, { fontSize: sizeConfig.fontSize }]}>
          {t('rewards.slot.empty', 'Empty')}
        </Text>
      )}

      {effectiveState === 'filling' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: rarityConfig.color },
                progressAnimatedStyle,
              ]}
            />
          </View>
          <Text style={[styles.progressText, { fontSize: sizeConfig.fontSize - 2 }]}>
            {Math.round(slot.progress)}%
          </Text>
        </View>
      )}

      {effectiveState === 'unlocking' && (
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={12} color={rarityConfig.color} />
          <Text style={[styles.timerText, { fontSize: sizeConfig.fontSize, color: rarityConfig.color }]}>
            {formatUnlockTime(timeRemaining)}
          </Text>
        </View>
      )}

      {effectiveState === 'ready' && (
        <View style={styles.readyContainer}>
          <Text style={[styles.readyText, { fontSize: sizeConfig.fontSize }]}>
            {t('rewards.slot.tap', 'Tap!')}
          </Text>
        </View>
      )}

      {effectiveState === 'claimed' && (
        <Text style={[styles.claimedText, { fontSize: sizeConfig.fontSize }]}>
          {t('rewards.slot.claimed', 'Claimed')}
        </Text>
      )}

      {/* Rarity Label */}
      <View style={[styles.rarityLabel, { backgroundColor: rarityConfig.color + '30' }]}>
        <Text style={[styles.rarityText, { color: rarityConfig.color, fontSize: typography.sizeXs }]}>
          {t(rarityConfig.nameKey, slot.rarity)}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  rarityBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  chestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  readyGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Platform.select({
      web: {
        filter: 'blur(15px)',
      } as any,
      default: {
        opacity: 0.5,
      },
    }),
  },
  stateText: {
    color: colors.textMuted,
    fontWeight: typography.weightMedium,
    marginTop: spacing.xs,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    width: '80%',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  timerText: {
    fontWeight: typography.weightBold,
    fontVariant: ['tabular-nums'],
  },
  readyContainer: {
    marginTop: spacing.xs,
  },
  readyText: {
    color: '#FFFFFF',
    fontWeight: typography.weightBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  claimedText: {
    color: colors.textMuted,
    fontWeight: typography.weightMedium,
    marginTop: spacing.xs,
  },
  rarityLabel: {
    position: 'absolute',
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontWeight: typography.weightSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default RewardSlot;

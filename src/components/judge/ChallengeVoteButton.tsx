/**
 * ChallengeVoteButton.tsx
 * Individual vote button for judge decision challenges
 * Features upvote/downvote styling with haptic feedback
 */

import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GameHaptics } from '../../utils/haptics';

// Battle Game UI Colors
const COLORS = {
  LIME: '#A3E635',
  CYAN: '#00D4FF',
  PURPLE: '#9B59FF',
  RED: '#EF4444',
  ORANGE: '#F97316',
  DARK_BG: '#0A0E27',
  CARD_BG: '#16213E',
  DISABLED: '#374151',
  TEXT_MUTED: '#6B7280',
};

export interface ChallengeVoteButtonProps {
  /** Vote type: 'for' (support challenge) or 'against' (reject challenge) */
  type: 'for' | 'against';
  /** Current vote count */
  count: number;
  /** Whether the user has already voted */
  hasVoted?: boolean;
  /** Whether this specific option was selected by the user */
  isSelected?: boolean;
  /** Whether voting is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when button is pressed */
  onPress?: () => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show label text */
  showLabel?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ChallengeVoteButton({
  type,
  count,
  hasVoted = false,
  isSelected = false,
  disabled = false,
  loading = false,
  onPress,
  size = 'medium',
  showLabel = true,
}: ChallengeVoteButtonProps) {
  // Animation values
  const scale = useSharedValue(1);
  const countScale = useSharedValue(1);
  const glowIntensity = useSharedValue(isSelected ? 1 : 0);
  const prevCount = useSharedValue(count);

  const isFor = type === 'for';
  const isDisabled = disabled || hasVoted || loading;

  // Colors based on type and state
  const activeColor = isFor ? COLORS.LIME : COLORS.RED;
  const iconName = isFor ? 'thumbs-up' : 'thumbs-down';
  const label = isFor ? 'Support' : 'Reject';

  // Size configurations
  const sizeConfig = {
    small: { button: 44, icon: 18, font: 12, count: 14 },
    medium: { button: 56, icon: 24, font: 14, count: 16 },
    large: { button: 72, icon: 32, font: 16, count: 20 },
  };
  const config = sizeConfig[size];

  useEffect(() => {
    // Animate glow when selected state changes
    glowIntensity.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected]);

  useEffect(() => {
    // Animate count when it changes
    if (count !== prevCount.value) {
      countScale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 8 })
      );
      prevCount.value = count;
    }
  }, [count]);

  const handlePress = () => {
    if (isDisabled) return;

    // Trigger haptic feedback
    GameHaptics.action();

    // Button press animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    onPress?.();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowIntensity.value, [0, 1], [0, 15]);
    const shadowOpacity = interpolate(glowIntensity.value, [0, 1], [0, 0.6]);

    return {
      shadowColor: activeColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const gradientColors: [string, string] = isSelected
    ? isFor
      ? ['rgba(163, 230, 53, 0.3)', 'rgba(163, 230, 53, 0.1)']
      : ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']
    : ['transparent', 'transparent'];

  const borderColor = isSelected
    ? activeColor
    : isDisabled
    ? COLORS.DISABLED
    : COLORS.TEXT_MUTED;

  const iconColor = isSelected
    ? activeColor
    : isDisabled
    ? COLORS.DISABLED
    : '#FFFFFF';

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.touchable, buttonStyle]}
    >
      <Animated.View style={[styles.container, glowStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.buttonContainer,
            {
              width: config.button,
              height: config.button,
              borderRadius: config.button / 2,
              borderColor,
            },
            isDisabled && styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <View style={styles.loadingDot} />
          ) : (
            <Ionicons
              name={iconName}
              size={config.icon}
              color={iconColor}
            />
          )}
        </LinearGradient>

        {/* Vote count */}
        <Animated.View style={countStyle}>
          <Text
            style={[
              styles.countText,
              { fontSize: config.count, color: isSelected ? activeColor : '#FFFFFF' },
            ]}
          >
            {count}
          </Text>
        </Animated.View>

        {/* Label */}
        {showLabel && (
          <Text
            style={[
              styles.labelText,
              { fontSize: config.font, color: isSelected ? activeColor : COLORS.TEXT_MUTED },
            ]}
          >
            {label}
          </Text>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: activeColor }]}>
            <Ionicons name="checkmark" size={10} color={COLORS.DARK_BG} />
          </View>
        )}
      </Animated.View>
    </AnimatedTouchable>
  );
}

/**
 * ChallengeVoteButtons - Pair of vote buttons for challenge voting
 */
export interface ChallengeVoteButtonsProps {
  /** Votes for the challenge */
  forCount: number;
  /** Votes against the challenge */
  againstCount: number;
  /** User's current vote */
  userVote?: 'for' | 'against' | null;
  /** Whether voting is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when for is pressed */
  onVoteFor?: () => void;
  /** Callback when against is pressed */
  onVoteAgainst?: () => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

export function ChallengeVoteButtons({
  forCount,
  againstCount,
  userVote = null,
  disabled = false,
  loading = false,
  onVoteFor,
  onVoteAgainst,
  size = 'medium',
}: ChallengeVoteButtonsProps) {
  return (
    <View style={styles.buttonsRow}>
      <ChallengeVoteButton
        type="for"
        count={forCount}
        hasVoted={userVote !== null}
        isSelected={userVote === 'for'}
        disabled={disabled}
        loading={loading && userVote === null}
        onPress={onVoteFor}
        size={size}
      />
      <ChallengeVoteButton
        type="against"
        count={againstCount}
        hasVoted={userVote !== null}
        isSelected={userVote === 'against'}
        disabled={disabled}
        loading={loading && userVote === null}
        onPress={onVoteAgainst}
        size={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  touchable: {},
  container: {
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: COLORS.CARD_BG,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  countText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  labelText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.DARK_BG,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.TEXT_MUTED,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
});

export default ChallengeVoteButton;

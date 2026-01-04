/**
 * AbilityCard - Special Ability/Cheat Display Card
 * Shows special abilities with equip toggle and status indicator
 *
 * Design: Dark theme card with toggle button, lime green active states
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameHaptics } from '../../utils/haptics';

// Ability Card Colors - Battle Game UI inspired
const ABILITY_COLORS = {
  background: '#0A0E27',
  cardBackground: '#1A1A2E',
  cardGradientStart: '#1A1A2E',
  cardGradientEnd: '#252542',
  lime: '#A3E635',
  limeDark: '#65A30D',
  limeGlow: 'rgba(163, 230, 53, 0.4)',
  purple: '#9B59FF',
  purpleGlow: 'rgba(155, 89, 255, 0.4)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  toggleOff: '#3F3F46',
  toggleTrackOff: '#27272A',
};

export type AbilityStatus = 'available' | 'equipped' | 'locked' | 'cooldown';

export interface AbilityCardProps {
  /** Unique identifier for the ability */
  id: string;
  /** Ability title */
  title: string;
  /** Ability description */
  description: string;
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Current status of the ability */
  status: AbilityStatus;
  /** Cooldown time remaining in seconds (optional, used when status is 'cooldown') */
  cooldownRemaining?: number;
  /** Whether to show toggle or button */
  variant?: 'toggle' | 'button';
  /** Optional custom accent color */
  accentColor?: string;
  /** Callback when equip/toggle is pressed */
  onToggle?: (equipped: boolean) => void;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Optional custom style */
  style?: ViewStyle;
  /** Rarity level for visual treatment */
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const RARITY_COLORS = {
  common: { primary: '#71717A', gradient: ['#3F3F46', '#27272A'] },
  rare: { primary: '#3B82F6', gradient: ['#2563EB', '#1D4ED8'] },
  epic: { primary: '#9B59FF', gradient: ['#8B5CF6', '#7C3AED'] },
  legendary: { primary: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AbilityCard({
  id,
  title,
  description,
  icon,
  status,
  cooldownRemaining,
  variant = 'toggle',
  accentColor,
  onToggle,
  onPress,
  style,
  rarity = 'common',
}: AbilityCardProps) {
  const scale = useSharedValue(1);
  const togglePosition = useSharedValue(status === 'equipped' ? 1 : 0);
  const iconRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  const isEquipped = status === 'equipped';
  const isLocked = status === 'locked';
  const isCooldown = status === 'cooldown';
  const isDisabled = isLocked || isCooldown;

  const rarityConfig = RARITY_COLORS[rarity];
  const activeColor = accentColor || (rarity === 'common' ? ABILITY_COLORS.lime : rarityConfig.primary);

  // Update toggle position when status changes
  useEffect(() => {
    togglePosition.value = withSpring(isEquipped ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [isEquipped]);

  // Glow effect for equipped items
  useEffect(() => {
    if (isEquipped) {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowIntensity.value = withTiming(0, { duration: 300 });
    }
  }, [isEquipped]);

  // Button pulse for available state
  useEffect(() => {
    if (status === 'available' && variant === 'button') {
      buttonPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      buttonPulse.value = 1;
    }
  }, [status, variant]);

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withTiming(0.97, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      scale.value = withSequence(
        withSpring(1.02, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
  };

  const handlePress = () => {
    if (isDisabled) return;
    GameHaptics.buttonPress();
    onPress?.();
  };

  const handleToggle = () => {
    if (isDisabled) return;

    const newEquipped = !isEquipped;
    GameHaptics.action();

    // Animate icon
    iconRotation.value = withSequence(
      withSpring(-10, { damping: 5 }),
      withSpring(10, { damping: 5 }),
      withSpring(0, { damping: 10 })
    );

    onToggle?.(newEquipped);
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedToggleThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(togglePosition.value, [0, 1], [2, 24]) }],
    backgroundColor: interpolateColor(
      togglePosition.value,
      [0, 1],
      [ABILITY_COLORS.toggleOff, activeColor]
    ),
  }));

  const animatedToggleTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      togglePosition.value,
      [0, 1],
      [ABILITY_COLORS.toggleTrackOff, activeColor + '40']
    ),
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  // Platform-specific glow style for card
  const cardGlowStyle = Platform.select({
    web: {
      boxShadow: isEquipped
        ? `0 4px 24px ${activeColor}40`
        : 'none',
    } as ViewStyle,
    default: isEquipped
      ? {
          shadowColor: activeColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
        }
      : {},
  });

  const getStatusLabel = (): string => {
    switch (status) {
      case 'equipped':
        return 'Equipped';
      case 'locked':
        return 'Locked';
      case 'cooldown':
        return cooldownRemaining ? `${cooldownRemaining}s` : 'Cooldown';
      default:
        return 'Available';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'equipped':
        return activeColor;
      case 'locked':
        return ABILITY_COLORS.textMuted;
      case 'cooldown':
        return '#F59E0B';
      default:
        return ABILITY_COLORS.textSecondary;
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress && !onToggle}
      style={[animatedCardStyle, style]}
    >
      <LinearGradient
        colors={[ABILITY_COLORS.cardGradientStart, ABILITY_COLORS.cardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          cardGlowStyle,
          isEquipped && { borderColor: activeColor + '60' },
          isDisabled && styles.cardDisabled,
        ]}
      >
        {/* Glow overlay for equipped state */}
        {isEquipped && (
          <Animated.View
            style={[
              styles.glowOverlay,
              { backgroundColor: activeColor },
              animatedGlowStyle,
            ]}
          />
        )}

        {/* Icon Container */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <LinearGradient
            colors={
              isEquipped
                ? [activeColor, activeColor + 'CC']
                : isDisabled
                ? ['#27272A', '#1A1A2E']
                : rarityConfig.gradient as [string, string]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBackground}
          >
            <Ionicons
              name={isLocked ? 'lock-closed' : icon}
              size={26}
              color={isDisabled ? ABILITY_COLORS.textMuted : '#FFFFFF'}
            />
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                isDisabled && styles.textDisabled,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              {status === 'equipped' && (
                <Ionicons name="checkmark" size={12} color={getStatusColor()} />
              )}
              {status === 'cooldown' && (
                <Ionicons name="time-outline" size={12} color={getStatusColor()} />
              )}
              {status === 'locked' && (
                <Ionicons name="lock-closed" size={12} color={getStatusColor()} />
              )}
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.description,
              isDisabled && styles.textDisabled,
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        {/* Toggle or Button */}
        {variant === 'toggle' ? (
          <Pressable
            onPress={handleToggle}
            disabled={isDisabled}
            style={styles.toggleContainer}
          >
            <Animated.View style={[styles.toggleTrack, animatedToggleTrackStyle]}>
              <Animated.View style={[styles.toggleThumb, animatedToggleThumbStyle]} />
            </Animated.View>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleToggle}
            disabled={isDisabled}
          >
            <Animated.View style={animatedButtonStyle}>
              <LinearGradient
                colors={
                  isDisabled
                    ? ['#27272A', '#1A1A2E']
                    : isEquipped
                    ? ['#3F3F46', '#27272A']
                    : [activeColor, activeColor + 'CC']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.equipButton,
                  isDisabled && styles.buttonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.equipButtonText,
                    isDisabled && styles.textDisabled,
                    isEquipped && { color: ABILITY_COLORS.textSecondary },
                  ]}
                >
                  {isEquipped ? 'Unequip' : 'Equip'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ABILITY_COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.7,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: ABILITY_COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: ABILITY_COLORS.textSecondary,
    lineHeight: 16,
  },
  textDisabled: {
    color: ABILITY_COLORS.textMuted,
  },
  toggleContainer: {
    padding: 4,
  },
  toggleTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  equipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  equipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default AbilityCard;

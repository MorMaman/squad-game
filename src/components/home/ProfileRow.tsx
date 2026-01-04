/**
 * ProfileRow.tsx
 * User profile row showing avatar, username, squad name, streak, and menu
 * Features tap interactions for avatar and menu
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar';
import { GAME_COLORS, GAME_SPRINGS, GAME_DURATIONS } from '../../theme/gameColors';
import { typography, spacing, borderRadius, colors } from '../../theme/colors';
import { GameHaptics } from '../../utils/haptics';
import type { Profile } from '../../types';

// Home screen colors
const HOME_COLORS = {
  background: '#0A0E27',
  card: '#1A1A2E',
  primary: '#FF6B00',
  secondary: '#3B82F6',
  accent: '#9B59FF',
};

export interface ProfileRowProps {
  /** User profile data */
  profile: Profile;
  /** Name of the squad */
  squadName: string;
  /** Current streak days */
  streak: number;
  /** Called when user taps their profile/avatar */
  onProfilePress?: () => void;
  /** Called when user taps the hamburger menu */
  onMenuPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProfileRow({
  profile,
  squadName,
  streak,
  onProfilePress,
  onMenuPress,
}: ProfileRowProps) {
  // Animation values
  const avatarScale = useSharedValue(1);
  const menuScale = useSharedValue(1);
  const streakPulse = useSharedValue(0);
  const flameRotation = useSharedValue(0);

  // Flame animation for streak
  useEffect(() => {
    if (streak > 0) {
      // Pulse effect for streak badge
      streakPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Flame wobble
      flameRotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [streak]);

  const handleAvatarPress = () => {
    avatarScale.value = withSequence(
      withTiming(0.9, { duration: GAME_DURATIONS.fast }),
      withSpring(1, GAME_SPRINGS.bouncy)
    );
    GameHaptics.buttonPress();
    onProfilePress?.();
  };

  const handleMenuPress = () => {
    menuScale.value = withSequence(
      withTiming(0.85, { duration: GAME_DURATIONS.fast }),
      withSpring(1, GAME_SPRINGS.bouncy)
    );
    GameHaptics.buttonPress();
    onMenuPress?.();
  };

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(streakPulse.value, [0, 1], [1, 1.05]);
    const glowOpacity = interpolate(streakPulse.value, [0, 1], [0.4, 0.8]);

    return {
      transform: [{ scale }],
      shadowOpacity: glowOpacity,
    };
  });

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flameRotation.value}deg` }],
  }));

  // Determine streak color based on days
  const getStreakColor = (): string => {
    if (streak >= 100) return GAME_COLORS.reward.gold;
    if (streak >= 30) return GAME_COLORS.primary.coral;
    if (streak >= 7) return GAME_COLORS.primary.orange;
    return HOME_COLORS.primary;
  };

  const streakColor = getStreakColor();

  return (
    <View style={styles.container}>
      {/* Avatar Section - Left */}
      <AnimatedPressable
        onPress={handleAvatarPress}
        style={[styles.avatarContainer, avatarAnimatedStyle]}
      >
        <View style={styles.avatarBorder}>
          <Avatar
            uri={profile.avatar_url}
            name={profile.display_name}
            size="large"
          />
        </View>
        {/* Online indicator */}
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineIndicatorInner} />
        </View>
      </AnimatedPressable>

      {/* User Info Section - Center */}
      <View style={styles.infoSection}>
        <Text style={styles.username} numberOfLines={1}>
          {profile.display_name}
        </Text>
        <Text style={styles.squadName} numberOfLines={1}>
          @{squadName}
        </Text>
      </View>

      {/* Right Section - Streak and Menu */}
      <View style={styles.rightSection}>
        {/* Streak Badge */}
        {streak > 0 && (
          <Animated.View
            style={[
              styles.streakBadge,
              {
                shadowColor: streakColor,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 8,
              },
              streakAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={[HOME_COLORS.card, '#252542']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakBadgeInner}
            >
              <Animated.View style={flameAnimatedStyle}>
                <Ionicons name="flame" size={18} color={streakColor} />
              </Animated.View>
              <Text style={[styles.streakText, { color: streakColor }]}>
                {streak}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Menu Button */}
        <AnimatedPressable
          onPress={handleMenuPress}
          style={[styles.menuButton, menuAnimatedStyle]}
        >
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    borderRadius: 36,
    borderWidth: 2,
    borderColor: HOME_COLORS.accent,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: HOME_COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: HOME_COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicatorInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GAME_COLORS.energy.green,
  },
  infoSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  squadName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakBadge: {
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  streakBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  streakText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    fontVariant: ['tabular-nums'],
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default ProfileRow;

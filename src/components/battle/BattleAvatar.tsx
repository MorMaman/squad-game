/**
 * BattleAvatar.tsx
 * Character avatar with animated frame and glow effects for VS Battle screen
 * Supports entrance animations and team-specific colors
 */

import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { GAME_COLORS } from '../../theme/gameColors';

export interface BattleAvatarProps {
  /** Avatar image source */
  source: ImageSourcePropType;
  /** Player name */
  name: string;
  /** Player level */
  level: number;
  /** Position: left (player) or right (opponent) */
  position: 'left' | 'right';
  /** Glow color - lime green for player, red for opponent */
  glowColor?: string;
  /** Avatar size */
  size?: number;
  /** Delay before entrance animation starts (ms) */
  entranceDelay?: number;
  /** Whether to show level badge */
  showLevel?: boolean;
}

const AVATAR_SIZE = 140;
const BORDER_WIDTH = 4;

export function BattleAvatar({
  source,
  name,
  level,
  position,
  glowColor,
  size = AVATAR_SIZE,
  entranceDelay = 0,
  showLevel = true,
}: BattleAvatarProps) {
  // Default glow colors based on position
  const defaultGlowColor = position === 'left' ? '#A3E635' : '#EF4444';
  const finalGlowColor = glowColor || defaultGlowColor;

  // Animation values
  const translateX = useSharedValue(position === 'left' ? -200 : 200);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const borderRotation = useSharedValue(0);

  useEffect(() => {
    // Entrance animation with delay
    translateX.value = withDelay(
      entranceDelay,
      withSpring(0, {
        damping: 12,
        stiffness: 100,
      })
    );

    scale.value = withDelay(
      entranceDelay,
      withSpring(1, {
        damping: 10,
        stiffness: 150,
      })
    );

    opacity.value = withDelay(
      entranceDelay,
      withTiming(1, { duration: 300 })
    );

    // Start glow pulsing animation after entrance
    glowPulse.value = withDelay(
      entranceDelay + 500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Border rotation for dynamic effect
    borderRotation.value = withDelay(
      entranceDelay + 300,
      withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [entranceDelay]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [15, 35]);
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.5, 0.9]);

    return {
      shadowColor: finalGlowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(glowPulse.value, [0, 1], [0.7, 1]);

    return {
      opacity: borderOpacity,
      transform: [{ rotate: `${borderRotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Outer glow container */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        {/* Animated border ring */}
        <Animated.View
          style={[
            styles.borderRing,
            { width: size + BORDER_WIDTH * 2, height: size + BORDER_WIDTH * 2 },
            { borderColor: finalGlowColor },
            borderStyle,
          ]}
        />

        {/* Avatar image container */}
        <View
          style={[
            styles.avatarContainer,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Image
            source={source}
            style={[
              styles.avatar,
              { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 },
            ]}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Player name */}
      <Text
        style={[
          styles.playerName,
          position === 'right' && styles.playerNameRight,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Level badge */}
      {showLevel && (
        <View style={[styles.levelBadge, { backgroundColor: finalGlowColor }]}>
          <Text style={styles.levelText}>LV {level}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderRing: {
    position: 'absolute',
    borderWidth: BORDER_WIDTH,
    borderRadius: 9999,
    borderStyle: 'solid',
  },
  avatarContainer: {
    backgroundColor: GAME_COLORS.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: GAME_COLORS.background.medium,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 140,
  },
  playerNameRight: {
    textAlign: 'center',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0E27',
  },
});

export default BattleAvatar;

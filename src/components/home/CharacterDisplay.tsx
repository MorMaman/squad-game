/**
 * CharacterDisplay.tsx
 * Battle Game UI - Main character avatar display area
 * Large character display with animations and effects
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BATTLE_COLORS } from './BattleHeader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Avatar images mapping
const AVATAR_IMAGES = {
  1: require('../../../assets/images/avatars/avatar-battle-1.png'),
  2: require('../../../assets/images/avatars/avatar-battle-2.png'),
  3: require('../../../assets/images/avatars/avatar-battle-3.png'),
};

export interface CharacterDisplayProps {
  avatarId?: 1 | 2 | 3;
  customAvatarUri?: string | null;
  playerName: string;
  title?: string;
  rank?: number;
  onCharacterPress?: () => void;
  onEditPress?: () => void;
  showRankBadge?: boolean;
  animated?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Floating Particle Effect
 */
function FloatingParticle({
  delay,
  startX,
  color,
}: {
  delay: number;
  startX: number;
  color: string;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-120, { duration: 3000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.8, { duration: 2000 }),
          withTiming(0, { duration: 500 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 2000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value + Math.sin(translateY.value * 0.05) * 10 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <View style={[styles.particleInner, { backgroundColor: color }]} />
    </Animated.View>
  );
}

/**
 * Rank Badge Component
 */
function RankBadge({ rank }: { rank: number }) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(500, withSpring(1, { damping: 8, stiffness: 200 }));
    rotation.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500 }),
          withTiming(5, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const getRankColors = (): readonly [string, string] => {
    if (rank === 1) return ['#FFD700', '#FFA500'] as const;
    if (rank === 2) return ['#C0C0C0', '#A8A8A8'] as const;
    if (rank === 3) return ['#CD7F32', '#B87333'] as const;
    return [BATTLE_COLORS.backgroundCard, BATTLE_COLORS.backgroundLight] as const;
  };

  const getRankIcon = () => {
    if (rank === 1) return 'crown';
    if (rank <= 3) return 'medal';
    return 'trophy';
  };

  return (
    <Animated.View style={[styles.rankBadge, animatedStyle]}>
      <LinearGradient colors={getRankColors()} style={styles.rankBadgeGradient}>
        <MaterialCommunityIcons
          name={getRankIcon()}
          size={16}
          color={rank <= 3 ? '#1A1A2E' : BATTLE_COLORS.white}
        />
        <Text
          style={[
            styles.rankText,
            { color: rank <= 3 ? '#1A1A2E' : BATTLE_COLORS.white },
          ]}
        >
          #{rank}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * Pulsing Glow Ring
 */
function GlowRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.glowRing, animatedStyle]}>
      <LinearGradient
        colors={[`${BATTLE_COLORS.lime}00`, `${BATTLE_COLORS.lime}40`, `${BATTLE_COLORS.lime}00`] as const}
        style={styles.glowRingGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

/**
 * CharacterDisplay - Main component
 */
export function CharacterDisplay({
  avatarId = 1,
  customAvatarUri,
  playerName,
  title,
  rank,
  onCharacterPress,
  onEditPress,
  showRankBadge = true,
  animated = true,
}: CharacterDisplayProps) {
  const scale = useSharedValue(0.9);
  const floatY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });

    if (animated) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [animated]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onCharacterPress?.();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: floatY.value },
    ],
  }));

  const avatarSource = customAvatarUri
    ? { uri: customAvatarUri }
    : AVATAR_IMAGES[avatarId];

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      {animated && (
        <View style={styles.particlesContainer}>
          <FloatingParticle delay={0} startX={-40} color={BATTLE_COLORS.lime} />
          <FloatingParticle delay={500} startX={40} color={BATTLE_COLORS.cyan} />
          <FloatingParticle delay={1000} startX={-20} color={BATTLE_COLORS.purple} />
          <FloatingParticle delay={1500} startX={20} color={BATTLE_COLORS.lime} />
          <FloatingParticle delay={2000} startX={0} color={BATTLE_COLORS.gold} />
        </View>
      )}

      {/* Glow Ring */}
      {animated && <GlowRing />}

      {/* Main Character Display */}
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={1}
        style={[styles.characterContainer, containerStyle]}
      >
        {/* Avatar Border */}
        <View style={styles.avatarBorderOuter}>
          <LinearGradient
            colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark, BATTLE_COLORS.lime] as const}
            style={styles.avatarBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInner}>
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>
        </View>

        {/* Rank Badge */}
        {showRankBadge && rank && <RankBadge rank={rank} />}
      </AnimatedTouchable>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{playerName}</Text>
        {title && <Text style={styles.playerTitle}>{title}</Text>}
      </View>

      {/* Edit Button */}
      {onEditPress && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEditPress();
          }}
          style={styles.editButton}
        >
          <LinearGradient
            colors={[BATTLE_COLORS.backgroundCard, BATTLE_COLORS.backgroundLight] as const}
            style={styles.editButtonGradient}
          >
            <Ionicons name="pencil" size={16} color={BATTLE_COLORS.lime} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const AVATAR_SIZE = Math.min(SCREEN_WIDTH * 0.45, 180);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    position: 'relative',
  },

  // Particles
  particlesContainer: {
    position: 'absolute',
    width: AVATAR_SIZE + 80,
    height: AVATAR_SIZE + 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
  },
  particleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Glow Ring
  glowRing: {
    position: 'absolute',
    width: AVATAR_SIZE + 40,
    height: AVATAR_SIZE + 40,
    borderRadius: (AVATAR_SIZE + 40) / 2,
    ...Platform.select({
      ios: {
        shadowColor: BATTLE_COLORS.lime,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
    }),
  },
  glowRingGradient: {
    flex: 1,
    borderRadius: (AVATAR_SIZE + 40) / 2,
    borderWidth: 2,
    borderColor: `${BATTLE_COLORS.lime}30`,
  },

  // Character Container
  characterContainer: {
    position: 'relative',
  },

  // Avatar
  avatarBorderOuter: {
    ...Platform.select({
      ios: {
        shadowColor: BATTLE_COLORS.lime,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  avatarBorder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    borderRadius: AVATAR_SIZE / 2 - 4,
    overflow: 'hidden',
    backgroundColor: BATTLE_COLORS.backgroundCard,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  // Rank Badge
  rankBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  rankBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Player Info
  playerInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '800',
    color: BATTLE_COLORS.white,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BATTLE_COLORS.lime,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Edit Button
  editButton: {
    position: 'absolute',
    bottom: 20,
    right: SCREEN_WIDTH / 2 - AVATAR_SIZE / 2 - 20,
  },
  editButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BATTLE_COLORS.border,
  },
});

export default CharacterDisplay;

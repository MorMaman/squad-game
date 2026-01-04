/**
 * BattleHeader.tsx
 * Battle Game UI - Top header with avatar, level badge, XP bar, and currency displays
 * Dark navy theme with lime green accents
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Battle Game Theme Colors
export const BATTLE_COLORS = {
  background: '#0A0E27',
  backgroundLight: '#141B3D',
  backgroundCard: '#1A2245',
  lime: '#A3E635',
  limeLight: '#BEF264',
  limeDark: '#84CC16',
  gold: '#FFD700',
  goldDark: '#DAA520',
  purple: '#9B59FF',
  cyan: '#00D4FF',
  white: '#FFFFFF',
  textMuted: '#6B7280',
  textSecondary: '#9CA3AF',
  border: '#2D3A6A',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export interface BattleHeaderProps {
  avatarUri?: string | null;
  playerName: string;
  level: number;
  xp: number;
  xpMax: number;
  coins: number;
  gems: number;
  onAvatarPress?: () => void;
  onAddCoins?: () => void;
  onAddGems?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Animated XP Bar with lime green fill
 */
function XPBar({ xp, xpMax }: { xp: number; xpMax: number }) {
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const targetProgress = Math.min(xp / xpMax, 1);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    // Shimmer animation
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [xp, xpMax]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-100, 200]) }],
    opacity: 0.3,
  }));

  return (
    <View style={styles.xpBarContainer}>
      <View style={styles.xpBarBackground}>
        <Animated.View style={[styles.xpBarFill, barStyle]}>
          <LinearGradient
            colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeLight, BATTLE_COLORS.lime]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Shimmer effect */}
          <Animated.View style={[styles.xpBarShimmer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </View>
      <Text style={styles.xpText}>{xp}/{xpMax}</Text>
    </View>
  );
}

/**
 * Level Badge - Circular badge with level number
 */
function LevelBadge({ level }: { level: number }) {
  const scale = useSharedValue(1);
  const prevLevel = useRef(level);

  useEffect(() => {
    if (level !== prevLevel.current) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      prevLevel.current = level;
    }
  }, [level]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.levelBadgeContainer, animatedStyle]}>
      <LinearGradient
        colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark]}
        style={styles.levelBadge}
      >
        <Text style={styles.levelText}>{level}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * Avatar with glow effect
 */
function AvatarDisplay({
  uri,
  name,
  onPress,
}: {
  uri?: string | null;
  name: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.avatarContainer, animatedStyle]}
    >
      {/* Glow effect */}
      <Animated.View style={[styles.avatarGlow, glowStyle]} />

      {/* Avatar border */}
      <LinearGradient
        colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark, BATTLE_COLORS.lime]}
        style={styles.avatarBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatarInner}>
          {uri ? (
            <Image source={{ uri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

/**
 * Currency Pill - Coins or Gems display
 */
function CurrencyPill({
  value,
  type,
  onAdd,
}: {
  value: number;
  type: 'coins' | 'gems';
  onAdd?: () => void;
}) {
  const scale = useSharedValue(1);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 4, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      prevValue.current = value;
    }
  }, [value]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
  };

  return (
    <Animated.View style={[styles.currencyPill, animatedStyle]}>
      <View style={styles.currencyIconContainer}>
        {type === 'coins' ? (
          <FontAwesome5 name="coins" size={16} color={BATTLE_COLORS.gold} />
        ) : (
          <MaterialCommunityIcons name="diamond-stone" size={18} color={BATTLE_COLORS.purple} />
        )}
      </View>
      <Text style={styles.currencyValue}>{formatNumber(value)}</Text>
      {onAdd && (
        <TouchableOpacity onPress={handlePress} style={styles.addButton}>
          <LinearGradient
            colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark]}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={14} color={BATTLE_COLORS.background} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/**
 * BattleHeader - Main component
 */
export function BattleHeader({
  avatarUri,
  playerName,
  level,
  xp,
  xpMax,
  coins,
  gems,
  onAvatarPress,
  onAddCoins,
  onAddGems,
}: BattleHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Left Section: Avatar + Level + XP */}
      <View style={styles.leftSection}>
        <View style={styles.avatarWrapper}>
          <AvatarDisplay uri={avatarUri} name={playerName} onPress={onAvatarPress} />
          <LevelBadge level={level} />
        </View>
        <XPBar xp={xp} xpMax={xpMax} />
      </View>

      {/* Right Section: Currency */}
      <View style={styles.rightSection}>
        <CurrencyPill value={coins} type="coins" onAdd={onAddCoins} />
        <CurrencyPill value={gems} type="gems" onAdd={onAddGems} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BATTLE_COLORS.background,
  },

  // Left Section
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  avatarWrapper: {
    position: 'relative',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    backgroundColor: BATTLE_COLORS.lime,
    ...Platform.select({
      ios: {
        shadowColor: BATTLE_COLORS.lime,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
    }),
  },
  avatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: BATTLE_COLORS.backgroundCard,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BATTLE_COLORS.backgroundLight,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: BATTLE_COLORS.white,
  },

  // Level Badge
  levelBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  levelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BATTLE_COLORS.background,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: BATTLE_COLORS.background,
  },

  // XP Bar
  xpBarContainer: {
    flex: 1,
    maxWidth: 120,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: BATTLE_COLORS.backgroundCard,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: BATTLE_COLORS.textSecondary,
    marginTop: 2,
  },

  // Right Section
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Currency Pill
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BATTLE_COLORS.backgroundCard,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  currencyIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BATTLE_COLORS.white,
    fontVariant: ['tabular-nums'],
    minWidth: 28,
  },
  addButton: {
    marginLeft: 2,
  },
  addButtonGradient: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BattleHeader;

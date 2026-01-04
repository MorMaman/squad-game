import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Easing,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { Avatar } from '../../src/components/Avatar';
import {
  CrownOverlay,
  PowerIndicator,
  RivalryBadge,
} from '../../src/components';
import { RTLView, RTLIcon } from '../../src/components/RTLView';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../src/utils/rtl';

import { useSquadStore } from '../../src/store/squadStore';
import { useAuthStore } from '../../src/store/authStore';
import { usePowerStore } from '../../src/store/powerStore';
import { useCrownStore } from '../../src/store/crownStore';
import { supabase } from '../../src/lib/supabase';
import { UserStats } from '../../src/types';
import { POWER_INFO } from '../../src/types/powers';

// Battle Game UI Colors
const COLORS = {
  // Primary Background
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',

  // Rank Tier Colors
  GOLD: '#FFD700',
  GOLD_DARK: '#B8860B',
  SILVER: '#C0C0C0',
  SILVER_DARK: '#808080',
  BRONZE: '#CD7F32',
  BRONZE_DARK: '#8B4513',
  CYAN: '#00D4FF',
  CYAN_DARK: '#0099CC',
  PURPLE: '#9B59FF',
  PURPLE_DARK: '#7B3FDF',
  LIME: '#A3E635',
  LIME_DARK: '#65A30D',

  // Accent Colors
  CORAL: '#FF4757',
  NEON_GREEN: '#00FF87',
  ICE_WHITE: '#F0F8FF',
  ORANGE: '#FF6B00',
  PINK: '#FF69B4',
  ELECTRIC_BLUE: '#00BFFF',

  // Text Colors
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)',
  TEXT_MUTED: 'rgba(255, 255, 255, 0.5)',
};

// Rank tier configuration
const getRankTierConfig = (rank: number) => {
  if (rank === 1) {
    return {
      color: COLORS.GOLD,
      darkColor: COLORS.GOLD_DARK,
      icon: 'trophy' as const,
      label: 'Champion',
      glowIntensity: 1,
      gradientColors: ['#FFD700', '#FFA500', '#FF8C00'] as const,
    };
  }
  if (rank === 2) {
    return {
      color: COLORS.SILVER,
      darkColor: COLORS.SILVER_DARK,
      icon: 'medal' as const,
      label: 'Runner Up',
      glowIntensity: 0.8,
      gradientColors: ['#E8E8E8', '#C0C0C0', '#A8A8A8'] as const,
    };
  }
  if (rank === 3) {
    return {
      color: COLORS.BRONZE,
      darkColor: COLORS.BRONZE_DARK,
      icon: 'medal' as const,
      label: 'Third Place',
      glowIntensity: 0.7,
      gradientColors: ['#D4A574', '#CD7F32', '#8B4513'] as const,
    };
  }
  if (rank <= 10) {
    return {
      color: COLORS.CYAN,
      darkColor: COLORS.CYAN_DARK,
      icon: 'star' as const,
      label: 'Top 10',
      glowIntensity: 0.5,
      gradientColors: ['#00D4FF', '#00A8CC', '#007799'] as const,
    };
  }
  if (rank <= 50) {
    return {
      color: COLORS.PURPLE,
      darkColor: COLORS.PURPLE_DARK,
      icon: 'diamond' as const,
      label: 'Top 50',
      glowIntensity: 0.4,
      gradientColors: ['#9B59FF', '#7B3FDF', '#5B2FBF'] as const,
    };
  }
  return {
    color: COLORS.TEXT_SECONDARY,
    darkColor: COLORS.MIDNIGHT_BLUE,
    icon: 'ellipse' as const,
    label: 'Competitor',
    glowIntensity: 0.2,
    gradientColors: ['#3A3A5C', '#2A2A4C', '#1A1A3C'] as const,
  };
};

type TimeFrame = 'today' | 'week' | 'month' | 'all';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Floating particle component for podium background
const FloatingParticle = ({ delay = 0, color = COLORS.GOLD }: { delay?: number; color?: string }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const startX = Math.random() * 100 - 50;
    translateX.value = startX;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-80, { duration: 3000, easing: Easing.out(Easing.ease) }),
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
          withTiming(0, { duration: 2500 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 2500 })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.floatingParticle, animatedStyle]}>
      <View style={[styles.particleDot, { backgroundColor: color }]} />
    </Animated.View>
  );
};

// Enhanced sparkle component with varied animations
const Sparkle = ({ delay = 0, color = COLORS.GOLD, size = 16 }: { delay?: number; color?: string; size?: number }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 400 })
        )
      );
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(1.2, { damping: 4, stiffness: 300 }),
          withTiming(0, { duration: 400 })
        )
      );
      rotation.value = withDelay(
        delay,
        withTiming(180, { duration: 600 })
      );
    };

    startAnimation();
    const interval = setInterval(startAnimation, 2000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.sparkle, animatedStyle]}>
      <Ionicons name="sparkles" size={size} color={color} />
    </Animated.View>
  );
};

// Glowing ring around top 3 avatars
const GlowingRing = ({ color, intensity = 1, size = 80 }: { color: string; intensity?: number; size?: number }) => {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8 * intensity, { duration: 1500 }),
        withTiming(0.3 * intensity, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.glowingRing,
        {
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// Crown/Medal badge for top 3
const RankBadge = ({ rank }: { rank: 1 | 2 | 3 }) => {
  const config = getRankTierConfig(rank);
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const badgeSize = rank === 1 ? 36 : 28;
  const iconSize = rank === 1 ? 20 : 16;

  return (
    <Animated.View style={[styles.rankBadgeContainer, animatedStyle]}>
      <LinearGradient
        colors={config.gradientColors}
        style={[
          styles.rankBadgeGradient,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
        ]}
      >
        <Ionicons
          name={rank === 1 ? 'trophy' : 'medal'}
          size={iconSize}
          color={COLORS.DARK_NAVY}
        />
      </LinearGradient>
    </Animated.View>
  );
};

// Enhanced Podium Place Component
const PodiumPlace = ({
  rank,
  entry,
  isCurrentUser,
  activeTab,
  hasCrown,
  powerType,
  isTargeted,
  hasRivalry,
  isLastPlace,
}: {
  rank: 1 | 2 | 3;
  entry: UserStats | undefined;
  isCurrentUser: boolean;
  activeTab: string;
  hasCrown?: boolean;
  powerType?: string | null;
  isTargeted?: boolean;
  hasRivalry?: boolean;
  isLastPlace?: boolean;
}) => {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const floatY = useSharedValue(0);

  const heights = { 1: 110, 2: 80, 3: 65 };
  const delays = { 1: 200, 2: 0, 3: 400 };
  const avatarSizes: Record<number, 'small' | 'medium' | 'large'> = { 1: 'large', 2: 'medium', 3: 'medium' };

  const config = getRankTierConfig(rank);

  useEffect(() => {
    scale.value = withDelay(
      delays[rank],
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // Float animation for first place
    if (rank === 1) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [rank]);

  const podiumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const avatarContainerStyle = useAnimatedStyle(() => ({
    transform: rank === 1 ? [{ translateY: floatY.value }] : [],
    shadowOpacity: glowOpacity.value,
  }));

  if (!entry) return <View style={styles.podiumSlot} />;

  const points = activeTab === 'weekly' ? entry.points_weekly : entry.streak_count;

  return (
    <Animated.View style={[styles.podiumSlot, podiumStyle]}>
      {/* Background particles for first place */}
      {rank === 1 && (
        <>
          <FloatingParticle delay={0} color={COLORS.GOLD} />
          <FloatingParticle delay={400} color={COLORS.GOLD} />
          <FloatingParticle delay={800} color={COLORS.ORANGE} />
          <FloatingParticle delay={1200} color={COLORS.GOLD} />
        </>
      )}

      {/* Sparkles */}
      {rank === 1 && (
        <>
          <Sparkle delay={0} color={COLORS.GOLD} size={18} />
          <Sparkle delay={600} color={COLORS.ORANGE} size={14} />
          <Sparkle delay={1200} color={COLORS.GOLD} size={16} />
        </>
      )}
      {rank === 2 && <Sparkle delay={300} color={COLORS.SILVER} size={14} />}
      {rank === 3 && <Sparkle delay={600} color={COLORS.BRONZE} size={12} />}

      {/* Rank badge above avatar */}
      <RankBadge rank={rank} />

      {/* Avatar with glowing ring */}
      <Animated.View
        style={[
          styles.avatarContainer,
          avatarContainerStyle,
          {
            shadowColor: config.color,
            shadowRadius: rank === 1 ? 25 : 15,
          },
          isCurrentUser && styles.currentUserAvatar,
        ]}
      >
        <GlowingRing
          color={config.color}
          intensity={config.glowIntensity}
          size={rank === 1 ? 72 : 56}
        />
        {hasCrown ? (
          <CrownOverlay size={avatarSizes[rank]}>
            <Avatar
              uri={entry.profile?.avatar_url}
              name={entry.profile?.display_name}
              size={avatarSizes[rank]}
            />
          </CrownOverlay>
        ) : (
          <Avatar
            uri={entry.profile?.avatar_url}
            name={entry.profile?.display_name}
            size={avatarSizes[rank]}
          />
        )}
      </Animated.View>

      {/* Status Indicators Row */}
      <RTLView row style={styles.podiumIndicators}>
        {powerType && (
          <PowerIndicator powerType={powerType as any} size="small" />
        )}
        {isTargeted && (
          <View style={styles.targetIndicator}>
            <Ionicons name="locate" size={12} color={COLORS.CORAL} />
          </View>
        )}
        {hasRivalry && <RivalryBadge size="small" />}
        {isLastPlace && (
          <View style={styles.underdogIndicator}>
            <Ionicons name="flash" size={12} color={COLORS.ORANGE} />
          </View>
        )}
      </RTLView>

      {/* Player name */}
      <Text style={[styles.podiumName, { color: COLORS.TEXT_PRIMARY }]} numberOfLines={1}>
        {entry.profile?.display_name}
      </Text>

      {/* Points with color */}
      <Text style={[styles.podiumPoints, { color: config.color }]}>
        {points?.toLocaleString()}
        {activeTab === 'streaks' && ' days'}
      </Text>

      {/* Podium bar with gradient */}
      <LinearGradient
        colors={config.gradientColors}
        style={[styles.podiumBar, { height: heights[rank] }]}
      >
        <View style={styles.podiumBarInner}>
          <Text style={styles.podiumRank}>{rank}</Text>
          {rank === 1 && (
            <Text style={styles.podiumLabel}>CHAMPION</Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Enhanced Leaderboard Row Component
const LeaderboardRow = ({
  entry,
  rank,
  isCurrentUser,
  previousRank,
  activeTab,
  onPress,
  hasCrown,
  powerType,
  isTargeted,
  hasRivalry,
  isLastPlace,
}: {
  entry: UserStats;
  rank: number;
  isCurrentUser: boolean;
  previousRank?: number;
  activeTab: string;
  onPress: () => void;
  hasCrown?: boolean;
  powerType?: string | null;
  isTargeted?: boolean;
  hasRivalry?: boolean;
  isLastPlace?: boolean;
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  const rankChange = previousRank ? previousRank - rank : 0;
  const points = activeTab === 'weekly' ? entry.points_weekly : entry.streak_count;
  const tierConfig = getRankTierConfig(rank);

  useEffect(() => {
    if (isCurrentUser) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isCurrentUser]);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: isCurrentUser ? glowOpacity.value : 0,
  }));

  // Use RTL-aware slide animation
  const enteringAnimation = isRTL
    ? SlideInLeft.delay(Math.min(rank * 40, 400)).springify().damping(15)
    : SlideInRight.delay(Math.min(rank * 40, 400)).springify().damping(15);

  // Determine row background based on rank tier
  const getRowBackground = () => {
    if (isCurrentUser) {
      return [COLORS.LIME + '30', COLORS.LIME + '15'];
    }
    if (rank <= 10) {
      return [COLORS.CYAN + '20', COLORS.CYAN + '08'];
    }
    if (rank <= 50) {
      return [COLORS.PURPLE + '15', COLORS.PURPLE + '05'];
    }
    return [COLORS.MIDNIGHT_BLUE, COLORS.DEEP_PURPLE];
  };

  return (
    <Animated.View
      entering={enteringAnimation}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.leaderboardRow,
          glowStyle,
          {
            borderColor: isCurrentUser ? COLORS.LIME : tierConfig.color + '40',
            shadowColor: isCurrentUser ? COLORS.LIME : tierConfig.color,
          },
        ]}
      >
        <LinearGradient
          colors={getRowBackground()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rowGradient}
        >
          {/* RTL-aware row layout: Rank | Avatar | Info | Score */}
          <RTLView row style={styles.leaderboardRowContent}>
            {/* Rank with tier indicator */}
            <View style={styles.rankContainer}>
              <LinearGradient
                colors={[tierConfig.color + '40', tierConfig.color + '10']}
                style={styles.rankBubble}
              >
                {rank <= 10 ? (
                  <Ionicons
                    name={tierConfig.icon}
                    size={10}
                    color={tierConfig.color}
                    style={styles.rankIcon}
                  />
                ) : null}
                <Text style={[styles.rankNumber, { color: tierConfig.color }]}>
                  {rank}
                </Text>
              </LinearGradient>
            </View>

            {/* Avatar */}
            <View style={[styles.rowAvatarWrapper, hasCrown && styles.crownHolderRowAvatar]}>
              {hasCrown ? (
                <CrownOverlay size="small">
                  <Avatar
                    uri={entry.profile?.avatar_url}
                    name={entry.profile?.display_name}
                    size="small"
                  />
                </CrownOverlay>
              ) : (
                <Avatar
                  uri={entry.profile?.avatar_url}
                  name={entry.profile?.display_name}
                  size="small"
                />
              )}
            </View>

            {/* Player info */}
            <View style={styles.playerInfo}>
              <RTLView row style={styles.playerNameRow}>
                <Text style={[
                  styles.playerName,
                  isRTL && styles.playerNameRTL,
                  isCurrentUser && { color: COLORS.LIME },
                ]} numberOfLines={1}>
                  {entry.profile?.display_name}
                  {isCurrentUser && (
                    <Text style={styles.youBadge}> (You)</Text>
                  )}
                </Text>
              </RTLView>

              {/* Status indicators */}
              <RTLView row style={styles.rowIndicators}>
                {powerType && (
                  <PowerIndicator powerType={powerType as any} size="tiny" />
                )}
                {isTargeted && (
                  <View style={styles.targetIndicatorSmall}>
                    <Ionicons name="locate" size={10} color={COLORS.CORAL} />
                  </View>
                )}
                {hasRivalry && <RivalryBadge size="tiny" />}
                {isLastPlace && (
                  <View style={styles.underdogIndicatorSmall}>
                    <Ionicons name="flash" size={10} color={COLORS.ORANGE} />
                  </View>
                )}
                {entry.strikes_14d > 0 && (
                  <RTLView row style={styles.strikesBadge}>
                    <Ionicons name="warning" size={10} color={COLORS.CORAL} />
                    <Text style={styles.strikesText}>{entry.strikes_14d}</Text>
                  </RTLView>
                )}
              </RTLView>
            </View>

            {/* Score and rank change */}
            <View style={[
              styles.scoreContainer,
              isRTL && styles.scoreContainerRTL
            ]}>
              <Text style={[styles.playerScore, { color: tierConfig.color }]}>
                {points?.toLocaleString()}
              </Text>
              {rankChange !== 0 && (
                <RTLView row style={[
                  styles.rankChange,
                  rankChange > 0 ? styles.rankUp : styles.rankDown,
                ]}>
                  <RTLIcon
                    name={rankChange > 0 ? 'arrow-up' : 'arrow-down'}
                    size={10}
                    color={rankChange > 0 ? COLORS.NEON_GREEN : COLORS.CORAL}
                    noFlip
                  />
                  <Text style={[
                    styles.rankChangeText,
                    { color: rankChange > 0 ? COLORS.NEON_GREEN : COLORS.CORAL },
                  ]}>
                    {Math.abs(rankChange)}
                  </Text>
                </RTLView>
              )}
            </View>
          </RTLView>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
};

// Timeframe Tab Component
const TimeframeTab = ({
  label,
  value,
  isActive,
  onPress,
  indicatorPosition,
}: {
  label: string;
  value: TimeFrame;
  isActive: boolean;
  onPress: () => void;
  indicatorPosition: Animated.SharedValue<number>;
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable style={styles.timeframeTab} onPress={handlePress}>
      <Text style={[styles.timeframeText, isActive && styles.timeframeTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
};

// Stats Card Component
const StatsCard = ({
  icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) => {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={styles.statsCard}
    >
      <LinearGradient
        colors={[color + '30', color + '10']}
        style={styles.statsCardGradient}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'streaks'>('weekly');
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [stats, setStats] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { currentSquad } = useSquadStore();
  const { user } = useAuthStore();
  const { activePowers, activeTargets, fetchActivePowers, fetchActiveTargets } = usePowerStore();
  const { currentCrown, activeRivalry, fetchCrownData } = useCrownStore();

  const indicatorPosition = useSharedValue(1);
  const headerScale = useSharedValue(0);
  const headerGlow = useSharedValue(0.3);
  const backgroundPulse = useSharedValue(0);

  const timeframes: { label: string; value: TimeFrame }[] = [
    { label: t('leaderboard.today'), value: 'today' },
    { label: t('leaderboard.week'), value: 'week' },
    { label: t('leaderboard.month'), value: 'month' },
    { label: t('leaderboard.allTime'), value: 'all' },
  ];

  const currentUserRank = stats.findIndex((s) => s.user_id === user?.id) + 1;
  const currentUserStats = stats.find((s) => s.user_id === user?.id);
  const nextRankStats = currentUserRank > 1 ? stats[currentUserRank - 2] : null;
  const pointsToNextRank = nextRankStats
    ? (activeTab === 'weekly' ? nextRankStats.points_weekly : nextRankStats.streak_count) -
      (activeTab === 'weekly' ? currentUserStats?.points_weekly || 0 : currentUserStats?.streak_count || 0)
    : 0;

  const userTierConfig = currentUserRank > 0 ? getRankTierConfig(currentUserRank) : getRankTierConfig(999);

  // Helper functions for indicators
  const hasCrown = (userId: string) => currentCrown?.user_id === userId;

  const getUserPower = (userId: string) => {
    const power = activePowers.find(p => p.user_id === userId);
    return power?.power_type || null;
  };

  const isUserTargeted = (userId: string) => {
    return activeTargets.some(t => t.target_id === userId);
  };

  const hasRivalry = (userId: string) => {
    if (!activeRivalry) return false;
    return activeRivalry.rival1_id === userId || activeRivalry.rival2_id === userId;
  };

  const isLastPlace = (userId: string) => {
    if (stats.length === 0) return false;
    return stats[stats.length - 1]?.user_id === userId;
  };

  const fetchLeaderboard = async () => {
    if (!currentSquad) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('squad_id', currentSquad.id)
        .order(
          activeTab === 'weekly' ? 'points_weekly' : 'streak_count',
          { ascending: false }
        );

      if (!error && data) {
        setStats(data as UserStats[]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    if (currentSquad) {
      fetchActivePowers(currentSquad.id);
      fetchActiveTargets(currentSquad.id);
      fetchCrownData(currentSquad.id);
    }
  }, [currentSquad, activeTab, timeframe]);

  useEffect(() => {
    headerScale.value = withSpring(1, { damping: 10, stiffness: 150 });
    headerGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
    backgroundPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  const handleTimeframeChange = (value: TimeFrame) => {
    const index = timeframes.findIndex((t) => t.value === value);
    // For RTL, reverse the indicator position
    const position = isRTL ? (timeframes.length - 1 - index) : index;
    indicatorPosition.value = withSpring(position, { damping: 15, stiffness: 150 });
    setTimeframe(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleTabChange = (tab: 'weekly' | 'streaks') => {
    setActiveTab(tab);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 300 && currentUserRank > 3;
    setShowJumpButton(shouldShow);
  };

  const scrollToCurrentUser = () => {
    if (currentUserRank > 3) {
      flatListRef.current?.scrollToIndex({
        index: currentUserRank - 4,
        animated: true,
        viewPosition: 0.5,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (SCREEN_WIDTH - 32) / 4;
    return {
      transform: [{ translateX: indicatorPosition.value * tabWidth }],
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const headerGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: headerGlow.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(backgroundPulse.value, [0, 1], [0.02, 0.08]);
    return { opacity };
  });

  const jumpButtonScale = useSharedValue(0);

  useEffect(() => {
    jumpButtonScale.value = withSpring(showJumpButton ? 1 : 0, { damping: 12 });
  }, [showJumpButton]);

  const jumpButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: jumpButtonScale.value }],
    opacity: jumpButtonScale.value,
  }));

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  const renderItem = ({ item, index }: { item: UserStats; index: number }) => (
    <LeaderboardRow
      entry={item}
      rank={index + 4}
      isCurrentUser={item.user_id === user?.id}
      activeTab={activeTab}
      onPress={() => {}}
      hasCrown={hasCrown(item.user_id)}
      powerType={getUserPower(item.user_id)}
      isTargeted={isUserTargeted(item.user_id)}
      hasRivalry={hasRivalry(item.user_id)}
      isLastPlace={isLastPlace(item.user_id)}
    />
  );

  const ListHeader = () => (
    <>
      {/* Animated background pattern */}
      <Animated.View style={[styles.backgroundPattern, backgroundStyle]}>
        <LinearGradient
          colors={[COLORS.PURPLE, COLORS.CYAN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Your Rank Header */}
      <LinearGradient
        colors={[userTierConfig.color + '40', COLORS.DARK_NAVY]}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.yourRankContainer, headerAnimatedStyle, headerGlowStyle]}>
          <View style={styles.rankHeaderContent}>
            <Text style={styles.yourRankLabel}>{t('leaderboard.yourRank').toUpperCase()}</Text>

            <LinearGradient
              colors={userTierConfig.gradientColors}
              style={styles.rankBadgeLarge}
            >
              <Text style={styles.rankBadgeNumber}>
                #{currentUserRank || '-'}
              </Text>
            </LinearGradient>

            <View style={styles.tierLabel}>
              <Ionicons name={userTierConfig.icon} size={14} color={userTierConfig.color} />
              <Text style={[styles.tierText, { color: userTierConfig.color }]}>
                {userTierConfig.label}
              </Text>
            </View>
          </View>

          {/* Progress to next rank */}
          {currentUserRank > 1 && pointsToNextRank > 0 && (
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: userTierConfig.color }]}>
                {pointsToNextRank} pts to #{currentUserRank - 1}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[userTierConfig.color, userTierConfig.darkColor]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(70, 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <StatsCard
              icon="trophy"
              label="Points"
              value={currentUserStats?.points_weekly?.toLocaleString() || '0'}
              color={COLORS.GOLD}
              delay={100}
            />
            <StatsCard
              icon="flame"
              label="Streak"
              value={`${currentUserStats?.streak_count || 0}d`}
              color={COLORS.ORANGE}
              delay={200}
            />
            <StatsCard
              icon="people"
              label="Rank"
              value={`#${currentUserRank || '-'}`}
              color={COLORS.CYAN}
              delay={300}
            />
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Timeframe Selector - RTL-aware */}
      <RTLView row style={styles.timeframeContainer}>
        <Animated.View style={[
          styles.timeframeIndicator,
          indicatorStyle,
          isRTL && styles.timeframeIndicatorRTL
        ]}>
          <LinearGradient
            colors={[COLORS.PURPLE, COLORS.CYAN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
        {timeframes.map((tf) => (
          <TimeframeTab
            key={tf.value}
            label={tf.label}
            value={tf.value}
            isActive={timeframe === tf.value}
            onPress={() => handleTimeframeChange(tf.value)}
            indicatorPosition={indicatorPosition}
          />
        ))}
      </RTLView>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.podiumContainer}
        >
          {/* Podium background glow */}
          <View style={styles.podiumBackground}>
            <LinearGradient
              colors={[COLORS.GOLD + '20', 'transparent']}
              style={styles.podiumGlow}
            />
          </View>

          <PodiumPlace
            rank={2}
            entry={top3[1]}
            isCurrentUser={top3[1]?.user_id === user?.id}
            activeTab={activeTab}
            hasCrown={top3[1] && hasCrown(top3[1].user_id)}
            powerType={top3[1] && getUserPower(top3[1].user_id)}
            isTargeted={top3[1] && isUserTargeted(top3[1].user_id)}
            hasRivalry={top3[1] && hasRivalry(top3[1].user_id)}
            isLastPlace={top3[1] && isLastPlace(top3[1].user_id)}
          />
          <PodiumPlace
            rank={1}
            entry={top3[0]}
            isCurrentUser={top3[0]?.user_id === user?.id}
            activeTab={activeTab}
            hasCrown={top3[0] && hasCrown(top3[0].user_id)}
            powerType={top3[0] && getUserPower(top3[0].user_id)}
            isTargeted={top3[0] && isUserTargeted(top3[0].user_id)}
            hasRivalry={top3[0] && hasRivalry(top3[0].user_id)}
            isLastPlace={top3[0] && isLastPlace(top3[0].user_id)}
          />
          <PodiumPlace
            rank={3}
            entry={top3[2]}
            isCurrentUser={top3[2]?.user_id === user?.id}
            activeTab={activeTab}
            hasCrown={top3[2] && hasCrown(top3[2].user_id)}
            powerType={top3[2] && getUserPower(top3[2].user_id)}
            isTargeted={top3[2] && isUserTargeted(top3[2].user_id)}
            hasRivalry={top3[2] && hasRivalry(top3[2].user_id)}
            isLastPlace={top3[2] && isLastPlace(top3[2].user_id)}
          />
        </Animated.View>
      )}

      {/* Leaderboard Title */}
      <View style={styles.leaderboardHeader}>
        <LinearGradient
          colors={[COLORS.MIDNIGHT_BLUE, COLORS.DARK_NAVY]}
          style={styles.leaderboardHeaderGradient}
        >
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          <View style={styles.playerCount}>
            <Ionicons name="people" size={14} color={COLORS.CYAN} />
            <Text style={styles.playerCountText}>{stats.length} players</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Tab Selector - RTL-aware */}
      <RTLView row style={styles.tabSelector}>
        <Pressable
          style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]}
          onPress={() => handleTabChange('weekly')}
        >
          <LinearGradient
            colors={activeTab === 'weekly' ? [COLORS.CYAN + '30', COLORS.CYAN + '10'] : ['transparent', 'transparent']}
            style={styles.tabButtonGradient}
          >
            <Ionicons
              name="trophy"
              size={18}
              color={activeTab === 'weekly' ? COLORS.CYAN : COLORS.TEXT_MUTED}
            />
            <Text style={[styles.tabButtonText, activeTab === 'weekly' && styles.tabButtonTextActive]}>
              {t('leaderboard.weekly')}
            </Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'streaks' && styles.tabButtonActive]}
          onPress={() => handleTabChange('streaks')}
        >
          <LinearGradient
            colors={activeTab === 'streaks' ? [COLORS.ORANGE + '30', COLORS.ORANGE + '10'] : ['transparent', 'transparent']}
            style={styles.tabButtonGradient}
          >
            <Ionicons
              name="flame"
              size={18}
              color={activeTab === 'streaks' ? COLORS.ORANGE : COLORS.TEXT_MUTED}
            />
            <Text style={[styles.tabButtonText, activeTab === 'streaks' && styles.tabButtonTextActive]}>
              {t('leaderboard.streaks')}
            </Text>
          </LinearGradient>
        </Pressable>
      </RTLView>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[COLORS.PURPLE + '30', COLORS.CYAN + '20']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="trophy-outline" size={64} color={COLORS.PURPLE} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{t('leaderboard.noStandingsYet')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('leaderboard.completeEventsToAppear')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={rest}
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={stats.length === 0 && !isLoading ? EmptyState : null}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchLeaderboard}
            tintColor={COLORS.CYAN}
            colors={[COLORS.CYAN]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Jump to Your Position Button */}
      <Animated.View style={[styles.jumpButton, jumpButtonStyle]}>
        <Pressable
          onPress={scrollToCurrentUser}
          style={styles.jumpButtonInner}
        >
          <LinearGradient
            colors={[COLORS.LIME, COLORS.LIME_DARK]}
            style={styles.jumpButtonGradient}
          >
            <Ionicons name="locate" size={20} color={COLORS.DARK_NAVY} />
            <Text style={styles.jumpButtonText}>{t('leaderboard.yourPosition')}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_NAVY,
  },
  listContent: {
    paddingBottom: 100,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
  },

  // Header Styles
  headerGradient: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  yourRankContainer: {
    alignItems: 'center',
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 10,
  },
  rankHeaderContent: {
    alignItems: 'center',
  },
  yourRankLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 3,
    marginBottom: 12,
  },
  rankBadgeLarge: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: COLORS.GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  rankBadgeNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.DARK_NAVY,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tierLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  statsCard: {
    flex: 1,
  },
  statsCardGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Timeframe Selector
  timeframeContainer: {
    marginHorizontal: 16,
    marginTop: -15,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 0.5,
  },
  timeframeTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  timeframeIndicator: {
    position: 'absolute',
    width: (SCREEN_WIDTH - 32 - 8) / 4,
    height: '100%',
    left: 4,
    top: 4,
    bottom: 4,
  },
  timeframeIndicatorRTL: {
    left: undefined,
    right: 4,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },

  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
  },
  podiumBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  podiumGlow: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  floatingParticle: {
    position: 'absolute',
    bottom: 100,
    zIndex: 5,
  },
  particleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  rankBadgeContainer: {
    marginBottom: 8,
    zIndex: 20,
  },
  rankBadgeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 8,
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowingRing: {
    position: 'absolute',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  currentUserAvatar: {
    borderWidth: 3,
    borderColor: COLORS.LIME,
    borderRadius: 50,
    padding: 2,
  },
  podiumIndicators: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    minHeight: 20,
  },
  targetIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  underdogIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 90,
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  podiumBar: {
    width: '75%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  podiumBarInner: {
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.DARK_NAVY,
  },
  podiumLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
    letterSpacing: 1,
    marginTop: -2,
  },
  sparkle: {
    position: 'absolute',
    top: -25,
    zIndex: 20,
  },

  // Leaderboard Header
  leaderboardHeader: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  leaderboardHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 2,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.CYAN,
  },

  // Tab Selector
  tabSelector: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
  },
  tabButtonTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },

  // Leaderboard Row
  leaderboardRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  rowGradient: {
    padding: 12,
  },
  leaderboardRowContent: {
    alignItems: 'center',
  },
  rankContainer: {
    width: 44,
    alignItems: 'center',
  },
  rankBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 36,
  },
  rankIcon: {
    marginRight: 2,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowAvatarWrapper: {
    position: 'relative',
    marginHorizontal: 10,
  },
  crownHolderRowAvatar: {
    shadowColor: COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  playerNameRTL: {
    textAlign: 'right',
  },
  youBadge: {
    color: COLORS.LIME,
    fontWeight: '600',
    fontSize: 12,
  },
  rowIndicators: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  targetIndicatorSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  underdogIndicatorSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strikesBadge: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  strikesText: {
    fontSize: 10,
    color: COLORS.CORAL,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  scoreContainerRTL: {
    alignItems: 'flex-start',
  },
  playerScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  rankChange: {
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankUp: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
  },
  rankDown: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  rankChangeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Jump Button
  jumpButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  jumpButtonInner: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.LIME,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  jumpButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  jumpButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
  },
});

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
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Easing,
  runOnJS,
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideInLeft,
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

// Game Colors
const COLORS = {
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
  BRONZE: '#CD7F32',
  PURPLE: '#9B59FF',
  CYAN: '#00D4FF',
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  CORAL: '#FF4757',
  NEON_GREEN: '#00FF87',
  ICE_WHITE: '#F0F8FF',
  ORANGE: '#FF6B00',
};

type TimeFrame = 'today' | 'week' | 'month' | 'all';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Sparkle component for first place
const Sparkle = ({ delay = 0 }: { delay?: number }) => {
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
          withSpring(1, { damping: 4, stiffness: 300 }),
          withTiming(0, { duration: 400 })
        )
      );
      rotation.value = withDelay(
        delay,
        withTiming(180, { duration: 600 })
      );
    };

    startAnimation();
    const interval = setInterval(startAnimation, 2000);
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
      <Ionicons name="sparkles" size={16} color={COLORS.GOLD} />
    </Animated.View>
  );
};

// Podium Place Component
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

  const heights = { 1: 100, 2: 75, 3: 60 };
  const delays = { 1: 200, 2: 0, 3: 400 };
  const avatarSizes: Record<number, 'small' | 'medium' | 'large'> = { 1: 'large', 2: 'medium', 3: 'medium' };

  const podiumColors: Record<number, readonly [string, string]> = {
    1: [COLORS.GOLD, '#B8860B'] as const,
    2: [COLORS.SILVER, '#808080'] as const,
    3: [COLORS.BRONZE, '#8B4513'] as const,
  };

  useEffect(() => {
    scale.value = withDelay(
      delays[rank],
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    if (rank === 1) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [rank]);

  const podiumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  if (!entry) return <View style={styles.podiumSlot} />;

  const points = activeTab === 'weekly' ? entry.points_weekly : entry.streak_count;

  return (
    <Animated.View style={[styles.podiumSlot, podiumStyle]}>
      {rank === 1 && (
        <>
          <Sparkle delay={0} />
          <Sparkle delay={500} />
          <Sparkle delay={1000} />
        </>
      )}

      <Animated.View
        style={[
          styles.avatarContainer,
          rank === 1 && styles.firstPlaceAvatar,
          isCurrentUser && styles.currentUserAvatar,
          hasCrown && styles.crownHolderAvatar,
          rank === 1 && glowStyle,
        ]}
      >
        {rank <= 3 && (
          <View style={[styles.crownBadge, { backgroundColor: podiumColors[rank][0] }]}>
            <Ionicons
              name={rank === 1 ? 'trophy' : 'medal'}
              size={rank === 1 ? 16 : 14}
              color={COLORS.DARK_NAVY}
            />
          </View>
        )}
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
            <Ionicons name="flash" size={12} color="#FF6B00" />
          </View>
        )}
      </RTLView>

      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.profile?.display_name}
      </Text>
      <Text style={[styles.podiumPoints, { color: podiumColors[rank][0] }]}>
        {points?.toLocaleString()}
        {activeTab === 'streaks' && ' days'}
      </Text>

      <LinearGradient
        colors={podiumColors[rank]}
        style={[styles.podiumBar, { height: heights[rank] }]}
      >
        <Text style={styles.podiumRank}>{rank}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Leaderboard Row Component
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

  useEffect(() => {
    if (isCurrentUser) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
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
    shadowOpacity: glowOpacity.value,
  }));

  // Use RTL-aware slide animation
  const enteringAnimation = isRTL
    ? SlideInLeft.delay(rank * 50).springify().damping(15)
    : SlideInRight.delay(rank * 50).springify().damping(15);

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
          isCurrentUser && styles.currentUserRow,
          isCurrentUser && glowStyle,
          rank <= 10 && styles.topTenRow,
        ]}
      >
        {/* RTL-aware row layout: Rank | Avatar | Info | Score */}
        <RTLView row style={styles.leaderboardRowContent}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankNumber, rank <= 10 && styles.topTenRank]}>
              {rank}
            </Text>
          </View>

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

          <View style={styles.playerInfo}>
            <RTLView row style={styles.playerNameRow}>
              <Text style={[
                styles.playerName,
                isRTL && styles.playerNameRTL
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
                  <Ionicons name="flash" size={10} color="#FF6B00" />
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

          <View style={[
            styles.scoreContainer,
            isRTL && styles.scoreContainerRTL
          ]}>
            <Text style={styles.playerScore}>
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

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'streaks'>('weekly');
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [stats, setStats] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  const { currentSquad } = useSquadStore();
  const { user } = useAuthStore();
  const { activePowers, activeTargets, fetchActivePowers, fetchActiveTargets } = usePowerStore();
  const { currentCrown, activeRivalry, fetchCrownData } = useCrownStore();

  const indicatorPosition = useSharedValue(1);
  const headerScale = useSharedValue(0);
  const headerGlow = useSharedValue(0.3);

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
        withTiming(0.7, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
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
      {/* Your Rank Header */}
      <LinearGradient
        colors={[COLORS.PURPLE, COLORS.DARK_NAVY]}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.yourRankContainer, headerAnimatedStyle, headerGlowStyle]}>
          <Text style={styles.yourRankLabel}>{t('leaderboard.yourRank').toUpperCase()}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeNumber}>
              #{currentUserRank || '-'}
            </Text>
          </View>
          {currentUserRank > 1 && pointsToNextRank > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {pointsToNextRank} pts to #{currentUserRank - 1}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[COLORS.CYAN, COLORS.PURPLE]}
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

      {/* Tab Selector - RTL-aware */}
      <RTLView row style={styles.tabSelector}>
        <Pressable
          style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]}
          onPress={() => handleTabChange('weekly')}
        >
          <Ionicons
            name="trophy"
            size={18}
            color={activeTab === 'weekly' ? COLORS.CYAN : COLORS.ICE_WHITE}
          />
          <Text style={[styles.tabButtonText, activeTab === 'weekly' && styles.tabButtonTextActive]}>
            {t('leaderboard.weekly')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'streaks' && styles.tabButtonActive]}
          onPress={() => handleTabChange('streaks')}
        >
          <Ionicons
            name="flame"
            size={18}
            color={activeTab === 'streaks' ? COLORS.ORANGE : COLORS.ICE_WHITE}
          />
          <Text style={[styles.tabButtonText, activeTab === 'streaks' && styles.tabButtonTextActive]}>
            {t('leaderboard.streaks')}
          </Text>
        </Pressable>
      </RTLView>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color={COLORS.PURPLE} />
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
        contentContainerStyle={styles.listContent}
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
            colors={[COLORS.PURPLE, COLORS.CYAN]}
            style={styles.jumpButtonGradient}
          >
            <Ionicons name="locate" size={20} color={COLORS.ICE_WHITE} />
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

  // Header Styles
  headerGradient: {
    paddingTop: 20,
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
  yourRankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.7,
    letterSpacing: 2,
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: COLORS.DEEP_PURPLE,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.PURPLE,
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  rankBadgeNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
  },
  progressContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: COLORS.CYAN,
    marginBottom: 8,
  },
  progressBar: {
    width: 150,
    height: 4,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Timeframe Selector
  timeframeContainer: {
    marginHorizontal: 16,
    marginTop: -15,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.6,
  },
  timeframeTextActive: {
    opacity: 1,
    color: COLORS.ICE_WHITE,
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
    borderRadius: 8,
  },

  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  firstPlaceAvatar: {
    shadowColor: COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  currentUserAvatar: {
    borderWidth: 3,
    borderColor: COLORS.PURPLE,
    borderRadius: 50,
    padding: 2,
  },
  crownHolderAvatar: {
    shadowColor: COLORS.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarWrapper: {
    position: 'relative',
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
  crownBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    textAlign: 'center',
    maxWidth: 80,
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumBar: {
    width: '70%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
  },
  sparkle: {
    position: 'absolute',
    top: -20,
    zIndex: 20,
  },

  // Tab Selector
  tabSelector: {
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    borderColor: COLORS.CYAN,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.6,
  },
  tabButtonTextActive: {
    opacity: 1,
  },

  // Leaderboard Row
  leaderboardRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leaderboardRowContent: {
    alignItems: 'center',
  },
  currentUserRow: {
    borderColor: COLORS.PURPLE,
    backgroundColor: 'rgba(155, 89, 255, 0.15)',
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 5,
  },
  topTenRow: {
    backgroundColor: COLORS.DEEP_PURPLE,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.5,
  },
  topTenRank: {
    opacity: 1,
    color: COLORS.CYAN,
  },
  rowAvatarWrapper: {
    position: 'relative',
    marginHorizontal: 8,
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
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
  playerNameRTL: {
    textAlign: 'right',
  },
  youBadge: {
    color: COLORS.PURPLE,
    fontWeight: '500',
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
  },
  scoreContainerRTL: {
    alignItems: 'flex-start',
  },
  playerScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.CYAN,
  },
  rankChange: {
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankUp: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
  },
  rankDown: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  rankChangeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.ICE_WHITE,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },

  // Jump Button
  jumpButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  jumpButtonInner: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  jumpButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  jumpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
});

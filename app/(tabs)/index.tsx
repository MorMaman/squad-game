/**
 * Battle Game Home Screen
 * Dark navy background with lime green accents
 * Features: Avatar, Level, XP, Stats, Character Display, Tabs
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useSquadStore } from '../../src/store/squadStore';
import { useEventStore } from '../../src/store/eventStore';
import { usePowerStore } from '../../src/store/powerStore';
import { useCrownStore } from '../../src/store/crownStore';
import { useRealtimeEvent } from '../../src/hooks/useRealtimeEvent';
import { EventType } from '../../src/types';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../src/utils/rtl';

// Battle Game UI Components
import {
  BattleHeader,
  CharacterStats,
  CharacterDisplay,
  BATTLE_COLORS,
} from '../../src/components/home';
import type { StatData } from '../../src/components/home';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tab types
type TabType = 'characteristics' | 'outfit' | 'items';

// Event type configurations with proper const arrays
const EVENT_CONFIG: Record<EventType, {
  icon: string;
  colors: readonly [string, string];
  titleKey: string;
  xpReward: number
}> = {
  POLL: {
    icon: 'analytics',
    colors: [BATTLE_COLORS.purple, '#8B5CF6'] as const,
    titleKey: 'home.predictionTime',
    xpReward: 30,
  },
  LIVE_SELFIE: {
    icon: 'camera',
    colors: ['#FF2D92', '#F472B6'] as const,
    titleKey: 'home.selfieChallenge',
    xpReward: 25,
  },
  PRESSURE_TAP: {
    icon: 'flash',
    colors: [BATTLE_COLORS.cyan, '#22D3EE'] as const,
    titleKey: 'home.pressureTap',
    xpReward: 35,
  },
};

// Default gradient colors
const DEFAULT_GRADIENT: readonly [string, string] = [BATTLE_COLORS.backgroundCard, BATTLE_COLORS.backgroundLight] as const;

/**
 * Tab Selector Component
 */
function TabSelector({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'characteristics', label: 'Characteristics', icon: 'stats-chart' },
    { key: 'outfit', label: 'Outfit', icon: 'shirt' },
    { key: 'items', label: 'Items', icon: 'cube' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTabChange(tab.key);
            }}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            {isActive && (
              <LinearGradient
                colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark] as const}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={isActive ? BATTLE_COLORS.background : BATTLE_COLORS.textMuted}
            />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Battle Button Component
 */
function BattleButton({
  onPress,
  disabled,
  label = 'BATTLE',
}: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.02, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      style={styles.battleButtonTouchable}
    >
      <Animated.View style={[styles.battleButtonContainer, buttonStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.battleButtonGlow, glowStyle]} />

        {/* Button */}
        <View style={styles.battleButtonOuter}>
          <LinearGradient
            colors={[BATTLE_COLORS.lime, BATTLE_COLORS.limeDark] as const}
            style={styles.battleButtonInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Text style={styles.battleButtonText}>{label}</Text>
          </LinearGradient>
          {/* 3D bottom effect */}
          <View style={styles.battleButton3DBottom} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/**
 * Event Card Component
 */
function EventCard({
  event,
  status,
  timeRemaining,
  onPress,
}: {
  event: any;
  status: string;
  timeRemaining?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const config = event ? EVENT_CONFIG[event.event_type as EventType] : null;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientColors = config?.colors ?? DEFAULT_GRADIENT;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.eventCard}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.eventCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {event && config ? (
            <>
              <View style={styles.eventIconContainer}>
                <Ionicons name={config.icon as any} size={32} color="#FFFFFF" />
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{t(config.titleKey)}</Text>
                {status === 'open' && (
                  <View style={styles.eventLiveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.eventLiveText}>LIVE</Text>
                  </View>
                )}
                {status === 'submitted' && (
                  <View style={styles.eventCompletedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={BATTLE_COLORS.lime} />
                    <Text style={styles.eventCompletedText}>COMPLETED</Text>
                  </View>
                )}
                {timeRemaining && (
                  <Text style={styles.eventTimeText}>{timeRemaining}</Text>
                )}
              </View>
              <View style={styles.eventXPBadge}>
                <Text style={styles.eventXPText}>+{config.xpReward} XP</Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="calendar-outline" size={32} color={BATTLE_COLORS.textMuted} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventNoEventTitle}>{t('home.noChallengeToday')}</Text>
                <Text style={styles.eventNoEventSubtitle}>{t('home.checkBackLater')}</Text>
              </View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Squad Banner Component
 */
function SquadBanner({
  squadName,
  memberCount,
  onPress,
}: {
  squadName?: string;
  memberCount?: number;
  onPress: () => void;
}) {
  if (!squadName) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.noSquadBanner}>
        <LinearGradient
          colors={[BATTLE_COLORS.backgroundCard, BATTLE_COLORS.backgroundLight] as const}
          style={styles.noSquadGradient}
        >
          <MaterialCommunityIcons name="account-group" size={24} color={BATTLE_COLORS.lime} />
          <View style={styles.noSquadInfo}>
            <Text style={styles.noSquadTitle}>Join a Squad</Text>
            <Text style={styles.noSquadSubtitle}>Play with friends!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={BATTLE_COLORS.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.squadBanner}>
      <LinearGradient
        colors={[`${BATTLE_COLORS.lime}20`, BATTLE_COLORS.backgroundCard] as const}
        style={styles.squadGradient}
      >
        <MaterialCommunityIcons name="shield-star" size={24} color={BATTLE_COLORS.lime} />
        <View style={styles.squadInfo}>
          <Text style={styles.squadName}>{squadName}</Text>
          <Text style={styles.squadMembers}>{memberCount} members</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={BATTLE_COLORS.textMuted} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Countdown Timer display
function formatTimeRemaining(targetTime: Date): string {
  const now = Date.now();
  const remaining = Math.max(0, targetTime.getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Main Home Screen Component
 */
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { profile } = useAuthStore();
  const { currentSquad, squads, setCurrentSquad, members, fetchMembers } = useSquadStore();
  const { fetchTodayEvent, isLoading } = useEventStore();
  const {
    activePowers,
    fetchActivePowers,
    fetchActiveTargets,
    getMyActivePower,
  } = usePowerStore();
  const {
    currentCrown,
    activeHeadline,
    activeRivalry,
    fetchCrownData,
    isUserCrowned,
  } = useCrownStore();
  const todayEvent = useRealtimeEvent();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('characteristics');
  const [timeRemaining, setTimeRemaining] = useState<string | undefined>();

  // Mock data - replace with real data from stores
  const userLevel = 12;
  const userXP = 1890;
  const xpToNextLevel = 2500;
  const userCoins = 4523;
  const userGems = 150;
  const userRank = 3;

  // Character stats
  const characterStats: StatData[] = [
    { id: 'survive', name: 'Survive', value: 87 },
    { id: 'strength', name: 'Strength', value: 72 },
    { id: 'reflex', name: 'Reflex', value: 65 },
  ];

  // Determine if user has a squad
  const hasSquad = squads.length > 0 && currentSquad !== null;

  // Check if current user is the crown holder
  const userIsCrownHolder = profile && currentSquad
    ? isUserCrowned(profile.id, currentSquad.id)
    : false;

  // Update time remaining
  useEffect(() => {
    const event = todayEvent.event;
    if (!event) {
      setTimeRemaining(undefined);
      return;
    }

    const updateTime = () => {
      const targetTime = new Date(
        todayEvent.status === 'open' ? event.closes_at : event.opens_at
      );
      setTimeRemaining(formatTimeRemaining(targetTime));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [todayEvent.event, todayEvent.status]);

  // Fetch data when squad changes
  useEffect(() => {
    if (currentSquad) {
      fetchTodayEvent(currentSquad.id);
      fetchMembers(currentSquad.id);
      fetchActivePowers(currentSquad.id);
      fetchActiveTargets(currentSquad.id);
      fetchCrownData(currentSquad.id);
    }
  }, [currentSquad]);

  const handleRefresh = useCallback(() => {
    if (currentSquad) {
      fetchTodayEvent(currentSquad.id);
      fetchActivePowers(currentSquad.id);
      fetchActiveTargets(currentSquad.id);
      fetchCrownData(currentSquad.id);
    }
  }, [currentSquad]);

  const handleBattle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (!hasSquad) {
      router.push('/(auth)/squad' as Href);
      return;
    }

    if (todayEvent.status === 'open' && todayEvent.event) {
      const routes: Record<string, string> = {
        LIVE_SELFIE: '/events/live-selfie',
        PRESSURE_TAP: '/events/pressure-tap',
        POLL: '/events/poll',
      };
      router.push(routes[todayEvent.event.event_type] as Href);
    } else if (todayEvent.status === 'submitted' && todayEvent.event) {
      router.push(`/results/${todayEvent.event.id}` as Href);
    } else {
      router.push('/(tabs)/games' as Href);
    }
  };

  const handleAddCoins = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/shop' as Href);
  };

  const handleAddGems = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/shop' as Href);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Open player profile/card modal
  };

  const handleSquadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/squad' as Href);
  };

  const handleCharacterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Open character customization
  };

  return (
    <View style={styles.container}>
      {/* Battle Header */}
      <BattleHeader
        avatarUri={profile?.avatar_url}
        playerName={profile?.display_name || 'Player'}
        level={userLevel}
        xp={userXP}
        xpMax={xpToNextLevel}
        coins={userCoins}
        gems={userGems}
        onAvatarPress={handleAvatarPress}
        onAddCoins={handleAddCoins}
        onAddGems={handleAddGems}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={BATTLE_COLORS.lime}
          />
        }
      >
        {/* Character Display */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <CharacterDisplay
            avatarId={1}
            customAvatarUri={profile?.avatar_url}
            playerName={profile?.display_name || 'Player'}
            title={userIsCrownHolder ? 'Crown Holder' : `Level ${userLevel}`}
            rank={userRank}
            onCharacterPress={handleCharacterPress}
            showRankBadge={true}
            animated={true}
          />
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <CharacterStats
            stats={characterStats}
            overallScore={87}
            matchInfo="M4-M2"
            additionalStats="62-76"
          />
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
        </Animated.View>

        {/* Event Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.eventSection}>
          <EventCard
            event={todayEvent.event}
            status={todayEvent.status}
            timeRemaining={timeRemaining}
            onPress={handleBattle}
          />
        </Animated.View>

        {/* Squad Banner */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.squadSection}>
          <SquadBanner
            squadName={currentSquad?.name}
            memberCount={members.length}
            onPress={handleSquadPress}
          />
        </Animated.View>

        {/* Battle Button */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.battleSection}>
          <BattleButton
            onPress={handleBattle}
            label={!hasSquad ? 'JOIN SQUAD' : todayEvent.status === 'open' ? 'BATTLE' : 'PLAY'}
          />
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BATTLE_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Tab Selector
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: BATTLE_COLORS.backgroundCard,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    overflow: 'hidden',
  },
  tabActive: {
    overflow: 'hidden',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: BATTLE_COLORS.textMuted,
  },
  tabTextActive: {
    color: BATTLE_COLORS.background,
    fontWeight: '700',
  },

  // Event Section
  eventSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  eventCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BATTLE_COLORS.white,
    marginBottom: 4,
  },
  eventLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
  },
  eventLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4444',
    letterSpacing: 0.5,
  },
  eventCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: BATTLE_COLORS.lime,
    letterSpacing: 0.5,
  },
  eventTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  eventXPBadge: {
    backgroundColor: BATTLE_COLORS.lime,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  eventXPText: {
    fontSize: 12,
    fontWeight: '800',
    color: BATTLE_COLORS.background,
  },
  eventNoEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BATTLE_COLORS.white,
  },
  eventNoEventSubtitle: {
    fontSize: 12,
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
  },

  // Squad Section
  squadSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  squadBanner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  squadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  squadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  squadName: {
    fontSize: 14,
    fontWeight: '700',
    color: BATTLE_COLORS.white,
  },
  squadMembers: {
    fontSize: 12,
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
  },
  noSquadBanner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  noSquadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
    borderStyle: 'dashed',
  },
  noSquadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  noSquadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BATTLE_COLORS.lime,
  },
  noSquadSubtitle: {
    fontSize: 12,
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
  },

  // Battle Button
  battleSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  battleButtonTouchable: {
    width: '100%',
  },
  battleButtonContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  battleButtonGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    backgroundColor: BATTLE_COLORS.lime,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: BATTLE_COLORS.lime,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
    }),
  },
  battleButtonOuter: {
    width: '100%',
    position: 'relative',
  },
  battleButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BATTLE_COLORS.limeLight,
    borderBottomWidth: 0,
  },
  battleButton3DBottom: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#5A7A15',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  battleButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: BATTLE_COLORS.background,
    letterSpacing: 2,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});

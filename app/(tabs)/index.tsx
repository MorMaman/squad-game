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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  interpolate,
  runOnJS,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import { Avatar } from '../../src/components/Avatar';
import { useAuthStore } from '../../src/store/authStore';
import { useSquadStore } from '../../src/store/squadStore';
import { useEventStore } from '../../src/store/eventStore';
import { useRealtimeEvent } from '../../src/hooks/useRealtimeEvent';
import { EventType } from '../../src/types';

// Game Color Palette - Exciting and vibrant
const COLORS = {
  // Background colors
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',

  // Primary action colors
  GAME_ORANGE: '#FF6B00',
  GAME_CORAL: '#FF4757',
  ELECTRIC_PURPLE: '#9B59FF',

  // Reward colors
  GOLD: '#FFD700',
  GOLD_GLOW: '#FFA500',

  // Energy colors
  ELECTRIC_CYAN: '#00D4FF',
  NEON_GREEN: '#00FF87',
  POWER_BLUE: '#3742FA',

  // Accent colors
  PINK_GLOW: '#FF2D92',
  FIRE_RED: '#FF3838',
  ICE_WHITE: '#F0F8FF',

  // Text colors
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',
};

// Level titles based on level
const getLevelTitle = (level: number): string => {
  if (level >= 50) return 'Mythic Legend';
  if (level >= 40) return 'Hall of Famer';
  if (level >= 30) return 'Squad Legend';
  if (level >= 25) return 'Elite Player';
  if (level >= 20) return 'Squad Veteran';
  if (level >= 15) return 'Challenge Seeker';
  if (level >= 10) return 'Competitor';
  if (level >= 5) return 'Rising Star';
  if (level >= 2) return 'Rookie';
  return 'Newbie';
};

// Event type configurations
const EVENT_CONFIG: Record<EventType, { icon: string; colors: string[]; title: string; xpReward: number }> = {
  POLL: {
    icon: 'analytics',
    colors: [COLORS.ELECTRIC_PURPLE, '#A855F7'],
    title: 'PREDICTION TIME',
    xpReward: 30,
  },
  LIVE_SELFIE: {
    icon: 'camera',
    colors: [COLORS.PINK_GLOW, '#F472B6'],
    title: 'SELFIE CHALLENGE',
    xpReward: 25,
  },
  PRESSURE_TAP: {
    icon: 'flash',
    colors: [COLORS.ELECTRIC_CYAN, '#22D3EE'],
    title: 'PRESSURE TAP',
    xpReward: 35,
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Sparkle component for XP preview
function SparkleEffect({ style }: { style?: any }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const randomDelay = Math.random() * 2000;

    opacity.value = withDelay(
      randomDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      randomDelay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(0.5, { duration: 400 })
        ),
        -1,
        false
      )
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.sparkle, style, animatedStyle]}>
      <Ionicons name="sparkles" size={12} color={COLORS.GOLD} />
    </Animated.View>
  );
}

// Pulsing Glow Border for Daily Challenge Card
function PulsingGlowCard({ children, urgencyLevel }: { children: React.ReactNode; urgencyLevel: 'normal' | 'urgent' | 'critical' }) {
  const glowOpacity = useSharedValue(0.3);
  const borderScale = useSharedValue(1);

  const glowColors = {
    normal: [COLORS.GAME_ORANGE, COLORS.GAME_CORAL],
    urgent: [COLORS.GAME_CORAL, COLORS.FIRE_RED],
    critical: [COLORS.FIRE_RED, '#FF0000'],
  };

  useEffect(() => {
    const speed = urgencyLevel === 'critical' ? 500 : urgencyLevel === 'urgent' ? 800 : 1500;

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: speed, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: speed, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    borderScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: speed * 1.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: speed * 1.5, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [urgencyLevel]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: borderScale.value }],
  }));

  return (
    <View style={styles.glowCardContainer}>
      <Animated.View style={[styles.glowBorder, glowStyle]}>
        <LinearGradient
          colors={glowColors[urgencyLevel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowGradient}
        />
      </Animated.View>
      <View style={styles.glowCardInner}>
        {children}
      </View>
    </View>
  );
}

// Countdown Timer with color transitions
function GameCountdown({ targetTime, isClosing }: { targetTime: Date; isClosing: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime.getTime() - now);
      const totalSeconds = Math.floor(remaining / 1000);

      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        total: remaining,
      });

      // Haptic tick for final 10 seconds
      if (remaining <= 10000 && remaining > 0 && isClosing) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTime, isClosing]);

  // Urgency-based pulsing
  useEffect(() => {
    if (timeLeft.total < 3600000 && isClosing) { // Less than 1 hour
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [timeLeft.total, isClosing]);

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  // Determine color based on urgency
  const getTimerColor = () => {
    if (!isClosing) return COLORS.ELECTRIC_CYAN;
    if (timeLeft.total < 3600000) return COLORS.FIRE_RED; // Less than 1 hour
    if (timeLeft.total < 14400000) return COLORS.GAME_ORANGE; // Less than 4 hours
    return COLORS.ELECTRIC_CYAN;
  };

  const timerColor = getTimerColor();

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.countdownContainer, pulseStyle]}>
      <Text style={[styles.countdownLabel, { color: timerColor }]}>
        {isClosing ? 'ENDS IN' : 'STARTS IN'}
      </Text>
      <View style={styles.countdownRow}>
        <View style={[styles.countdownBox, { borderColor: timerColor }]}>
          <Text style={[styles.countdownNumber, { color: timerColor }]}>{formatNum(timeLeft.hours)}</Text>
          <Text style={styles.countdownUnit}>HRS</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: timerColor }]}>:</Text>
        <View style={[styles.countdownBox, { borderColor: timerColor }]}>
          <Text style={[styles.countdownNumber, { color: timerColor }]}>{formatNum(timeLeft.minutes)}</Text>
          <Text style={styles.countdownUnit}>MIN</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: timerColor }]}>:</Text>
        <View style={[styles.countdownBox, { borderColor: timerColor }]}>
          <Text style={[styles.countdownNumber, { color: timerColor }]}>{formatNum(timeLeft.seconds)}</Text>
          <Text style={styles.countdownUnit}>SEC</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Play Now Button with glow and bounce
function PlayNowButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Continuous subtle pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 })
      ),
      -1,
      false
    );

    // Continuous bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: bounce.value },
    ],
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
    >
      <Animated.View style={buttonStyle}>
        <View style={styles.playButtonContainer}>
          <Animated.View style={[styles.playButtonGlow, glowStyle]} />
          <LinearGradient
            colors={[COLORS.NEON_GREEN, '#00CC6A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButton}
          >
            <Text style={styles.playButtonText}>PLAY NOW</Text>
            <Ionicons name="arrow-forward" size={24} color={COLORS.DARK_NAVY} />
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Streak Badge with fire animation
function AnimatedStreakBadge({ days }: { days: number }) {
  const flameScale = useSharedValue(1);
  const flameRotation = useSharedValue(0);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      false
    );

    flameRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 200 }),
        withTiming(5, { duration: 200 }),
        withTiming(-5, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotation.value}deg` },
    ],
  }));

  const getFlameColor = () => {
    if (days >= 100) return COLORS.GOLD;
    if (days >= 30) return COLORS.FIRE_RED;
    if (days >= 7) return COLORS.GAME_ORANGE;
    return COLORS.GAME_ORANGE;
  };

  return (
    <View style={styles.streakBadge}>
      <Animated.View style={flameStyle}>
        <Ionicons name="flame" size={22} color={getFlameColor()} />
      </Animated.View>
      <Text style={[styles.streakNumber, { color: getFlameColor() }]}>{days}</Text>
    </View>
  );
}

// XP Progress Bar with milestones
function XPProgressBar({ current, max, level }: { current: number; max: number; level: number }) {
  const progress = Math.min((current / max) * 100, 100);
  const progressWidth = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Glow when near completion
    if (progress > 80) {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  return (
    <View style={styles.xpBarContainer}>
      <View style={styles.xpBarHeader}>
        <Text style={styles.xpBarLabel}>XP TO LEVEL {level + 1}</Text>
        <Text style={styles.xpBarValue}>{current.toLocaleString()} / {max.toLocaleString()}</Text>
      </View>
      <View style={styles.xpBarTrack}>
        {/* Milestone markers */}
        <View style={[styles.milestone, { left: '25%' }]} />
        <View style={[styles.milestone, { left: '50%' }]} />
        <View style={[styles.milestone, { left: '75%' }]} />

        <Animated.View style={[styles.xpBarFill, progressStyle]}>
          <LinearGradient
            colors={[COLORS.ELECTRIC_CYAN, COLORS.ELECTRIC_PURPLE, COLORS.PINK_GLOW]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.xpBarGradient}
          />
          {progress > 80 && (
            <Animated.View style={[styles.xpBarGlow, glowStyle]} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// Animated Number Display
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const duration = 800;
    const startValue = displayValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setDisplayValue(Math.round(startValue + (value - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Pop effect
    scale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    animate();
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.animatedNumber, animatedStyle]}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </Animated.Text>
  );
}

// Quick Action Button with bounce
function QuickActionButton({
  icon,
  label,
  color,
  onPress
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.quickActionWrapper}
    >
      <Animated.View style={[styles.quickActionButton, { backgroundColor: color }, buttonStyle]}>
        <Ionicons name={icon as any} size={28} color="#FFFFFF" />
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Player Stats Header
function PlayerStatsHeader({
  profile,
  level,
  xp,
  xpToNext,
  streak,
  onPress
}: {
  profile: any;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <TouchableOpacity style={styles.playerHeader} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.playerLeft}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.display_name}
              size="medium"
            />
            <LinearGradient
              colors={[COLORS.ELECTRIC_PURPLE, COLORS.PINK_GLOW]}
              style={styles.levelBadge}
            >
              <Text style={styles.levelBadgeText}>{level}</Text>
            </LinearGradient>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>@{profile?.display_name}</Text>
            <Text style={styles.playerTitle}>{getLevelTitle(level)}</Text>
          </View>
        </View>
        <View style={styles.playerRight}>
          <AnimatedStreakBadge days={streak} />
        </View>
      </TouchableOpacity>

      <XPProgressBar current={xp} max={xpToNext} level={level} />
    </Animated.View>
  );
}

// XP Reward Preview with sparkles
function XPRewardPreview({ amount }: { amount: number }) {
  return (
    <View style={styles.xpRewardContainer}>
      <SparkleEffect style={{ position: 'absolute', top: -5, left: -5 }} />
      <SparkleEffect style={{ position: 'absolute', top: -3, right: 0 }} />
      <SparkleEffect style={{ position: 'absolute', bottom: -5, left: 10 }} />
      <LinearGradient
        colors={[COLORS.GOLD, COLORS.GOLD_GLOW]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.xpRewardBadge}
      >
        <Ionicons name="star" size={16} color={COLORS.DARK_NAVY} />
        <Text style={styles.xpRewardText}>+{amount} XP</Text>
      </LinearGradient>
    </View>
  );
}

// Daily Challenge Card
function DailyChallengeCard({
  event,
  status,
  submissionCount,
  membersCount,
  onParticipate,
  onViewResults,
  streak,
}: {
  event: any;
  status: string;
  submissionCount: number;
  membersCount: number;
  onParticipate: () => void;
  onViewResults: () => void;
  streak: number;
}) {
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  if (!event) {
    return (
      <Animated.View
        entering={ZoomIn.duration(500).springify()}
        style={styles.challengeCard}
      >
        <LinearGradient
          colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
          style={styles.challengeCardGradient}
        >
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.TEXT_MUTED} />
            <Text style={styles.emptyStateTitle}>No Challenge Today</Text>
            <Text style={styles.emptyStateSubtitle}>Check back later for the next battle!</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  const config = EVENT_CONFIG[event.event_type as EventType];
  const urgencyLevel = status === 'open'
    ? (new Date(event.closes_at).getTime() - Date.now() < 3600000 ? 'critical' :
       new Date(event.closes_at).getTime() - Date.now() < 14400000 ? 'urgent' : 'normal')
    : 'normal';

  return (
    <Animated.View entering={ZoomIn.duration(500).springify()}>
      <Animated.View style={breatheStyle}>
        <PulsingGlowCard urgencyLevel={status === 'open' ? urgencyLevel : 'normal'}>
          <LinearGradient
            colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
            style={styles.challengeCardGradient}
          >
            {/* Event Icon */}
            <Animated.View entering={ZoomIn.delay(200).duration(400)}>
              <LinearGradient
                colors={config.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eventIconContainer}
              >
                <Ionicons name={config.icon as any} size={40} color="#fff" />
              </LinearGradient>
            </Animated.View>

            {/* Event Title */}
            <Animated.Text
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.eventTitle}
            >
              {config.title}
            </Animated.Text>

            {/* Status Badge */}
            {status === 'open' && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={styles.liveBadge}
              >
                <PulsingDot />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </Animated.View>
            )}

            {status === 'not_opened' && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={styles.upcomingBadge}
              >
                <Ionicons name="time-outline" size={16} color={COLORS.GOLD} />
                <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
              </Animated.View>
            )}

            {status === 'submitted' && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={styles.completedBadge}
              >
                <Ionicons name="checkmark-circle" size={16} color={COLORS.NEON_GREEN} />
                <Text style={styles.completedBadgeText}>COMPLETED</Text>
              </Animated.View>
            )}

            {/* Countdown Timer */}
            {(status === 'open' || status === 'not_opened') && (
              <Animated.View entering={FadeInDown.delay(500).duration(400)}>
                <GameCountdown
                  targetTime={new Date(status === 'open' ? event.closes_at : event.opens_at)}
                  isClosing={status === 'open'}
                />
              </Animated.View>
            )}

            {/* XP Reward Preview */}
            {status === 'open' && (
              <Animated.View entering={FadeInDown.delay(600).duration(400)}>
                <XPRewardPreview amount={config.xpReward} />
              </Animated.View>
            )}

            {/* Streak Counter */}
            {streak > 0 && status === 'open' && (
              <Animated.View
                entering={SlideInRight.delay(700).duration(400)}
                style={styles.streakCounter}
              >
                <Ionicons name="flame" size={18} color={COLORS.GAME_ORANGE} />
                <Text style={styles.streakCounterText}>{streak} Day Streak!</Text>
              </Animated.View>
            )}

            {/* Progress indicator */}
            {status === 'open' && membersCount > 0 && (
              <Animated.View
                entering={FadeInDown.delay(800).duration(400)}
                style={styles.progressSection}
              >
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(submissionCount / membersCount) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {submissionCount}/{membersCount} squad members played
                </Text>
              </Animated.View>
            )}

            {/* Action Buttons */}
            {status === 'open' && (
              <Animated.View entering={FadeInUp.delay(900).duration(400)}>
                <PlayNowButton onPress={onParticipate} />
              </Animated.View>
            )}

            {status === 'submitted' && (
              <Animated.View entering={FadeInUp.delay(600).duration(400)}>
                <TouchableOpacity
                  style={styles.viewResultsButton}
                  onPress={onViewResults}
                >
                  <Text style={styles.viewResultsText}>View Results</Text>
                  <Ionicons name="trophy" size={20} color={COLORS.GOLD} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {status === 'closed' && (
              <View style={styles.missedContainer}>
                <Text style={styles.missedText}>You missed this challenge</Text>
                <Text style={styles.missedSubtext}>The comeback starts now!</Text>
              </View>
            )}
          </LinearGradient>
        </PulsingGlowCard>
      </Animated.View>
    </Animated.View>
  );
}

// Pulsing Dot for LIVE indicator
function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View style={[styles.pulsingDotOuter, pulseStyle]} />
      <View style={styles.pulsingDotInner} />
    </View>
  );
}

// Background Particles
function BackgroundParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => i);

  return (
    <View style={styles.particlesContainer}>
      {particles.map((i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

function Particle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  const startX = (index * 47) % SCREEN_WIDTH;
  const startY = (index * 89) % 600;
  const size = 2 + (index % 4);

  useEffect(() => {
    const delay = index * 200;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration: 10000 + index * 500, easing: Easing.linear }),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.2, { duration: 2000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          backgroundColor: index % 3 === 0 ? COLORS.ELECTRIC_CYAN :
                          index % 3 === 1 ? COLORS.ELECTRIC_PURPLE : COLORS.PINK_GLOW,
        },
        particleStyle,
      ]}
    />
  );
}

// Player Card Modal
function PlayerCardModal({
  visible,
  onClose,
  profile,
  level,
  xp,
  xpToNext,
  streak,
  rank,
}: {
  visible: boolean;
  onClose: () => void;
  profile: { display_name: string; avatar_url: string | null } | null;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  rank: number;
}) {
  if (!profile) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={ZoomIn.duration(300).springify()}
          style={styles.playerCardModal}
        >
          <LinearGradient
            colors={[COLORS.ELECTRIC_PURPLE, COLORS.PINK_GLOW, COLORS.ELECTRIC_CYAN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playerCardGradientBorder}
          >
            <View style={styles.playerCardInner}>
              <View style={styles.playerCardHeader}>
                <View style={styles.playerCardAvatarContainer}>
                  <Avatar uri={profile.avatar_url} name={profile.display_name} size="xlarge" />
                  <LinearGradient
                    colors={[COLORS.ELECTRIC_PURPLE, COLORS.PINK_GLOW]}
                    style={styles.levelBadgeLarge}
                  >
                    <Text style={styles.levelBadgeTextLarge}>{level}</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.playerCardName}>@{profile.display_name}</Text>
                <Text style={styles.playerCardTitle}>Level {level} - {getLevelTitle(level)}</Text>
              </View>

              <XPProgressBar current={xp} max={xpToNext} level={level} />

              <View style={styles.playerCardStats}>
                <View style={styles.playerCardStat}>
                  <Ionicons name="trophy" size={24} color={COLORS.GOLD} />
                  <Text style={styles.playerCardStatValue}>#{rank}</Text>
                  <Text style={styles.playerCardStatLabel}>Rank</Text>
                </View>
                <View style={styles.playerCardStat}>
                  <Ionicons name="flame" size={24} color={COLORS.GAME_ORANGE} />
                  <Text style={styles.playerCardStatValue}>{streak}</Text>
                  <Text style={styles.playerCardStatLabel}>Streak</Text>
                </View>
                <View style={styles.playerCardStat}>
                  <Ionicons name="star" size={24} color={COLORS.ELECTRIC_PURPLE} />
                  <Text style={styles.playerCardStatValue}>{xp}</Text>
                  <Text style={styles.playerCardStatLabel}>Total XP</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.playerCardCloseButton} onPress={onClose}>
                <Text style={styles.playerCardCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { currentSquad, squads, setCurrentSquad, members } = useSquadStore();
  const { fetchTodayEvent, isLoading } = useEventStore();
  const todayEvent = useRealtimeEvent();
  const [showSquadPicker, setShowSquadPicker] = useState(false);
  const [showPlayerCard, setShowPlayerCard] = useState(false);

  // Mock data for demo - replace with real data from stores
  const userLevel = 12;
  const userXP = 1890;
  const xpToNextLevel = 2500;
  const userStreak = 7;
  const userRank = 3;

  const handleSquadSelect = (squad: typeof currentSquad) => {
    if (squad) {
      setCurrentSquad(squad);
      setShowSquadPicker(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  useEffect(() => {
    if (currentSquad) {
      fetchTodayEvent(currentSquad.id);
    }
  }, [currentSquad]);

  const handleParticipate = () => {
    if (!todayEvent.event) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const routes: Record<string, string> = {
      LIVE_SELFIE: '/events/live-selfie',
      PRESSURE_TAP: '/events/pressure-tap',
      POLL: '/events/poll',
    };

    router.push(routes[todayEvent.event.event_type] as Href);
  };

  const handleViewResults = () => {
    if (!todayEvent.event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/results/${todayEvent.event.id}` as Href);
  };

  const handleRefresh = () => {
    if (currentSquad) {
      fetchTodayEvent(currentSquad.id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.DARK_NAVY, '#0D1234', COLORS.DARK_NAVY]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background particles */}
      <BackgroundParticles />

      <View style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={COLORS.ELECTRIC_CYAN}
            />
          }
        >
          {/* Player Stats Header */}
          <PlayerStatsHeader
            profile={profile}
            level={userLevel}
            xp={userXP}
            xpToNext={xpToNextLevel}
            streak={userStreak}
            onPress={() => setShowPlayerCard(true)}
          />

          {/* Squad Selector */}
          {squads.length > 1 && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <TouchableOpacity
                style={styles.squadSelector}
                onPress={() => setShowSquadPicker(true)}
              >
                <Ionicons name="people" size={16} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.squadName}>{currentSquad?.name}</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Section: Daily Challenge */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.sectionTitle}
            >
              TODAY'S CHALLENGE
            </Animated.Text>
            <DailyChallengeCard
              event={todayEvent.event}
              status={todayEvent.status}
              submissionCount={todayEvent.submissionCount || 0}
              membersCount={members.length || 6}
              onParticipate={handleParticipate}
              onViewResults={handleViewResults}
              streak={userStreak}
            />
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.sectionTitle}
            >
              QUICK ACTIONS
            </Animated.Text>
            <Animated.View
              entering={FadeInDown.delay(500).duration(400)}
              style={styles.quickActionsGrid}
            >
              <QuickActionButton
                icon="trophy"
                label="Leaderboard"
                color={COLORS.GOLD}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/leaderboard' as Href);
                }}
              />
              <QuickActionButton
                icon="ribbon"
                label="Badges"
                color={COLORS.ELECTRIC_PURPLE}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/badges' as Href);
                }}
              />
              <QuickActionButton
                icon="people"
                label="Squad"
                color={COLORS.ELECTRIC_CYAN}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/squad' as Href);
                }}
              />
              <QuickActionButton
                icon="stats-chart"
                label="Stats"
                color={COLORS.NEON_GREEN}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/stats' as Href);
                }}
              />
            </Animated.View>
          </View>

          {/* Invite Section */}
          {currentSquad && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={styles.section}
            >
              <View style={styles.inviteCard}>
                <LinearGradient
                  colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
                  style={styles.inviteCardGradient}
                >
                  <View style={styles.inviteContent}>
                    <View style={styles.inviteLeft}>
                      <Ionicons name="people-circle" size={36} color={COLORS.ELECTRIC_PURPLE} />
                      <View style={styles.inviteTextContainer}>
                        <Text style={styles.inviteTitle}>Invite Friends</Text>
                        <Text style={styles.inviteSubtitle}>Grow your squad!</Text>
                      </View>
                    </View>
                    <View style={styles.inviteCodeContainer}>
                      <Text style={styles.inviteCode}>{currentSquad.invite_code}</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          // TODO: Copy to clipboard
                        }}
                      >
                        <Ionicons name="copy" size={18} color={COLORS.ELECTRIC_PURPLE} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* Judge Button if applicable */}
          {todayEvent.event?.judge_id === profile?.id && (
            <Animated.View
              entering={FadeInDown.delay(700).duration(400)}
              style={styles.section}
            >
              <TouchableOpacity
                style={styles.judgeCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/judge');
                }}
              >
                <LinearGradient
                  colors={[COLORS.GOLD, COLORS.GOLD_GLOW]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.judgeCardGradient}
                >
                  <Ionicons name="hammer" size={24} color={COLORS.DARK_NAVY} />
                  <Text style={styles.judgeCardText}>You're the Judge Today!</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.DARK_NAVY} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Squad Picker Modal */}
        <Modal
          visible={showSquadPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSquadPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSquadPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Switch Squad</Text>
              {squads.map((squad) => (
                <TouchableOpacity
                  key={squad.id}
                  style={[
                    styles.squadOption,
                    squad.id === currentSquad?.id && styles.squadOptionActive,
                  ]}
                  onPress={() => handleSquadSelect(squad)}
                >
                  <Ionicons
                    name={squad.id === currentSquad?.id ? 'people' : 'people-outline'}
                    size={24}
                    color={squad.id === currentSquad?.id ? COLORS.ELECTRIC_PURPLE : COLORS.TEXT_MUTED}
                  />
                  <Text
                    style={[
                      styles.squadOptionText,
                      squad.id === currentSquad?.id && styles.squadOptionTextActive,
                    ]}
                  >
                    {squad.name}
                  </Text>
                  {squad.id === currentSquad?.id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.ELECTRIC_PURPLE} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addSquadOption}
                onPress={() => {
                  setShowSquadPicker(false);
                  router.push('/(auth)/squad' as Href);
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.ELECTRIC_PURPLE} />
                <Text style={styles.addSquadOptionText}>Join or Create Squad</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Player Card Modal */}
        <PlayerCardModal
          visible={showPlayerCard}
          onClose={() => setShowPlayerCard(false)}
          profile={profile}
          level={userLevel}
          xp={userXP}
          xpToNext={xpToNextLevel}
          streak={userStreak}
          rank={userRank}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_NAVY,
  },
  safeArea: {
    flex: 1,
  },

  // Particles
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },

  // Player Header
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.DARK_NAVY,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  playerInfo: {
    gap: 2,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  playerTitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  playerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Streak Badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '800',
  },

  // XP Bar
  xpBarContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  xpBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 1,
  },
  xpBarValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  xpBarGradient: {
    flex: 1,
  },
  xpBarGlow: {
    position: 'absolute',
    right: 0,
    top: -4,
    bottom: -4,
    width: 20,
    backgroundColor: COLORS.NEON_GREEN,
    borderRadius: 4,
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Squad Selector
  squadSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.DEEP_PURPLE,
    borderRadius: 12,
  },
  squadName: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Glow Card
  glowCardContainer: {
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  glowCardInner: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Challenge Card
  challengeCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  challengeCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },

  // Status Badges
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 56, 56, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.FIRE_RED,
    letterSpacing: 1,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.GOLD,
    letterSpacing: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.NEON_GREEN,
    letterSpacing: 1,
  },

  // Pulsing Dot
  pulsingDotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.FIRE_RED,
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.FIRE_RED,
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownBox: {
    backgroundColor: COLORS.DARK_NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 64,
    alignItems: 'center',
    borderWidth: 1,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
    letterSpacing: 1,
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: '800',
  },

  // XP Reward
  xpRewardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  xpRewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
  },
  sparkle: {
    position: 'absolute',
  },

  // Streak Counter
  streakCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  streakCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GAME_ORANGE,
  },

  // Progress
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.ELECTRIC_CYAN,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },

  // Play Button
  playButtonContainer: {
    position: 'relative',
  },
  playButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: COLORS.NEON_GREEN,
    borderRadius: 26,
    opacity: 0.4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 12,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
    letterSpacing: 1,
  },

  // View Results
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  viewResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GOLD,
  },

  // Missed
  missedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  missedText: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
    marginBottom: 4,
  },
  missedSubtext: {
    fontSize: 14,
    color: COLORS.GAME_CORAL,
    fontWeight: '600',
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionWrapper: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  quickActionButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },

  // Animated Number
  animatedNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },

  // Invite Card
  inviteCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inviteCardGradient: {
    padding: 16,
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteTextContainer: {
    gap: 2,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  inviteSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_NAVY,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },

  // Judge Card
  judgeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  judgeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  judgeCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.DARK_NAVY,
    flex: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.DEEP_PURPLE,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  squadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.DARK_NAVY,
  },
  squadOptionActive: {
    backgroundColor: 'rgba(155, 89, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.ELECTRIC_PURPLE,
  },
  squadOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  squadOptionTextActive: {
    color: COLORS.ELECTRIC_PURPLE,
    fontWeight: '600',
  },
  addSquadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.ELECTRIC_PURPLE,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addSquadOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ELECTRIC_PURPLE,
  },

  // Player Card Modal
  playerCardModal: {
    width: '100%',
    maxWidth: 340,
  },
  playerCardGradientBorder: {
    borderRadius: 24,
    padding: 3,
  },
  playerCardInner: {
    backgroundColor: COLORS.DEEP_PURPLE,
    borderRadius: 21,
    padding: 24,
    alignItems: 'center',
  },
  playerCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playerCardAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  levelBadgeLarge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.DEEP_PURPLE,
  },
  levelBadgeTextLarge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  playerCardName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  playerCardTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  playerCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerCardStat: {
    alignItems: 'center',
    gap: 6,
  },
  playerCardStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  playerCardStatLabel: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  playerCardCloseButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.DARK_NAVY,
    borderRadius: 12,
  },
  playerCardCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
});

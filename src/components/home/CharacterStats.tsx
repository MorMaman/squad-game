/**
 * CharacterStats.tsx
 * Battle Game UI - Character stats display with circular progress indicators
 * Shows stats like Survive, Strength, Reflex with animated circular progress
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { BATTLE_COLORS } from './BattleHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface StatData {
  id: string;
  name: string;
  value: number; // 0-100
  icon?: string;
  color?: string;
}

export interface CharacterStatsProps {
  stats: StatData[];
  overallScore?: number;
  matchInfo?: string;
  additionalStats?: string;
}

/**
 * Circular Progress Ring Component
 */
function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 6,
  color = BATTLE_COLORS.lime,
  delay = 0,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  delay?: number;
}) {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withDelay(
      delay,
      withTiming(progress / 100, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Defs>
        <SvgGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={BATTLE_COLORS.limeLight} />
        </SvgGradient>
      </Defs>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={BATTLE_COLORS.backgroundCard}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#gradient-${color})`}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  stat,
  index,
}: {
  stat: StatData;
  index: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getStatColor = () => {
    if (stat.color) return stat.color;
    if (stat.value >= 80) return BATTLE_COLORS.lime;
    if (stat.value >= 60) return BATTLE_COLORS.cyan;
    if (stat.value >= 40) return BATTLE_COLORS.gold;
    return '#FF6B6B';
  };

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <LinearGradient
        colors={[BATTLE_COLORS.backgroundCard, BATTLE_COLORS.backgroundLight]}
        style={styles.statCardGradient}
      >
        {/* Circular Progress */}
        <View style={styles.progressContainer}>
          <CircularProgress
            progress={stat.value}
            size={56}
            strokeWidth={5}
            color={getStatColor()}
            delay={index * 150}
          />
          <View style={styles.progressValueContainer}>
            <Text style={[styles.progressValue, { color: getStatColor() }]}>
              {stat.value}
            </Text>
          </View>
        </View>

        {/* Stat Name */}
        <Text style={styles.statName} numberOfLines={1}>
          {stat.name}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

/**
 * Overall Score Display
 */
function OverallScoreDisplay({
  score,
  matchInfo,
  additionalStats,
}: {
  score?: number;
  matchInfo?: string;
  additionalStats?: string;
}) {
  const scale = useSharedValue(0.9);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    glow.value = withSequence(
      withTiming(0.7, { duration: 800 }),
      withTiming(0.4, { duration: 800 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!score && !matchInfo) return null;

  return (
    <Animated.View style={[styles.overallContainer, animatedStyle]}>
      {score !== undefined && (
        <View style={styles.overallScoreBox}>
          <Text style={styles.overallScoreValue}>{score}%</Text>
          <Text style={styles.overallScoreLabel}>Overall</Text>
        </View>
      )}

      {matchInfo && (
        <View style={styles.matchInfoBox}>
          <Text style={styles.matchInfoValue}>{matchInfo}</Text>
          <Text style={styles.matchInfoLabel}>Match</Text>
        </View>
      )}

      {additionalStats && (
        <View style={styles.additionalStatsBox}>
          <Text style={styles.additionalStatsValue}>{additionalStats}</Text>
          <Text style={styles.additionalStatsLabel}>W-L</Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * CharacterStats - Main component
 */
export function CharacterStats({
  stats,
  overallScore,
  matchInfo,
  additionalStats,
}: CharacterStatsProps) {
  return (
    <View style={styles.container}>
      {/* Overall Score Section */}
      <OverallScoreDisplay
        score={overallScore}
        matchInfo={matchInfo}
        additionalStats={additionalStats}
      />

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={stat.id} stat={stat} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Overall Score
  overallContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: BATTLE_COLORS.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },
  overallScoreBox: {
    alignItems: 'center',
  },
  overallScoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: BATTLE_COLORS.lime,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(163, 230, 53, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
    }),
  },
  overallScoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchInfoBox: {
    alignItems: 'center',
  },
  matchInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BATTLE_COLORS.cyan,
  },
  matchInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  additionalStatsBox: {
    alignItems: 'center',
  },
  additionalStatsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BATTLE_COLORS.gold,
  },
  additionalStatsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BATTLE_COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  // Stat Card
  statCard: {
    width: (SCREEN_WIDTH - 56) / 3,
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
  statCardGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BATTLE_COLORS.border,
  },

  // Progress
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressValueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Stat Name
  statName: {
    fontSize: 11,
    fontWeight: '600',
    color: BATTLE_COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default CharacterStats;

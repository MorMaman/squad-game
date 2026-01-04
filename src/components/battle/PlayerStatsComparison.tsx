/**
 * PlayerStatsComparison.tsx
 * Side-by-side stats display for VS Battle screen
 * Shows health bars, attack power, defense with animated entrance
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { GAME_COLORS } from '../../theme/gameColors';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed?: number;
  special?: number;
}

export interface PlayerStatsComparisonProps {
  /** Left player (your) stats */
  leftStats: PlayerStats;
  /** Right player (opponent) stats */
  rightStats: PlayerStats;
  /** Left player name */
  leftName?: string;
  /** Right player name */
  rightName?: string;
  /** Delay before entrance animation (ms) */
  entranceDelay?: number;
  /** Left player accent color */
  leftColor?: string;
  /** Right player accent color */
  rightColor?: string;
}

interface StatRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  leftValue: number;
  rightValue: number;
  maxValue?: number;
  isBar?: boolean;
  leftColor: string;
  rightColor: string;
  delay: number;
}

function StatRow({
  icon,
  label,
  leftValue,
  rightValue,
  maxValue,
  isBar = false,
  leftColor,
  rightColor,
  delay,
}: StatRowProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const leftBarWidth = useSharedValue(0);
  const rightBarWidth = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    if (isBar && maxValue) {
      leftBarWidth.value = withDelay(
        delay + 200,
        withTiming((leftValue / maxValue) * 100, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );
      rightBarWidth.value = withDelay(
        delay + 200,
        withTiming((rightValue / maxValue) * 100, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [delay, isBar, leftValue, rightValue, maxValue]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const leftBarStyle = useAnimatedStyle(() => ({
    width: `${leftBarWidth.value}%`,
  }));

  const rightBarStyle = useAnimatedStyle(() => ({
    width: `${rightBarWidth.value}%`,
  }));

  const leftWins = leftValue > rightValue;
  const rightWins = rightValue > leftValue;

  return (
    <Animated.View style={[styles.statRow, rowStyle]}>
      {/* Left stat */}
      <View style={styles.statSide}>
        {isBar ? (
          <View style={styles.barContainer}>
            <View style={styles.barBackground}>
              <Animated.View
                style={[
                  styles.barFill,
                  styles.barFillLeft,
                  { backgroundColor: leftColor },
                  leftBarStyle,
                ]}
              />
            </View>
            <Text style={[styles.barValue, leftWins && styles.winningValue]}>
              {leftValue}
            </Text>
          </View>
        ) : (
          <Text style={[styles.statValue, leftWins && styles.winningValue]}>
            {leftValue}
          </Text>
        )}
      </View>

      {/* Center icon and label */}
      <View style={styles.statCenter}>
        <Ionicons name={icon} size={20} color={GAME_COLORS.accent.ice} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      {/* Right stat */}
      <View style={styles.statSide}>
        {isBar ? (
          <View style={styles.barContainer}>
            <Text style={[styles.barValue, rightWins && styles.winningValue]}>
              {rightValue}
            </Text>
            <View style={styles.barBackground}>
              <Animated.View
                style={[
                  styles.barFill,
                  styles.barFillRight,
                  { backgroundColor: rightColor },
                  rightBarStyle,
                ]}
              />
            </View>
          </View>
        ) : (
          <Text style={[styles.statValue, rightWins && styles.winningValue]}>
            {rightValue}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export function PlayerStatsComparison({
  leftStats,
  rightStats,
  leftName,
  rightName,
  entranceDelay = 0,
  leftColor = '#A3E635',
  rightColor = '#EF4444',
}: PlayerStatsComparisonProps) {
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);

  useEffect(() => {
    containerOpacity.value = withDelay(
      entranceDelay,
      withTiming(1, { duration: 400 })
    );
    containerTranslateY.value = withDelay(
      entranceDelay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
  }, [entranceDelay]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const baseDelay = entranceDelay + 200;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Header with player names */}
      {(leftName || rightName) && (
        <View style={styles.header}>
          <Text style={[styles.headerName, { color: leftColor }]}>
            {leftName || 'You'}
          </Text>
          <Text style={styles.headerVs}>STATS</Text>
          <Text style={[styles.headerName, { color: rightColor }]}>
            {rightName || 'Opponent'}
          </Text>
        </View>
      )}

      {/* Stats rows */}
      <View style={styles.statsContainer}>
        <StatRow
          icon="heart"
          label="HP"
          leftValue={leftStats.health}
          rightValue={rightStats.health}
          maxValue={Math.max(leftStats.maxHealth, rightStats.maxHealth)}
          isBar
          leftColor={leftColor}
          rightColor={rightColor}
          delay={baseDelay}
        />

        <StatRow
          icon="flash"
          label="ATK"
          leftValue={leftStats.attack}
          rightValue={rightStats.attack}
          leftColor={leftColor}
          rightColor={rightColor}
          delay={baseDelay + 100}
        />

        <StatRow
          icon="shield"
          label="DEF"
          leftValue={leftStats.defense}
          rightValue={rightStats.defense}
          leftColor={leftColor}
          rightColor={rightColor}
          delay={baseDelay + 200}
        />

        {leftStats.speed !== undefined && rightStats.speed !== undefined && (
          <StatRow
            icon="speedometer"
            label="SPD"
            leftValue={leftStats.speed}
            rightValue={rightStats.speed}
            leftColor={leftColor}
            rightColor={rightColor}
            delay={baseDelay + 300}
          />
        )}

        {leftStats.special !== undefined && rightStats.special !== undefined && (
          <StatRow
            icon="star"
            label="SP"
            leftValue={leftStats.special}
            rightValue={rightStats.special}
            leftColor={leftColor}
            rightColor={rightColor}
            delay={baseDelay + 400}
          />
        )}
      </View>

      {/* Power comparison */}
      <View style={styles.powerContainer}>
        <PowerIndicator
          label="Power"
          leftValue={calculatePower(leftStats)}
          rightValue={calculatePower(rightStats)}
          leftColor={leftColor}
          rightColor={rightColor}
          delay={baseDelay + 500}
        />
      </View>
    </Animated.View>
  );
}

function calculatePower(stats: PlayerStats): number {
  return (
    stats.health +
    stats.attack * 2 +
    stats.defense * 1.5 +
    (stats.speed || 0) +
    (stats.special || 0) * 1.5
  );
}

interface PowerIndicatorProps {
  label: string;
  leftValue: number;
  rightValue: number;
  leftColor: string;
  rightColor: string;
  delay: number;
}

function PowerIndicator({
  label,
  leftValue,
  rightValue,
  leftColor,
  rightColor,
  delay,
}: PowerIndicatorProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 150 })
    );
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const leftWins = leftValue > rightValue;
  const rightWins = rightValue > leftValue;

  return (
    <Animated.View style={[styles.powerRow, style]}>
      <View style={[styles.powerBadge, leftWins && { borderColor: leftColor }]}>
        <Text style={[styles.powerValue, leftWins && { color: leftColor }]}>
          {Math.round(leftValue)}
        </Text>
      </View>

      <View style={styles.powerCenter}>
        <Ionicons name="flame" size={24} color={GAME_COLORS.reward.gold} />
        <Text style={styles.powerLabel}>{label}</Text>
      </View>

      <View style={[styles.powerBadge, rightWins && { borderColor: rightColor }]}>
        <Text style={[styles.powerValue, rightWins && { color: rightColor }]}>
          {Math.round(rightValue)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerVs: {
    fontSize: 12,
    fontWeight: '800',
    color: GAME_COLORS.accent.ice,
    letterSpacing: 2,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statSide: {
    flex: 1,
    alignItems: 'center',
  },
  statCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: 60,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  winningValue: {
    color: GAME_COLORS.reward.gold,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barFillLeft: {
    alignSelf: 'flex-end',
  },
  barFillRight: {
    alignSelf: 'flex-start',
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 32,
    textAlign: 'center',
  },
  powerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  powerBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  powerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  powerCenter: {
    alignItems: 'center',
  },
  powerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GAME_COLORS.reward.gold,
    marginTop: 4,
    letterSpacing: 1,
  },
});

export default PlayerStatsComparison;

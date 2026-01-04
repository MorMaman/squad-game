/**
 * VSBattleScreen.tsx
 * Main VS Battle screen layout with dramatic animations
 * Features two avatars facing off with animated VS indicator
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BattleAvatar, BattleAvatarProps } from './BattleAvatar';
import { VSIndicator } from './VSIndicator';
import { PlayerStatsComparison, PlayerStats } from './PlayerStatsComparison';
import { GAME_COLORS } from '../../theme/gameColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BattlePlayer {
  id: string;
  name: string;
  level: number;
  avatarSource: BattleAvatarProps['source'];
  stats: PlayerStats;
}

export interface VSBattleScreenProps {
  /** Left player (usually the current user) */
  leftPlayer: BattlePlayer;
  /** Right player (opponent) */
  rightPlayer: BattlePlayer;
  /** Callback when "Fight" button is pressed */
  onFight?: () => void;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Optional countdown before auto-starting battle */
  autoStartDelay?: number;
  /** Show the stats comparison panel */
  showStats?: boolean;
  /** Custom left player color */
  leftColor?: string;
  /** Custom right player color */
  rightColor?: string;
}

export function VSBattleScreen({
  leftPlayer,
  rightPlayer,
  onFight,
  onBack,
  autoStartDelay,
  showStats = true,
  leftColor = '#A3E635',
  rightColor = '#EF4444',
}: VSBattleScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(
    autoStartDelay ? Math.ceil(autoStartDelay / 1000) : null
  );

  // Animation values
  const backgroundPulse = useSharedValue(0);
  const fightButtonScale = useSharedValue(0);
  const fightButtonOpacity = useSharedValue(0);
  const radialGlowOpacity = useSharedValue(0);
  const radialGlowScale = useSharedValue(0.5);

  useEffect(() => {
    // Background ambient pulse
    backgroundPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Radial glow animation
    radialGlowOpacity.value = withDelay(
      800,
      withTiming(0.4, { duration: 1000 })
    );
    radialGlowScale.value = withDelay(
      800,
      withSpring(1, { damping: 12, stiffness: 80 })
    );

    // Fight button entrance after all other elements
    fightButtonScale.value = withDelay(
      1500,
      withSpring(1, { damping: 8, stiffness: 150 })
    );
    fightButtonOpacity.value = withDelay(
      1500,
      withTiming(1, { duration: 300 })
    );

    // Set ready state after animations
    const readyTimeout = setTimeout(() => {
      setIsReady(true);
    }, 1800);

    return () => clearTimeout(readyTimeout);
  }, []);

  // Auto-start countdown
  useEffect(() => {
    if (!autoStartDelay || !isReady) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          if (onFight) onFight();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoStartDelay, isReady, onFight]);

  const handleFight = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onFight?.();
  };

  const backgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(backgroundPulse.value, [0, 1], [0.3, 0.5]);
    return { opacity };
  });

  const radialGlowStyle = useAnimatedStyle(() => ({
    opacity: radialGlowOpacity.value,
    transform: [{ scale: radialGlowScale.value }],
  }));

  const fightButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fightButtonScale.value }],
    opacity: fightButtonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Dark background with gradient */}
      <LinearGradient
        colors={['#0A0E27', '#1A1A2E', '#0A0E27']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated radial glow in center */}
      <Animated.View style={[styles.radialGlow, radialGlowStyle]}>
        <LinearGradient
          colors={['rgba(255, 71, 87, 0.4)', 'transparent']}
          style={styles.radialGlowGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Subtle animated background pattern */}
      <Animated.View style={[styles.backgroundPattern, backgroundStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(155, 89, 255, 0.1)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>BATTLE</Text>
          <View style={styles.backButton} />
        </View>

        {/* Main battle area */}
        <View style={styles.battleArea}>
          {/* Avatars row */}
          <View style={styles.avatarsRow}>
            {/* Left player */}
            <BattleAvatar
              source={leftPlayer.avatarSource}
              name={leftPlayer.name}
              level={leftPlayer.level}
              position="left"
              glowColor={leftColor}
              entranceDelay={0}
            />

            {/* VS Indicator */}
            <VSIndicator
              entranceDelay={400}
              glowColor={GAME_COLORS.reward.gold}
            />

            {/* Right player */}
            <BattleAvatar
              source={rightPlayer.avatarSource}
              name={rightPlayer.name}
              level={rightPlayer.level}
              position="right"
              glowColor={rightColor}
              entranceDelay={200}
            />
          </View>

          {/* Stats comparison */}
          {showStats && (
            <PlayerStatsComparison
              leftStats={leftPlayer.stats}
              rightStats={rightPlayer.stats}
              leftName={leftPlayer.name}
              rightName={rightPlayer.name}
              leftColor={leftColor}
              rightColor={rightColor}
              entranceDelay={900}
            />
          )}
        </View>

        {/* Fight button */}
        <View style={styles.bottomSection}>
          <Animated.View style={[styles.fightButtonContainer, fightButtonStyle]}>
            <TouchableOpacity
              onPress={handleFight}
              activeOpacity={0.8}
              style={styles.fightTouchable}
            >
              <LinearGradient
                colors={[GAME_COLORS.primary.coral, '#FF2D2D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fightGradient}
              >
                <Ionicons
                  name="flash"
                  size={28}
                  color="#FFFFFF"
                  style={styles.fightIcon}
                />
                <Text style={styles.fightText}>
                  {countdown !== null ? countdown : 'FIGHT!'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Skip text */}
          {countdown !== null && (
            <TouchableOpacity onPress={handleFight} style={styles.skipButton}>
              <Text style={styles.skipText}>Tap to start now</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  radialGlow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 0.6,
    marginLeft: -(SCREEN_WIDTH * 1.5) / 2,
  },
  radialGlowGradient: {
    flex: 1,
    borderRadius: SCREEN_WIDTH,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  battleArea: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  fightButtonContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    // Shadow for fight button
    shadowColor: GAME_COLORS.primary.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  fightTouchable: {
    width: '100%',
  },
  fightGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  fightIcon: {
    marginRight: 12,
  },
  fightText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default VSBattleScreen;

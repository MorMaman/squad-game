/**
 * Reaction Time Game
 * Test your reflexes!
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#0A0E27',
  waiting: '#FF4757',
  go: '#00FF87',
  tooEarly: '#9B59FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  gold: '#FFD700',
  cardBg: '#1A1A2E',
};

type GamePhase = 'ready' | 'waiting' | 'go' | 'tapped' | 'tooEarly' | 'results';

interface RoundResult {
  time: number | null;
  tooEarly: boolean;
}

export default function ReactionTimeGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pulseScale = useSharedValue(1);
  const circleScale = useSharedValue(1);

  useEffect(() => {
    if (phase === 'waiting') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    } else {
      pulseScale.value = 1;
    }
  }, [phase]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRound = () => {
    setPhase('waiting');
    setCurrentTime(null);

    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;

    timeoutRef.current = setTimeout(() => {
      setPhase('go');
      startTimeRef.current = Date.now();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      circleScale.value = withSpring(1.2, { damping: 5 }, () => {
        circleScale.value = withSpring(1);
      });
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      // Too early!
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPhase('tooEarly');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setResults((prev) => [...prev, { time: null, tooEarly: true }]);

      setTimeout(() => {
        if (round < 5) {
          setRound((r) => r + 1);
          startRound();
        } else {
          setPhase('results');
        }
      }, 1500);
    } else if (phase === 'go') {
      const reactionTime = Date.now() - startTimeRef.current;
      setCurrentTime(reactionTime);
      setPhase('tapped');

      if (Platform.OS !== 'web') {
        if (reactionTime < 300) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      setResults((prev) => [...prev, { time: reactionTime, tooEarly: false }]);

      setTimeout(() => {
        if (round < 5) {
          setRound((r) => r + 1);
          startRound();
        } else {
          setPhase('results');
        }
      }, 1500);
    }
  };

  const getTimeColor = (time: number) => {
    if (time < 200) return COLORS.gold;
    if (time < 300) return COLORS.go;
    if (time < 400) return '#00D4FF';
    return COLORS.textPrimary;
  };

  const getTimeRating = (time: number) => {
    if (time < 200) return 'LIGHTNING!';
    if (time < 300) return 'QUICK!';
    if (time < 400) return 'GOOD!';
    return 'KEEP TRYING';
  };

  const calculateAverage = () => {
    const validResults = results.filter((r) => r.time !== null);
    if (validResults.length === 0) return null;
    const sum = validResults.reduce((acc, r) => acc + (r.time || 0), 0);
    return Math.round(sum / validResults.length);
  };

  const resetGame = () => {
    setPhase('ready');
    setRound(1);
    setResults([]);
    setCurrentTime(null);
  };

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const getCircleColor = () => {
    switch (phase) {
      case 'waiting':
        return COLORS.waiting;
      case 'go':
        return COLORS.go;
      case 'tooEarly':
        return COLORS.tooEarly;
      case 'tapped':
        return currentTime && currentTime < 300 ? COLORS.gold : COLORS.go;
      default:
        return COLORS.cardBg;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {phase === 'results' ? 'Results' : `Round ${round}/5`}
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Game Area */}
        <TouchableOpacity
          style={styles.gameArea}
          onPress={phase === 'waiting' || phase === 'go' ? handleTap : undefined}
          activeOpacity={1}
        >
          {phase === 'ready' && (
            <Animated.View entering={FadeIn} style={styles.readyContainer}>
              <Ionicons name="flash" size={64} color={COLORS.gold} />
              <Text style={styles.readyTitle}>Reaction Time</Text>
              <Text style={styles.readySubtitle}>
                Tap as fast as you can when the circle turns green!
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={startRound}>
                <LinearGradient
                  colors={[COLORS.go, '#10B981']}
                  style={styles.startGradient}
                >
                  <Text style={styles.startText}>START</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {(phase === 'waiting' || phase === 'go' || phase === 'tapped' || phase === 'tooEarly') && (
            <View style={styles.circleContainer}>
              <Animated.View
                style={[
                  styles.circle,
                  { backgroundColor: getCircleColor() },
                  phase === 'waiting' ? pulseStyle : circleStyle,
                ]}
              >
                {phase === 'waiting' && (
                  <Text style={styles.circleText}>Wait...</Text>
                )}
                {phase === 'go' && (
                  <Text style={styles.circleText}>TAP!</Text>
                )}
                {phase === 'tapped' && currentTime && (
                  <>
                    <Text style={[styles.timeText, { color: getTimeColor(currentTime) }]}>
                      {currentTime}ms
                    </Text>
                    <Text style={styles.ratingText}>{getTimeRating(currentTime)}</Text>
                  </>
                )}
                {phase === 'tooEarly' && (
                  <>
                    <Ionicons name="close-circle" size={48} color={COLORS.textPrimary} />
                    <Text style={styles.tooEarlyText}>Too Early!</Text>
                  </>
                )}
              </Animated.View>
            </View>
          )}

          {phase === 'results' && (
            <Animated.View entering={FadeInDown} style={styles.resultsContainer}>
              <Text style={styles.resultsEmoji}>
                {calculateAverage() && calculateAverage()! < 300 ? '⚡' : '🎯'}
              </Text>
              <Text style={styles.resultsTitle}>
                {calculateAverage() ? `${calculateAverage()}ms` : 'No valid times'}
              </Text>
              <Text style={styles.resultsSubtitle}>Average Reaction Time</Text>

              <View style={styles.roundResults}>
                {results.map((result, index) => (
                  <View key={index} style={styles.roundResult}>
                    <Text style={styles.roundNumber}>R{index + 1}</Text>
                    <Text
                      style={[
                        styles.roundTime,
                        result.tooEarly ? styles.roundTimeFailed : null,
                        result.time ? { color: getTimeColor(result.time) } : null,
                      ]}
                    >
                      {result.tooEarly ? 'FAIL' : `${result.time}ms`}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.resultsButtons}>
                <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
                  <LinearGradient
                    colors={[COLORS.go, '#10B981']}
                    style={styles.playAgainGradient}
                  >
                    <Text style={styles.playAgainText}>Play Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const CIRCLE_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  readyContainer: {
    alignItems: 'center',
    gap: 16,
  },
  readyTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  readySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  startButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startGradient: {
    paddingVertical: 16,
    paddingHorizontal: 64,
  },
  startText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.background,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '800',
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  tooEarlyText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  resultsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  resultsEmoji: {
    fontSize: 64,
  },
  resultsTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: 16,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  roundResults: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roundResult: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  roundNumber: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  roundTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roundTimeFailed: {
    color: COLORS.waiting,
  },
  resultsButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playAgainGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  exitButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

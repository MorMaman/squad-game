/**
 * Color Match (Stroop Test) Game
 * A brain teaser where players must tap the button matching the WORD, not the displayed color
 * Features: 30 second timer, score tracking, streaks, speed bonuses
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useGameSounds } from '../../src/hooks/useGameSounds';
import { Button } from '../../src/components/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game Color Palette
const COLORS = {
  background: '#0A0E27',
  cardBg: '#141933',
  surface: '#1A2140',
  primary: '#7C3AED',
  secondary: '#EC4899',
  success: '#00FF87',
  warning: '#FFD700',
  danger: '#FF4757',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B93B0',
  cyan: '#00D4FF',
};

// Game colors for words and buttons
const GAME_COLORS = {
  RED: '#FF4757',
  BLUE: '#00D4FF',
  GREEN: '#00FF87',
  YELLOW: '#FFD700',
} as const;

type ColorName = keyof typeof GAME_COLORS;
type Phase = 'ready' | 'countdown' | 'playing' | 'result' | 'submitting';

const COLOR_NAMES: ColorName[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const GAME_DURATION = 30000; // 30 seconds
const CORRECT_POINTS = 10;
const WRONG_PENALTY = 5;
const SPEED_BONUS_THRESHOLD = 1000; // ms - get bonus if answered within 1 second
const SPEED_BONUS_POINTS = 5;
const STREAK_MILESTONES = [5, 10, 15, 20, 25];

interface GameRound {
  word: ColorName;
  displayColor: ColorName;
}

// Generate a new round where word !== display color
function generateRound(): GameRound {
  const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  let displayColor: ColorName;
  do {
    displayColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  } while (displayColor === word);
  return { word, displayColor };
}

export default function ColorMatchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { playSound, initAudio } = useGameSounds();
  const [phase, setPhase] = useState<Phase>('ready');
  const [currentRound, setCurrentRound] = useState<GameRound>(generateRound());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [showWrongFlash, setShowWrongFlash] = useState(false);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [streakMilestoneText, setStreakMilestoneText] = useState('');
  const [floatingPointsText, setFloatingPointsText] = useState('+10');
  const [floatingPointsColor, setFloatingPointsColor] = useState(COLORS.success);

  // Track answer timing for speed bonus
  const roundStartTime = useRef<number>(Date.now());

  // Reanimated shared values
  const countdownScale = useSharedValue(0);
  const countdownOpacity = useSharedValue(1);
  const wordScale = useSharedValue(1);
  const wordTranslateY = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const streakScale = useSharedValue(1);
  const timerPulse = useSharedValue(1);
  const wrongShake = useSharedValue(0);
  const milestoneScale = useSharedValue(0);
  const milestoneOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0);
  const floatingPointsOpacity = useSharedValue(0);
  const floatingPointsY = useSharedValue(0);

  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const urgencyPulseActive = useRef(false);

  // Mock data
  const personalBest = 150;

  // Animated styles
  const countdownAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
    opacity: countdownOpacity.value,
  }));

  const wordAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: wordScale.value },
      { translateY: wordTranslateY.value },
    ],
  }));

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const streakAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  const shakeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wrongShake.value }],
  }));

  const milestoneAnimStyle = useAnimatedStyle(() => ({
    opacity: milestoneOpacity.value,
    transform: [{ scale: milestoneScale.value }],
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    opacity: resultScale.value,
    transform: [{ scale: interpolate(resultScale.value, [0, 1], [0.8, 1]) }],
  }));

  const floatingPointsAnimStyle = useAnimatedStyle(() => ({
    opacity: floatingPointsOpacity.value,
    transform: [{ translateY: floatingPointsY.value }],
  }));

  // Countdown animation
  useEffect(() => {
    if (phase === 'countdown') {
      animateCountdown();
    }
  }, [phase]);

  // Game timer
  useEffect(() => {
    if (phase === 'playing') {
      startTimeRef.current = Date.now();
      roundStartTime.current = Date.now();

      gameTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = GAME_DURATION - elapsed;

        if (remaining <= 0) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          setTimeLeft(0);
          endGame();
        } else {
          setTimeLeft(remaining);

          // Urgency pulse when < 10 seconds
          if (remaining <= 10000 && remaining > 0 && !urgencyPulseActive.current) {
            urgencyPulseActive.current = true;
            timerPulse.value = withRepeat(
              withSequence(
                withTiming(1.1, { duration: 300 }),
                withTiming(1, { duration: 300 })
              ),
              -1,
              false
            );
          }
        }
      }, 50);

      return () => {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
        }
        urgencyPulseActive.current = false;
      };
    }
  }, [phase]);

  const animateCountdown = () => {
    const animateNumber = (num: number, callback?: () => void) => {
      setCountdownValue(num);
      countdownScale.value = 0;
      countdownOpacity.value = 1;

      playSound('countdown'); // Countdown beep
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      countdownScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      countdownOpacity.value = withDelay(700, withTiming(0, { duration: 300 }));

      if (callback) {
        setTimeout(callback, 1000);
      }
    };

    animateNumber(3, () => {
      animateNumber(2, () => {
        animateNumber(1, () => {
          setCountdownValue(0);
          countdownScale.value = 0;
          countdownOpacity.value = 1;
          playSound('go'); // GO sound
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          countdownScale.value = withSpring(1.2, { damping: 10, stiffness: 100 });
          countdownOpacity.value = withDelay(500, withTiming(0, { duration: 200 }));

          setTimeout(() => {
            setPhase('playing');
            animateWordIn();
          }, 700);
        });
      });
    });
  };

  const animateWordIn = () => {
    wordScale.value = 0.5;
    wordTranslateY.value = -50;

    wordScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    wordTranslateY.value = withSpring(0, { damping: 12, stiffness: 80 });
  };

  const animateCorrect = (points: number, hasSpeedBonus: boolean) => {
    setShowCorrectFlash(true);
    setTimeout(() => setShowCorrectFlash(false), 200);

    // Show floating points
    const totalPoints = hasSpeedBonus ? points + SPEED_BONUS_POINTS : points;
    setFloatingPointsText(`+${totalPoints}${hasSpeedBonus ? ' FAST!' : ''}`);
    setFloatingPointsColor(COLORS.success);
    floatingPointsOpacity.value = 1;
    floatingPointsY.value = 0;

    floatingPointsY.value = withTiming(-60, { duration: 800, easing: Easing.out(Easing.cubic) });
    floatingPointsOpacity.value = withDelay(500, withTiming(0, { duration: 300 }));

    // Score pop
    scoreScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Word out and new word in
    wordScale.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setCurrentRound(generateRound());
      roundStartTime.current = Date.now();
      animateWordIn();
    }, 150);
  };

  const animateWrong = () => {
    setShowWrongFlash(true);
    setTimeout(() => setShowWrongFlash(false), 300);

    // Show negative points
    setFloatingPointsText(`-${WRONG_PENALTY}`);
    setFloatingPointsColor(COLORS.danger);
    floatingPointsOpacity.value = 1;
    floatingPointsY.value = 0;

    floatingPointsY.value = withTiming(-60, { duration: 800, easing: Easing.out(Easing.cubic) });
    floatingPointsOpacity.value = withDelay(500, withTiming(0, { duration: 300 }));

    // Screen shake
    wrongShake.value = withSequence(
      withTiming(15, { duration: 50 }),
      withTiming(-15, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    // Word out and new word in
    wordScale.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setCurrentRound(generateRound());
      roundStartTime.current = Date.now();
      animateWordIn();
    }, 150);
  };

  const triggerStreakMilestone = (newStreak: number) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const messages: Record<number, string> = {
      5: 'ON FIRE!',
      10: 'UNSTOPPABLE!',
      15: 'LEGENDARY!',
      20: 'GODLIKE!',
      25: 'IMPOSSIBLE!',
    };

    setStreakMilestoneText(messages[newStreak] || 'AMAZING!');
    milestoneOpacity.value = 0;
    milestoneScale.value = 0.5;

    milestoneScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    milestoneOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(800, withTiming(0, { duration: 300 }))
    );
  };

  const handleColorPress = useCallback(
    (pressedColor: ColorName) => {
      if (phase !== 'playing') return;

      const isCorrect = pressedColor === currentRound.word;
      const answerTime = Date.now() - roundStartTime.current;
      const hasSpeedBonus = answerTime < SPEED_BONUS_THRESHOLD;

      if (isCorrect) {
        playSound('correct'); // Correct answer sound
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        setCorrectCount((c) => c + 1);

        const points = CORRECT_POINTS + (hasSpeedBonus ? SPEED_BONUS_POINTS : 0);
        setScore((s) => s + points);

        animateCorrect(CORRECT_POINTS, hasSpeedBonus);

        // Check for streak milestone
        if (STREAK_MILESTONES.includes(newStreak)) {
          playSound('levelUp'); // Streak milestone sound
          triggerStreakMilestone(newStreak);
        } else {
          // Streak counter animation
          streakScale.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withSpring(1, { damping: 10, stiffness: 200 })
          );
        }
      } else {
        playSound('wrong'); // Wrong answer sound
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStreak(0);
        setWrongCount((w) => w + 1);
        setScore((s) => Math.max(0, s - WRONG_PENALTY));
        animateWrong();
      }
    },
    [phase, currentRound, streak, bestStreak]
  );

  const endGame = () => {
    playSound('gameOver'); // Game over sound
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('result');

    resultScale.value = withSpring(1, { damping: 12, stiffness: 50 });
  };

  const calculateXP = () => {
    let xp = 25; // Base participation
    if (score >= 200) xp += 75;
    else if (score >= 150) xp += 50;
    else if (score >= 100) xp += 25;
    if (score > personalBest) xp += 25;
    if (bestStreak >= 10) xp += 15;
    return xp;
  };

  const getAccuracy = () => {
    const total = correctCount + wrongCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  };

  const handleStartGame = () => {
    initAudio(); // Initialize audio on first interaction
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('countdown');
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(GAME_DURATION);
    setCurrentRound(generateRound());
    timerPulse.value = 1;
    urgencyPulseActive.current = false;
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In real app, submit to backend
    setTimeout(() => router.back(), 500);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  };

  const timerProgress = timeLeft / GAME_DURATION;
  const timerGradient =
    timerProgress > 0.3
      ? [COLORS.primary, COLORS.secondary]
      : timerProgress > 0.15
        ? [COLORS.warning, '#FF8C00']
        : [COLORS.danger, '#FF0000'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Correct flash overlay */}
      {showCorrectFlash && (
        <View style={[styles.flashOverlay, { backgroundColor: COLORS.success }]} />
      )}

      {/* Wrong flash overlay */}
      {showWrongFlash && (
        <View style={[styles.flashOverlay, { backgroundColor: COLORS.danger }]} />
      )}

      {/* Screen shake wrapper */}
      <Animated.View style={[styles.shakeWrapper, shakeAnimStyle]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* READY PHASE */}
        {phase === 'ready' && (
          <View style={styles.readyContainer}>
            <View style={styles.readyIconContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.readyIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="color-palette" size={48} color={COLORS.textPrimary} />
              </LinearGradient>
            </View>

            <Text style={styles.readyTitle}>{t('games.colorMatch.title').toUpperCase()}</Text>
            <Text style={styles.readySubtitle}>
              {t('games.colorMatch.instructions')}
            </Text>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={[styles.exampleWord, { color: GAME_COLORS.BLUE }]}>RED</Text>
              <Text style={styles.exampleHint}>Tap the RED button!</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={20} color={COLORS.warning} />
                </View>
                <Text style={styles.statLabel}>{t('games.highScore')}</Text>
                <Text style={styles.statValue}>{personalBest}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={20} color={COLORS.cyan} />
                </View>
                <Text style={styles.statLabel}>{t('games.colorMatch.timeLeft')}</Text>
                <Text style={styles.statValue}>30 sec</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={28} color="#fff" />
                <Text style={styles.startButtonText}>{t('game.startGame').toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* COUNTDOWN PHASE */}
        {phase === 'countdown' && (
          <View style={styles.countdownContainer}>
            <Animated.View style={[styles.countdownNumber, countdownAnimStyle]}>
              <Text style={styles.countdownText}>
                {countdownValue === 0 ? t('game.go') : countdownValue}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* PLAYING PHASE */}
        {phase === 'playing' && (
          <View style={styles.playingContainer}>
            {/* Timer Bar */}
            <View style={styles.timerBarContainer}>
              <Animated.View style={[styles.timerBarWrapper, timerAnimStyle]}>
                <View style={styles.timerBarBackground}>
                  <LinearGradient
                    colors={timerGradient as [string, string]}
                    style={[styles.timerBarFill, { width: `${timerProgress * 100}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text
                  style={[
                    styles.timerText,
                    timeLeft <= 10000 && styles.timerTextUrgent,
                  ]}
                >
                  {formatTime(timeLeft)}s
                </Text>
              </Animated.View>
            </View>

            {/* Score and Streak Row */}
            <View style={styles.statsRow}>
              <Animated.View style={[styles.scoreContainer, scoreAnimStyle]}>
                <Text style={styles.scoreLabel}>{t('games.colorMatch.score').toUpperCase()}</Text>
                <Text style={styles.scoreValue}>{score}</Text>
              </Animated.View>

              {streak > 0 && (
                <Animated.View style={[styles.streakContainer, streakAnimStyle]}>
                  <Text style={styles.streakFire}>
                    {streak >= 10 ? '!!' : '!'}
                  </Text>
                  <Text style={styles.streakValue}>x{streak}</Text>
                </Animated.View>
              )}
            </View>

            {/* Floating Points */}
            <Animated.View
              style={[styles.floatingPoints, floatingPointsAnimStyle]}
              pointerEvents="none"
            >
              <Text style={[styles.floatingPointsText, { color: floatingPointsColor }]}>
                {floatingPointsText}
              </Text>
            </Animated.View>

            {/* Milestone Text */}
            <Animated.View
              style={[styles.milestoneContainer, milestoneAnimStyle]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[COLORS.warning, '#FF8C00']}
                style={styles.milestoneBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.milestoneText}>{streakMilestoneText}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Word Display */}
            <View style={styles.wordContainer}>
              <Animated.View style={[styles.wordWrapper, wordAnimStyle]}>
                <Text
                  style={[
                    styles.wordText,
                    { color: GAME_COLORS[currentRound.displayColor] },
                  ]}
                >
                  {currentRound.word}
                </Text>
              </Animated.View>
              <Text style={styles.wordHint}>TAP THE WORD!</Text>
            </View>

            {/* Color Buttons */}
            <View style={styles.buttonsContainer}>
              <View style={styles.buttonsRow}>
                {(['RED', 'BLUE'] as ColorName[]).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: GAME_COLORS[color] },
                    ]}
                    onPress={() => handleColorPress(color)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.colorButtonText}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.buttonsRow}>
                {(['GREEN', 'YELLOW'] as ColorName[]).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: GAME_COLORS[color] },
                      color === 'YELLOW' && styles.yellowButton,
                    ]}
                    onPress={() => handleColorPress(color)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.colorButtonText,
                        color === 'YELLOW' && styles.yellowButtonText,
                      ]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* RESULT PHASE */}
        {(phase === 'result' || phase === 'submitting') && (
          <View style={styles.resultContainer}>
            <Animated.View style={[styles.resultCard, resultAnimStyle]}>
              <View style={styles.resultHeader}>
                <LinearGradient
                  colors={[COLORS.warning, COLORS.secondary]}
                  style={styles.resultIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-done" size={40} color="#fff" />
                </LinearGradient>
                <Text style={styles.resultTitle}>{t('games.colorMatch.gameOver')}</Text>
              </View>

              <View style={styles.resultScoreContainer}>
                <Text style={styles.resultScoreNumber}>{score}</Text>
                <Text style={styles.resultScoreLabel}>{t('game.points').toUpperCase()}</Text>
              </View>

              {score > personalBest && (
                <View style={styles.newHighScoreBadge}>
                  <Ionicons name="trophy" size={20} color={COLORS.warning} />
                  <Text style={styles.newHighScoreText}>{t('game.newHighScore')}</Text>
                </View>
              )}

              <View style={styles.resultStatsGrid}>
                <View style={styles.resultStatItem}>
                  <Text style={styles.resultStatValue}>{correctCount}</Text>
                  <Text style={styles.resultStatLabel}>{t('games.colorMatch.correct')}</Text>
                </View>
                <View style={styles.resultStatDivider} />
                <View style={styles.resultStatItem}>
                  <Text style={styles.resultStatValue}>{getAccuracy()}%</Text>
                  <Text style={styles.resultStatLabel}>{t('profile.statistics')}</Text>
                </View>
                <View style={styles.resultStatDivider} />
                <View style={styles.resultStatItem}>
                  <View style={styles.streakStatRow}>
                    <Text style={styles.resultStatValue}>{bestStreak}</Text>
                    {bestStreak >= 5 && <Text style={styles.miniStreak}>!</Text>}
                  </View>
                  <Text style={styles.resultStatLabel}>{t('profile.bestStreak')}</Text>
                </View>
              </View>

              <View style={styles.xpEarnedContainer}>
                <Ionicons name="star" size={24} color={COLORS.warning} />
                <Text style={styles.xpEarnedText}>+{calculateXP()} XP</Text>
              </View>

              <Button
                title={phase === 'submitting' ? t('common.loading') : t('common.save').toUpperCase()}
                onPress={handleSubmit}
                loading={phase === 'submitting'}
                size="large"
                style={styles.submitButton}
              />

              <TouchableOpacity
                style={styles.playAgainButton}
                onPress={handleStartGame}
                disabled={phase === 'submitting'}
              >
                <Ionicons name="reload" size={20} color={COLORS.textSecondary} />
                <Text style={styles.playAgainText}>{t('games.colorMatch.playAgain')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
    zIndex: 100,
  },
  shakeWrapper: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 33, 64, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // READY PHASE
  readyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  readyIconContainer: {
    marginBottom: 24,
  },
  readyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  readySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exampleContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 280,
  },
  exampleLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  exampleWord: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  exampleHint: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 130,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  startButton: {
    width: '100%',
    maxWidth: 280,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },

  // COUNTDOWN PHASE
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },

  // PLAYING PHASE
  playingContainer: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  timerBarContainer: {
    marginBottom: 16,
  },
  timerBarWrapper: {
    alignItems: 'center',
  },
  timerBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: COLORS.danger,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  streakFire: {
    fontSize: 20,
    color: '#FF6B00',
    fontWeight: '900',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B00',
    fontVariant: ['tabular-nums'],
  },
  floatingPoints: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  floatingPointsText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  milestoneContainer: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  milestoneBadge: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  milestoneText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 2,
  },
  wordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordWrapper: {
    alignItems: 'center',
  },
  wordText: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  wordHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 16,
  },
  buttonsContainer: {
    paddingBottom: 40,
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  colorButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  yellowButton: {
    // Yellow needs darker text for contrast
  },
  yellowButtonText: {
    color: '#1A1A2E',
  },

  // RESULT PHASE
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  resultScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultScoreNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 80,
  },
  resultScoreLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 3,
  },
  newHighScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  newHighScoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.warning,
    letterSpacing: 1,
  },
  resultStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  resultStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  resultStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 147, 176, 0.2)',
    marginHorizontal: 8,
  },
  streakStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStreak: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '900',
  },
  xpEarnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  xpEarnedText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.warning,
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  playAgainText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

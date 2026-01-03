import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  SharedValue,
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

// Game Color Palette - matching the spec
const COLORS = {
  background: '#0A0E27',
  cardBg: '#1A1A2E',
  correct: '#00FF87',
  wrong: '#FF4757',
  primary: '#7C3AED',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F97316',
  energy: '#FACC15',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  cyan: '#06B6D4',
  timerStart: '#06B6D4',
  timerEnd: '#FF4757',
};

type Phase = 'ready' | 'countdown' | 'playing' | 'result' | 'submitting';
type Difficulty = 'easy' | 'medium' | 'hard';
type Operation = '+' | '-' | '*' | '/';

interface Question {
  equation: string;
  answer: number;
  options: number[];
  difficulty: Difficulty;
}

const GAME_DURATION = 60000; // 60 seconds
const SPEED_BONUS_THRESHOLD = 2000; // 2 seconds for speed bonus
const BASE_POINTS = 10;
const SPEED_BONUS = 5;
const STREAK_MILESTONE = 5;

// Generate a math question based on difficulty
const generateQuestion = (difficulty: Difficulty, questionNumber: number): Question => {
  let num1: number, num2: number, answer: number, operation: Operation, equation: string;

  // Difficulty progression based on question number and current difficulty
  const progressedDifficulty: Difficulty =
    questionNumber >= 15 ? 'hard' :
    questionNumber >= 8 ? 'medium' :
    difficulty;

  switch (progressedDifficulty) {
    case 'easy':
      // Addition and subtraction with numbers 1-10
      operation = Math.random() > 0.5 ? '+' : '-';
      if (operation === '+') {
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 + num2;
      } else {
        num1 = Math.floor(Math.random() * 10) + 5;
        num2 = Math.floor(Math.random() * Math.min(num1, 10)) + 1;
        answer = num1 - num2;
      }
      equation = `${num1} ${operation} ${num2}`;
      break;

    case 'medium':
      // Larger numbers, multiplication
      const medOps: Operation[] = ['+', '-', '*'];
      operation = medOps[Math.floor(Math.random() * medOps.length)];
      if (operation === '*') {
        num1 = Math.floor(Math.random() * 10) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = num1 * num2;
      } else if (operation === '+') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 50) + 10;
        answer = num1 + num2;
      } else {
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * Math.min(num1 - 10, 30)) + 5;
        answer = num1 - num2;
      }
      equation = `${num1} ${operation} ${num2}`;
      break;

    case 'hard':
      // Division, two-step problems, larger numbers
      const hardType = Math.random();
      if (hardType < 0.3) {
        // Division (ensure clean division)
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 2;
        num1 = num2 * answer;
        operation = '/';
        equation = `${num1} ${operation} ${num2}`;
      } else if (hardType < 0.6) {
        // Large multiplication
        num1 = Math.floor(Math.random() * 12) + 5;
        num2 = Math.floor(Math.random() * 12) + 5;
        answer = num1 * num2;
        operation = '*';
        equation = `${num1} ${operation} ${num2}`;
      } else {
        // Two-step problem
        const firstNum = Math.floor(Math.random() * 10) + 2;
        const secondNum = Math.floor(Math.random() * 10) + 2;
        const thirdNum = Math.floor(Math.random() * 10) + 1;
        const opChoice = Math.random();
        if (opChoice < 0.5) {
          answer = firstNum * secondNum + thirdNum;
          equation = `${firstNum} * ${secondNum} + ${thirdNum}`;
        } else {
          answer = firstNum * secondNum - thirdNum;
          equation = `${firstNum} * ${secondNum} - ${thirdNum}`;
        }
      }
      break;

    default:
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
      equation = `${num1} + ${num2}`;
  }

  // Generate wrong answers that are close to the correct answer
  const options = generateOptions(answer);

  return {
    equation,
    answer,
    options,
    difficulty: progressedDifficulty,
  };
};

// Generate 4 options including the correct answer
const generateOptions = (correctAnswer: number): number[] => {
  const options = new Set<number>([correctAnswer]);
  const range = Math.max(10, Math.abs(correctAnswer) * 0.3);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * range) - range / 2;
    const wrongAnswer = correctAnswer + (offset === 0 ? 1 : offset);
    if (wrongAnswer >= 0 && wrongAnswer !== correctAnswer) {
      options.add(Math.round(wrongAnswer));
    }
  }

  // Shuffle options
  return Array.from(options).sort(() => Math.random() - 0.5);
};

// Separate component for answer buttons to avoid hooks inside .map()
interface AnswerButtonProps {
  option: number;
  index: number;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  showResult: boolean;
  scaleValue: SharedValue<number>;
  shakeValue: SharedValue<number>;
  onPress: (index: number) => void;
  disabled: boolean;
}

const AnswerButton = ({
  option,
  index,
  isSelected,
  isCorrectAnswer,
  showResult,
  scaleValue,
  shakeValue,
  onPress,
  disabled,
}: AnswerButtonProps) => {
  let borderColor = COLORS.textSecondary + '40';

  if (showResult) {
    if (isCorrectAnswer) {
      borderColor = COLORS.correct;
    } else if (isSelected && !isCorrectAnswer) {
      borderColor = COLORS.wrong;
    }
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scaleValue.value, [0, 1], [0.8, 1]) },
      { translateX: shakeValue.value },
    ],
    opacity: scaleValue.value,
  }));

  return (
    <Animated.View style={[styles.answerButtonWrapper, buttonAnimStyle]}>
      <TouchableOpacity
        style={[
          styles.answerButton,
          { borderColor },
          showResult && isCorrectAnswer && styles.answerButtonCorrect,
          showResult && isSelected && !isCorrectAnswer && styles.answerButtonWrong,
        ]}
        onPress={() => onPress(index)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.answerButtonText,
            showResult && isCorrectAnswer && styles.answerButtonTextCorrect,
            showResult && isSelected && !isCorrectAnswer && styles.answerButtonTextWrong,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function QuickMathScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { playSound, initAudio } = useGameSounds();
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousDifficulty, setPreviousDifficulty] = useState<Difficulty>('easy');

  // Reanimated shared values
  const countdownScale = useSharedValue(0);
  const countdownOpacity = useSharedValue(1);
  const equationSlide = useSharedValue(50);
  const equationOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const streakScale = useSharedValue(1);
  const streakFlame = useSharedValue(0);
  const screenFlash = useSharedValue(0);
  const timerPulse = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const floatingPointsY = useSharedValue(0);
  const floatingPointsOpacity = useSharedValue(0);
  const levelUpScale = useSharedValue(0);
  const levelUpOpacity = useSharedValue(0);
  const difficultyBadgeScale = useSharedValue(1);

  const button0Scale = useSharedValue(0);
  const button1Scale = useSharedValue(0);
  const button2Scale = useSharedValue(0);
  const button3Scale = useSharedValue(0);

  const button0Shake = useSharedValue(0);
  const button1Shake = useSharedValue(0);
  const button2Shake = useSharedValue(0);
  const button3Shake = useSharedValue(0);

  const buttonScales = [button0Scale, button1Scale, button2Scale, button3Scale];
  const buttonShakes = [button0Shake, button1Shake, button2Shake, button3Shake];

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [floatingPoints, setFloatingPoints] = useState(0);

  // Timer progress for gradient
  const timerProgress = useMemo(() => {
    return timeLeft / GAME_DURATION;
  }, [timeLeft]);

  // Animated styles
  const countdownAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
    opacity: countdownOpacity.value,
  }));

  const equationAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: equationSlide.value }],
    opacity: equationOpacity.value,
  }));

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const streakAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const screenFlashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));

  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: timerPulse.value }],
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    opacity: resultScale.value,
    transform: [{ scale: interpolate(resultScale.value, [0, 1], [0.8, 1]) }],
  }));

  const floatingPointsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingPointsY.value }],
    opacity: floatingPointsOpacity.value,
  }));

  const levelUpAnimStyle = useAnimatedStyle(() => ({
    opacity: levelUpOpacity.value,
    transform: [{ scale: levelUpScale.value }],
  }));

  const difficultyBadgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: difficultyBadgeScale.value }],
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

      gameTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = GAME_DURATION - elapsed;

        if (remaining <= 0) {
          clearInterval(gameTimerRef.current!);
          setTimeLeft(0);
          endGame();
        } else {
          setTimeLeft(remaining);

          // Timer pulse when low
          if (remaining <= 10000 && remaining > 0) {
            timerPulse.value = withSequence(
              withTiming(1.1, { duration: 250 }),
              withTiming(1, { duration: 250 })
            );
          }
        }
      }, 50);

      return () => {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
        }
      };
    }
  }, [phase]);

  // Generate first question when game starts
  useEffect(() => {
    if (phase === 'playing' && !currentQuestion) {
      generateNextQuestion();
    }
  }, [phase]);

  // Animate streak flame when streak increases
  useEffect(() => {
    if (streak > 0 && streak % STREAK_MILESTONE === 0) {
      // Streak milestone celebration
      playSound('levelUp'); // Level up sound
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      streakFlame.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        3,
        false
      );
    }
  }, [streak]);

  // Watch for difficulty changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.difficulty !== previousDifficulty) {
      setPreviousDifficulty(currentQuestion.difficulty);
      setDifficulty(currentQuestion.difficulty);

      // Show level up animation
      setShowLevelUp(true);
      playSound('levelUp'); // Level up sound
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      levelUpScale.value = 0.5;
      levelUpOpacity.value = 0;
      levelUpScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      levelUpOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1000, withTiming(0, { duration: 300 }))
      );

      setTimeout(() => setShowLevelUp(false), 1500);

      // Pulse difficulty badge
      difficultyBadgeScale.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
  }, [currentQuestion?.difficulty]);

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
          }, 700);
        });
      });
    });
  };

  const generateNextQuestion = useCallback(() => {
    const question = generateQuestion(difficulty, questionsAnswered);
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setIsCorrect(null);
    questionStartTimeRef.current = Date.now();

    // Animate equation sliding in
    equationSlide.value = 50;
    equationOpacity.value = 0;

    equationSlide.value = withSpring(0, { damping: 12, stiffness: 80 });
    equationOpacity.value = withTiming(1, { duration: 200 });

    // Animate buttons appearing
    buttonScales.forEach((anim, index) => {
      anim.value = 0;
      anim.value = withDelay(index * 50, withSpring(1, { damping: 10, stiffness: 60 }));
    });
  }, [difficulty, questionsAnswered]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion || phase !== 'playing') return;

    const selectedValue = currentQuestion.options[answerIndex];
    const correct = selectedValue === currentQuestion.answer;
    const responseTime = Date.now() - questionStartTimeRef.current;
    const wasQuick = responseTime < SPEED_BONUS_THRESHOLD;

    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    setQuestionsAnswered((prev) => prev + 1);

    if (correct) {
      // Correct answer
      playSound('correct'); // Correct answer sound
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const pointsEarned = BASE_POINTS + (wasQuick ? SPEED_BONUS : 0);
      setScore((prev) => prev + pointsEarned);
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        return newStreak;
      });
      setCorrectAnswers((prev) => prev + 1);

      // Show floating points
      setFloatingPoints(pointsEarned);
      floatingPointsY.value = 0;
      floatingPointsOpacity.value = 1;

      floatingPointsY.value = withTiming(-80, { duration: 800, easing: Easing.out(Easing.cubic) });
      floatingPointsOpacity.value = withDelay(400, withTiming(0, { duration: 400 }));

      // Green flash
      screenFlash.value = 0;
      screenFlash.value = withSequence(
        withTiming(0.3, { duration: 50 }),
        withTiming(0, { duration: 150 })
      );

      // Score pop animation
      scoreScale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );

      // Streak animation
      streakScale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );

    } else {
      // Wrong answer
      playSound('wrong'); // Wrong answer sound
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);

      // Red flash
      screenFlash.value = 0;
      screenFlash.value = withSequence(
        withTiming(0.3, { duration: 50 }),
        withTiming(0, { duration: 150 })
      );

      // Shake wrong button
      buttonShakes[answerIndex].value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    // Next question after brief delay
    setTimeout(() => {
      if (phase === 'playing') {
        generateNextQuestion();
      }
    }, correct ? 300 : 600);
  }, [currentQuestion, selectedAnswer, phase, generateNextQuestion, bestStreak]);

  const endGame = () => {
    playSound('gameOver'); // Game over sound
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('result');

    // Result card animation
    resultScale.value = withSpring(1, { damping: 12, stiffness: 50 });
  };

  const handleStartGame = () => {
    initAudio(); // Initialize audio on first interaction
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('countdown');
    setScore(0);
    setStreak(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setTimeLeft(GAME_DURATION);
    setCurrentQuestion(null);
    setDifficulty('easy');
    setPreviousDifficulty('easy');
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In real app, submit to backend
    setTimeout(() => router.back(), 500);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}`;
  };

  const getAccuracy = () => {
    if (questionsAnswered === 0) return 0;
    return Math.round((correctAnswers / questionsAnswered) * 100);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return COLORS.success;
      case 'medium': return COLORS.warning;
      case 'hard': return COLORS.danger;
    }
  };

  const getPerformanceMessage = () => {
    if (score >= 300) return 'LEGENDARY!';
    if (score >= 200) return 'AMAZING!';
    if (score >= 150) return 'GREAT JOB!';
    if (score >= 100) return 'NICE WORK!';
    return 'KEEP PRACTICING!';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen flash overlay */}
      <Animated.View
        style={[
          styles.screenFlash,
          screenFlashStyle,
          { backgroundColor: isCorrect ? COLORS.correct : COLORS.wrong },
        ]}
        pointerEvents="none"
      />

      {/* Level up overlay */}
      {showLevelUp && (
        <Animated.View
          style={[styles.levelUpOverlay, levelUpAnimStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[getDifficultyColor(difficulty), COLORS.primary]}
            style={styles.levelUpBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="arrow-up" size={24} color={COLORS.textPrimary} />
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            <Text style={styles.levelUpDifficulty}>{difficulty.toUpperCase()}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {/* READY PHASE */}
      {phase === 'ready' && (
        <View style={styles.readyContainer}>
          <View style={styles.readyIconContainer}>
            <LinearGradient
              colors={[COLORS.cyan, COLORS.primary]}
              style={styles.readyIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="calculator" size={48} color={COLORS.textPrimary} />
            </LinearGradient>
          </View>

          <Text style={styles.readyTitle}>{t('games.quickMath.title').toUpperCase()}</Text>
          <Text style={styles.readySubtitle}>
            {t('games.quickMath.instructions')}
          </Text>

          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <View style={[styles.ruleBadge, { backgroundColor: COLORS.correct + '30' }]}>
                <Text style={[styles.rulePoints, { color: COLORS.correct }]}>+10</Text>
              </View>
              <Text style={styles.ruleText}>Correct answer</Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={[styles.ruleBadge, { backgroundColor: COLORS.energy + '30' }]}>
                <Text style={[styles.rulePoints, { color: COLORS.energy }]}>+5</Text>
              </View>
              <Text style={styles.ruleText}>Speed bonus (&lt;2s)</Text>
            </View>
          </View>

          <View style={styles.difficultyInfo}>
            <Text style={styles.difficultyInfoTitle}>Difficulty increases as you progress!</Text>
            <View style={styles.difficultyLevels}>
              <View style={styles.difficultyLevel}>
                <View style={[styles.difficultyDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.difficultyLevelText}>Easy</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <View style={styles.difficultyLevel}>
                <View style={[styles.difficultyDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.difficultyLevelText}>Medium</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <View style={styles.difficultyLevel}>
                <View style={[styles.difficultyDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.difficultyLevelText}>Hard</Text>
              </View>
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
      {phase === 'playing' && currentQuestion && (
        <View style={styles.playingContainer}>
          {/* Header with timer and stats */}
          <View style={styles.gameHeader}>
            {/* Timer bar */}
            <View style={styles.timerBarContainer}>
              <Animated.View
                style={[
                  styles.timerBar,
                  { width: `${timerProgress * 100}%` },
                  timerAnimStyle,
                ]}
              >
                <LinearGradient
                  colors={timerProgress > 0.3 ? [COLORS.timerStart, COLORS.cyan] : [COLORS.warning, COLORS.timerEnd]}
                  style={styles.timerBarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
              <Text style={[
                styles.timerText,
                timeLeft <= 10000 && styles.timerTextUrgent,
              ]}>
                {formatTime(timeLeft)}s
              </Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {/* Score */}
              <Animated.View style={[styles.statContainer, scoreAnimStyle]}>
                <Ionicons name="star" size={18} color={COLORS.energy} />
                <Text style={styles.statValue}>{score}</Text>
              </Animated.View>

              {/* Difficulty badge */}
              <Animated.View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(difficulty) + '30' },
                  difficultyBadgeAnimStyle,
                ]}
              >
                <View style={[styles.difficultyDotSmall, { backgroundColor: getDifficultyColor(difficulty) }]} />
                <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                  {difficulty.toUpperCase()}
                </Text>
              </Animated.View>

              {/* Streak */}
              <Animated.View
                style={[
                  styles.statContainer,
                  styles.streakContainer,
                  streakAnimStyle,
                  streak >= STREAK_MILESTONE && styles.streakActive,
                ]}
              >
                <Text style={[styles.streakFlame, { opacity: streak > 0 ? 1 : 0.3 }]}>
                  {streak >= STREAK_MILESTONE ? '!' : ''}
                </Text>
                <Text style={styles.streakValue}>{streak}</Text>
              </Animated.View>
            </View>
          </View>

          {/* Equation display */}
          <View style={styles.equationContainer}>
            <Animated.View style={[styles.equationCard, equationAnimStyle]}>
              <Text style={styles.equationText}>{currentQuestion.equation} = ?</Text>
            </Animated.View>

            {/* Floating points animation */}
            <Animated.View
              style={[styles.floatingPoints, floatingPointsAnimStyle]}
              pointerEvents="none"
            >
              <Text style={styles.floatingPointsText}>+{floatingPoints}</Text>
            </Animated.View>
          </View>

          {/* Answer buttons 2x2 grid */}
          <View style={styles.answersGrid}>
            {currentQuestion.options.map((option, index) => (
              <AnswerButton
                key={index}
                option={option}
                index={index}
                isSelected={selectedAnswer === index}
                isCorrectAnswer={option === currentQuestion.answer}
                showResult={selectedAnswer !== null}
                scaleValue={buttonScales[index]}
                shakeValue={buttonShakes[index]}
                onPress={handleAnswer}
                disabled={selectedAnswer !== null}
              />
            ))}
          </View>
        </View>
      )}

      {/* RESULT PHASE */}
      {(phase === 'result' || phase === 'submitting') && (
        <View style={styles.resultContainer}>
          <Animated.View style={[styles.resultCard, resultAnimStyle]}>
            <View style={styles.resultHeader}>
              <LinearGradient
                colors={[COLORS.energy, COLORS.warning]}
                style={styles.resultIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="calculator" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.resultTitle}>{getPerformanceMessage()}</Text>
            </View>

            <View style={styles.resultScoreContainer}>
              <Text style={styles.resultScoreNumber}>{score}</Text>
              <Text style={styles.resultScoreLabel}>{t('game.points').toUpperCase()}</Text>
            </View>

            <View style={styles.resultStatsGrid}>
              <View style={styles.resultStat}>
                <View style={styles.resultStatIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.correct} />
                </View>
                <Text style={styles.resultStatValue}>{correctAnswers}</Text>
                <Text style={styles.resultStatLabel}>{t('games.quickMath.correct')}</Text>
              </View>

              <View style={styles.resultStatDivider} />

              <View style={styles.resultStat}>
                <View style={styles.resultStatIconContainer}>
                  <Ionicons name="analytics" size={24} color={COLORS.cyan} />
                </View>
                <Text style={styles.resultStatValue}>{getAccuracy()}%</Text>
                <Text style={styles.resultStatLabel}>{t('profile.statistics')}</Text>
              </View>

              <View style={styles.resultStatDivider} />

              <View style={styles.resultStat}>
                <View style={styles.resultStatIconContainer}>
                  <Text style={styles.streakEmoji}>!</Text>
                </View>
                <Text style={styles.resultStatValue}>{bestStreak}</Text>
                <Text style={styles.resultStatLabel}>{t('profile.bestStreak')}</Text>
              </View>
            </View>

            {bestStreak >= 5 && (
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementEmoji}>!</Text>
                <Text style={styles.achievementText}>
                  {bestStreak >= 10 ? 'ON FIRE!' : 'HOT STREAK!'}
                </Text>
              </View>
            )}

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
              <Text style={styles.playAgainText}>{t('games.quickMath.playAgain')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  levelUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  levelUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  levelUpText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  levelUpDifficulty: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
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
    marginBottom: 32,
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
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  rulesContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  ruleItem: {
    alignItems: 'center',
    gap: 8,
  },
  ruleBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rulePoints: {
    fontSize: 18,
    fontWeight: '800',
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  difficultyInfo: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  difficultyInfoTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  difficultyLevels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  difficultyLevelText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  gameHeader: {
    marginBottom: 24,
  },
  timerBarContainer: {
    height: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
  },
  timerBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  timerBarGradient: {
    flex: 1,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: COLORS.wrong,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  difficultyDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  streakContainer: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
  },
  streakActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.3)',
  },
  streakFlame: {
    fontSize: 18,
    color: COLORS.energy,
    fontWeight: '900',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.energy,
    fontVariant: ['tabular-nums'],
  },

  // Equation
  equationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  equationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 32,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    minWidth: 280,
    alignItems: 'center',
  },
  equationText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  floatingPoints: {
    position: 'absolute',
    top: '30%',
  },
  floatingPointsText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.correct,
    textShadowColor: COLORS.correct,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Answer buttons
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 32,
  },
  answerButtonWrapper: {
    width: '45%',
  },
  answerButton: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  answerButtonCorrect: {
    backgroundColor: COLORS.correct + '20',
  },
  answerButtonWrong: {
    backgroundColor: COLORS.wrong + '20',
  },
  answerButtonText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  answerButtonTextCorrect: {
    color: COLORS.correct,
  },
  answerButtonTextWrong: {
    color: COLORS.wrong,
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
    padding: 32,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  resultScoreNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.energy,
    lineHeight: 80,
  },
  resultScoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },
  resultStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  resultStat: {
    alignItems: 'center',
    minWidth: 80,
  },
  resultStatIconContainer: {
    marginBottom: 8,
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  resultStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  streakEmoji: {
    fontSize: 24,
    color: COLORS.energy,
    fontWeight: '900',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  achievementEmoji: {
    fontSize: 18,
    color: COLORS.energy,
    fontWeight: '900',
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.energy,
    letterSpacing: 1,
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  playAgainButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  playAgainText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import {
  Confetti,
  SparkleEffect,
  FloatingXP,
  useFloatingXP,
  SuccessOverlay,
} from '../../src/components/effects';
import { useEventStore } from '../../src/store/eventStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Game Color Palette
const COLORS = {
  background: '#0F0F23',
  cardBg: '#1A1A2E',
  primary: '#7C3AED',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F97316',
  energy: '#FACC15',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  cyan: '#06B6D4',
};

type Phase = 'intro' | 'question' | 'reveal' | 'results';

interface QuestionResult {
  questionIndex: number;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  xpEarned: number;
}

export default function PollScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const { todayEvent, submitEvent } = useEventStore();

  // Floating XP hook for dynamic XP displays
  const { instances: xpInstances, showXP, removeInstance } = useFloatingXP();

  // Animations
  const crystalBallAnim = useRef(new Animated.Value(0)).current;
  const crystalBallScale = useRef(new Animated.Value(1)).current;
  const introTextAnim = useRef(new Animated.Value(0)).current;
  const optionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const selectedGlowAnim = useRef(new Animated.Value(0)).current;
  const lockedInAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const resultCardAnim = useRef(new Animated.Value(0)).current;

  const event = todayEvent.event;
  const question = event?.poll_question || 'What would you rather do this weekend?';
  const options = event?.poll_options || [
    'Stay home and relax',
    'Go on an adventure',
    'Hang out with friends',
    'Learn something new',
  ];

  // Intro animation
  useEffect(() => {
    if (phase === 'intro') {
      // Crystal ball floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(crystalBallAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(crystalBallAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Crystal ball pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(crystalBallScale, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(crystalBallScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Text fade in
      Animated.timing(introTextAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  // Question phase animations
  useEffect(() => {
    if (phase === 'question') {
      // Animate options sliding in
      optionAnims.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });

      // Start timer pulse when low
      if (timeLeft <= 10) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(timerPulseAnim, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(timerPulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [phase, timeLeft]);

  // Timer countdown
  useEffect(() => {
    if (phase === 'question' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          if (prev <= 5) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, currentQuestionIndex]);

  const handleTimeUp = () => {
    if (selectedOption === null) {
      // Auto-select random option if time runs out
      const randomOption = Math.floor(Math.random() * options.length);
      handleOptionSelect(randomOption);
    }
  };

  const handleOptionSelect = async (index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Glow animation on selected option
    Animated.timing(selectedGlowAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Locked in animation
    Animated.sequence([
      Animated.timing(lockedInAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(lockedInAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait for locked in animation then show reveal
    setTimeout(() => {
      showReveal(index);
    }, 1200);
  };

  const showReveal = (selectedIdx: number) => {
    setPhase('reveal');

    // Simulate correct answer (in real app, this would come from API)
    const correctOption = Math.floor(Math.random() * options.length);
    const isCorrect = selectedIdx === correctOption;
    const xpEarned = isCorrect ? 10 : 0;

    const result: QuestionResult = {
      questionIndex: currentQuestionIndex,
      selectedOption: selectedIdx,
      correctOption,
      isCorrect,
      xpEarned,
    };

    setResults((prev) => [...prev, result]);

    // Reveal animation
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Show floating XP when correct
      showXP(10, SCREEN_WIDTH / 2 - 30, 200);
      // Brief success overlay for correct answers
      setShowCorrectOverlay(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleNextQuestion = () => {
    // Reset for next question
    setSelectedOption(null);
    setTimeLeft(30);
    revealAnim.setValue(0);
    selectedGlowAnim.setValue(0);
    optionAnims.forEach((anim) => anim.setValue(0));
    setShowCorrectOverlay(false);

    if (currentQuestionIndex < 4) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setPhase('question');
    } else {
      showFinalResults();
    }
  };

  const showFinalResults = () => {
    setPhase('results');

    const totalCorrect = results.filter((r) => r.isCorrect).length;
    const totalXP = results.reduce((sum, r) => sum + r.xpEarned, 0);

    // Show epic confetti if good score (3+ correct)
    if (totalCorrect >= 3) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate results card
    Animated.spring(resultCardAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate XP counter
    Animated.timing(xpCountAnim, {
      toValue: totalXP,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('question');
  };

  const handleSubmit = async () => {
    if (!event) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error } = await submitEvent(event.id, {
      selected_option: selectedOption,
      selected_answer: options[selectedOption ?? 0],
      results: results,
      total_correct: results.filter((r) => r.isCorrect).length,
      total_xp: results.reduce((sum, r) => sum + r.xpEarned, 0),
    });

    setIsSubmitting(false);

    if (!error) {
      router.back();
    }
  };

  const crystalBallTranslateY = crystalBallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const totalCorrect = results.filter((r) => r.isCorrect).length;
  const totalXP = results.reduce((sum, r) => sum + r.xpEarned, 0);
  const lastResult = results[results.length - 1];

  // Determine confetti intensity based on score
  const getConfettiIntensity = () => {
    if (totalCorrect === 5) return 'large';
    if (totalCorrect >= 4) return 'medium';
    return 'small';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Epic Confetti - now using the new component */}
      <Confetti
        active={showConfetti}
        intensity={getConfettiIntensity()}
        duration={3000}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Floating XP instances */}
      {xpInstances.map((instance) => (
        <FloatingXP
          key={instance.id}
          amount={instance.amount}
          startX={instance.x}
          startY={instance.y}
          onComplete={() => removeInstance(instance.id)}
        />
      ))}

      {/* Success overlay for correct answers */}
      <SuccessOverlay
        visible={showCorrectOverlay}
        title="CORRECT!"
        xpEarned={10}
        icon="checkmark"
        autoDismissMs={1500}
        onDismiss={() => setShowCorrectOverlay(false)}
        showConfetti={false}
      />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <View style={styles.introContainer}>
          <Animated.View
            style={[
              styles.crystalBallContainer,
              {
                transform: [
                  { translateY: crystalBallTranslateY },
                  { scale: crystalBallScale },
                ],
              },
            ]}
          >
            <SparkleEffect active intensity="medium">
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary, COLORS.cyan]}
                style={styles.crystalBall}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.crystalBallInner}>
                  <Ionicons name="eye" size={48} color={COLORS.textPrimary} />
                </View>
              </LinearGradient>
            </SparkleEffect>
            <View style={styles.crystalBallGlow} />
          </Animated.View>

          <Animated.View style={[styles.introTextContainer, { opacity: introTextAnim }]}>
            <Text style={styles.introTitle}>PREDICTION TIME</Text>
            <Text style={styles.introSubtitle}>
              Can you guess what your squad will answer?
            </Text>
            <View style={styles.introStats}>
              <View style={styles.introStatItem}>
                <Ionicons name="help-circle" size={24} color={COLORS.energy} />
                <Text style={styles.introStatText}>5 Questions</Text>
              </View>
              <SparkleEffect active intensity="low">
                <View style={styles.introStatItem}>
                  <Ionicons name="star" size={24} color={COLORS.energy} />
                  <Text style={styles.introStatText}>+50 XP Max</Text>
                </View>
              </SparkleEffect>
            </View>
          </Animated.View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startButtonText}>START PREDICTING</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* QUESTION PHASE */}
      {phase === 'question' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.questionContent}
        >
          {/* Progress dots */}
          <View style={styles.progressContainer}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1} of 5
            </Text>
            <View style={styles.progressDots}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressDot,
                    idx < currentQuestionIndex && styles.progressDotComplete,
                    idx === currentQuestionIndex && styles.progressDotCurrent,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Timer */}
          <Animated.View
            style={[
              styles.timerContainer,
              timeLeft <= 10 && styles.timerContainerUrgent,
              { transform: [{ scale: timeLeft <= 10 ? timerPulseAnim : 1 }] },
            ]}
          >
            <Ionicons
              name="time"
              size={20}
              color={timeLeft <= 10 ? COLORS.warning : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.timerText,
                timeLeft <= 10 && styles.timerTextUrgent,
              ]}
            >
              {timeLeft}s
            </Text>
          </Animated.View>

          {/* Question */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => {
              const isSelected = selectedOption === index;
              const translateY = optionAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              });
              const opacity = optionAnims[index];

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.optionWrapper,
                    { transform: [{ translateY }], opacity },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleOptionSelect(index)}
                    disabled={selectedOption !== null}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <Animated.View
                        style={[
                          styles.optionGlow,
                          { opacity: selectedGlowAnim },
                        ]}
                      />
                    )}
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionLetter,
                          isSelected && styles.optionLetterSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetterText,
                            isSelected && styles.optionLetterTextSelected,
                          ]}
                        >
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Locked In Overlay */}
          <Animated.View
            style={[
              styles.lockedInOverlay,
              {
                opacity: lockedInAnim,
                transform: [
                  {
                    scale: lockedInAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.lockedInBadge}
            >
              <Ionicons name="lock-closed" size={24} color="#fff" />
              <Text style={styles.lockedInText}>LOCKED IN!</Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      )}

      {/* REVEAL PHASE */}
      {phase === 'reveal' && lastResult && (
        <View style={styles.revealContainer}>
          <Animated.View
            style={[
              styles.revealCard,
              {
                opacity: revealAnim,
                transform: [
                  {
                    scale: revealAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {lastResult.isCorrect ? (
              <>
                <SparkleEffect active intensity="high">
                  <View style={styles.revealIconSuccess}>
                    <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                  </View>
                </SparkleEffect>
                <Text style={styles.revealTitleSuccess}>CORRECT!</Text>
                <Text style={styles.revealXP}>+10 XP</Text>
              </>
            ) : (
              <>
                <View style={styles.revealIconFail}>
                  <Ionicons name="close-circle" size={64} color={COLORS.warning} />
                </View>
                <Text style={styles.revealTitleFail}>NOPE!</Text>
                <Text style={styles.revealSubtitle}>
                  The answer was: {options[lastResult.correctOption]}
                </Text>
              </>
            )}

            <View style={styles.revealProgress}>
              <Text style={styles.revealProgressText}>
                {totalCorrect} / {results.length} correct so far
              </Text>
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextQuestion}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestionIndex < 4 ? 'NEXT QUESTION' : 'SEE RESULTS'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* RESULTS PHASE */}
      {phase === 'results' && (
        <View style={styles.resultsContainer}>
          <Animated.View
            style={[
              styles.resultsCard,
              {
                transform: [
                  {
                    scale: resultCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: resultCardAnim,
              },
            ]}
          >
            <Text style={styles.resultsTitle}>PREDICTION COMPLETE!</Text>

            <View style={styles.resultsScoreContainer}>
              <View style={styles.resultsScore}>
                <Text style={styles.resultsScoreNumber}>{totalCorrect}</Text>
                <Text style={styles.resultsScoreLabel}>/ 5 Correct</Text>
              </View>
              <SparkleEffect active={totalCorrect >= 3} intensity="high">
                <View style={styles.resultsXP}>
                  <Ionicons name="star" size={32} color={COLORS.energy} />
                  <Text style={styles.resultsXPText}>+{totalXP} XP</Text>
                </View>
              </SparkleEffect>
            </View>

            {totalCorrect >= 4 && (
              <SparkleEffect active intensity="high">
                <View style={styles.resultsAchievement}>
                  <Ionicons name="trophy" size={24} color={COLORS.energy} />
                  <Text style={styles.resultsAchievementText}>
                    {totalCorrect === 5 ? 'PERFECT SCORE!' : 'AMAZING JOB!'}
                  </Text>
                </View>
              </SparkleEffect>
            )}

            {totalCorrect < 3 && (
              <Text style={styles.resultsEncouragement}>
                Keep playing to learn your squad better!
              </Text>
            )}

            <View style={styles.resultsBreakdown}>
              {results.map((result, index) => (
                <View key={index} style={styles.resultsBreakdownItem}>
                  <Text style={styles.resultsBreakdownQuestion}>Q{index + 1}</Text>
                  <Ionicons
                    name={result.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={result.isCorrect ? COLORS.success : COLORS.warning}
                  />
                </View>
              ))}
            </View>

            <Button
              title={isSubmitting ? 'Submitting...' : 'FINISH'}
              onPress={handleSubmit}
              loading={isSubmitting}
              size="large"
              style={styles.finishButton}
            />
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
  scrollView: {
    flex: 1,
  },

  // INTRO STYLES
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  crystalBallContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  crystalBall: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  crystalBallInner: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalBallGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    top: -20,
  },
  introTextContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  introTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  introSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  introStats: {
    flexDirection: 'row',
    gap: 32,
  },
  introStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  introStatText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    maxWidth: 300,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },

  // QUESTION STYLES
  questionContent: {
    padding: 24,
    paddingTop: 80,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumber: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  progressDotComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  progressDotCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignSelf: 'center',
  },
  timerContainerUrgent: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  timerTextUrgent: {
    color: COLORS.warning,
  },
  questionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionWrapper: {
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 16,
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  optionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterSelected: {
    backgroundColor: COLORS.primary,
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionLetterTextSelected: {
    color: COLORS.textPrimary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  lockedInOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
  },
  lockedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  lockedInText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },

  // REVEAL STYLES
  revealContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  revealCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  revealIconSuccess: {
    marginBottom: 16,
  },
  revealIconFail: {
    marginBottom: 16,
  },
  revealTitleSuccess: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 2,
    marginBottom: 8,
  },
  revealTitleFail: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.warning,
    letterSpacing: 2,
    marginBottom: 8,
  },
  revealXP: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.energy,
    marginBottom: 24,
  },
  revealSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  revealProgress: {
    marginBottom: 32,
  },
  revealProgressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nextButton: {
    width: '100%',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // RESULTS STYLES
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultsCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultsScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 24,
  },
  resultsScore: {
    alignItems: 'center',
  },
  resultsScoreNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.primary,
  },
  resultsScoreLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  resultsXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  resultsXPText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.energy,
  },
  resultsAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  resultsAchievementText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.energy,
    letterSpacing: 1,
  },
  resultsEncouragement: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  resultsBreakdown: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  resultsBreakdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  resultsBreakdownQuestion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  finishButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
  },
});

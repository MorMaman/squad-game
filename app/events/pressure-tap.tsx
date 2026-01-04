import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Button } from '../../src/components/Button';
import { ActivePowersBanner } from '../../src/components/ActivePowersBanner';
import {
  Confetti,
  SparkleEffect,
  FloatingXP,
  useFloatingXP,
  SuccessOverlay,
  PulsingGlow,
} from '../../src/components/effects';
import { useEventStore } from '../../src/store/eventStore';
import { usePowerStore } from '../../src/store/powerStore';
import { PowerType } from '../../src/types/powers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game Color Palette
const COLORS = {
  background: '#0F0F23',
  cardBg: '#1A1A2E',
  primary: '#7C3AED',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F97316',
  energy: '#FACC15',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  cyan: '#06B6D4',
};

type Phase = 'ready' | 'countdown' | 'playing' | 'result' | 'submitting';

const GAME_DURATION = 10000; // 10 seconds
const MILESTONE_INTERVAL = 10; // Special feedback every 10 taps

export default function PressureTapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('ready');
  const [tapCount, setTapCount] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const { todayEvent, submitEvent } = useEventStore();
  const { activePowers } = usePowerStore();

  // Get current user's active powers for this event
  const myActivePowers = activePowers.filter(p => p.used_at === null && new Date(p.expires_at) > new Date());

  // Floating XP hook
  const { instances: xpInstances, showXP, removeInstance } = useFloatingXP();

  // Mock data - in real app would come from store/API
  const personalBest = 87;
  const squadBest = { name: 'mike', score: 102 };

  // Animation refs
  const countdownScaleAnim = useRef(new Animated.Value(0)).current;
  const countdownOpacityAnim = useRef(new Animated.Value(1)).current;
  const tapCounterScaleAnim = useRef(new Animated.Value(1)).current;
  const tapCounterColorAnim = useRef(new Animated.Value(0)).current;
  const screenFlashAnim = useRef(new Animated.Value(0)).current;
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const milestoneTextAnim = useRef(new Animated.Value(0)).current;
  const borderPulseAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const tapButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [milestoneText, setMilestoneText] = useState('');

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

          // Red pulsing border in final 3 seconds
          if (remaining <= 3000 && remaining > 0) {
            Animated.sequence([
              Animated.timing(borderPulseAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(borderPulseAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
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

  const animateCountdown = () => {
    const animateNumber = (num: number, callback?: () => void) => {
      setCountdownValue(num);
      countdownScaleAnim.setValue(0);
      countdownOpacityAnim.setValue(1);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      Animated.parallel([
        Animated.spring(countdownScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(countdownOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (callback) callback();
      });
    };

    animateNumber(3, () => {
      setTimeout(() => {
        animateNumber(2, () => {
          setTimeout(() => {
            animateNumber(1, () => {
              setTimeout(() => {
                // Show GO!
                setCountdownValue(0);
                countdownScaleAnim.setValue(0);
                countdownOpacityAnim.setValue(1);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                Animated.parallel([
                  Animated.spring(countdownScaleAnim, {
                    toValue: 1.2,
                    tension: 100,
                    friction: 6,
                    useNativeDriver: true,
                  }),
                  Animated.sequence([
                    Animated.delay(500),
                    Animated.timing(countdownOpacityAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                  ]),
                ]).start(() => {
                  setPhase('playing');
                });
              }, 300);
            });
          }, 1000);
        });
      }, 1000);
    });
  };

  const handleTap = useCallback(() => {
    if (phase !== 'playing') return;

    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Haptic feedback on every tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Counter bounce animation
    Animated.sequence([
      Animated.timing(tapCounterScaleAnim, {
        toValue: 1.15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(tapCounterScaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Button press animation
    Animated.sequence([
      Animated.timing(tapButtonScaleAnim, {
        toValue: 0.95,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(tapButtonScaleAnim, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Screen flash on every tap
    Animated.sequence([
      Animated.timing(screenFlashAnim, {
        toValue: 0.15,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(screenFlashAnim, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();

    // Screen shake (subtle)
    const shakeDirection = Math.random() > 0.5 ? 1 : -1;
    Animated.sequence([
      Animated.timing(screenShakeAnim, {
        toValue: shakeDirection * 3,
        duration: 25,
        useNativeDriver: true,
      }),
      Animated.timing(screenShakeAnim, {
        toValue: 0,
        duration: 25,
        useNativeDriver: true,
      }),
    ]).start();

    // Milestone feedback every 10 taps
    if (newCount % MILESTONE_INTERVAL === 0) {
      triggerMilestone(newCount);
    }
  }, [phase, tapCount]);

  const triggerMilestone = (count: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const messages = ['GREAT!', 'AMAZING!', 'INCREDIBLE!', 'UNSTOPPABLE!', 'LEGENDARY!'];
    const messageIndex = Math.min(Math.floor(count / MILESTONE_INTERVAL) - 1, messages.length - 1);
    setMilestoneText(messages[messageIndex]);

    // Show floating XP for milestones
    const xpAmount = messageIndex >= 3 ? 5 : 2;
    showXP(xpAmount, SCREEN_WIDTH / 2 - 20, SCREEN_HEIGHT / 3);

    // Reset and animate milestone
    milestoneAnim.setValue(0);
    milestoneTextAnim.setValue(0);

    Animated.parallel([
      Animated.spring(milestoneAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(milestoneTextAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(milestoneTextAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const endGame = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const isNewBest = tapCount > personalBest;
    setIsNewPersonalBest(isNewBest);
    setPhase('result');

    // Result card animation
    Animated.spring(resultScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // XP counter animation
    Animated.timing(xpAnim, {
      toValue: calculateXP(),
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Epic confetti if good score or new personal best
    if (tapCount >= 50 || isNewBest) {
      setShowConfetti(true);
    }

    // Show success overlay for high scores
    if (tapCount >= 75 || isNewBest) {
      setTimeout(() => {
        setShowSuccessOverlay(true);
      }, 500);
    }
  };

  const calculateXP = () => {
    let xp = 25; // Base participation
    if (tapCount >= 100) xp += 75; // Elite bonus
    else if (tapCount >= 75) xp += 50;
    else if (tapCount >= 50) xp += 25;
    if (isNewPersonalBest) xp += 25;
    return xp;
  };

  const getRank = () => {
    if (tapCount >= 100) return 1;
    if (tapCount >= 90) return 2;
    if (tapCount >= 80) return 3;
    if (tapCount >= 70) return 4;
    if (tapCount >= 60) return 5;
    return 6;
  };

  const getConfettiIntensity = () => {
    if (tapCount >= 100 || isNewPersonalBest) return 'large';
    if (tapCount >= 75) return 'medium';
    return 'small';
  };

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('countdown');
    setTapCount(0);
    setTimeLeft(GAME_DURATION);
  };

  const handleSubmit = async () => {
    if (!todayEvent.event) return;

    setPhase('submitting');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error } = await submitEvent(todayEvent.event.id, {
      tap_count: tapCount,
      duration_ms: GAME_DURATION,
      xp_earned: calculateXP(),
      is_personal_best: isNewPersonalBest,
    });

    if (error) {
      setPhase('result');
    } else {
      router.back();
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  };

  const borderPulseOpacity = borderPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Epic Confetti */}
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

      {/* Success overlay for high scores */}
      <SuccessOverlay
        visible={showSuccessOverlay}
        title={isNewPersonalBest ? 'NEW RECORD!' : 'AWESOME!'}
        subtitle={isNewPersonalBest ? `You beat your previous best of ${personalBest}!` : undefined}
        xpEarned={calculateXP()}
        icon={isNewPersonalBest ? 'trophy' : 'star'}
        autoDismissMs={2500}
        onDismiss={() => setShowSuccessOverlay(false)}
        showConfetti={false}
      />

      {/* Screen flash overlay */}
      <Animated.View
        style={[
          styles.screenFlash,
          { opacity: screenFlashAnim },
        ]}
        pointerEvents="none"
      />

      {/* Screen shake wrapper */}
      <Animated.View
        style={[
          styles.shakeWrapper,
          { transform: [{ translateX: screenShakeAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* READY PHASE */}
        {phase === 'ready' && (
          <View style={styles.readyContainer}>
            {/* Active Powers Banner */}
            {myActivePowers.length > 0 && (
              <ActivePowersBanner
                activePowers={myActivePowers.map(p => ({
                  type: p.power_type,
                  expiresAt: p.expires_at,
                }))}
              />
            )}

            <View style={styles.readyIconContainer}>
              <SparkleEffect active intensity="medium">
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.readyIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="flash" size={48} color={COLORS.textPrimary} />
                </LinearGradient>
              </SparkleEffect>
            </View>

            <Text style={styles.readyTitle}>{t('events.pressureTap.title', 'PRESSURE TAP')}</Text>
            <Text style={styles.readySubtitle}>
              {t('events.pressureTap.subtitle', 'Tap as fast as you can for 10 seconds!')}
            </Text>

            <View style={styles.statsContainer}>
              <SparkleEffect active={personalBest >= 80} intensity="low">
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="trophy" size={20} color={COLORS.energy} />
                  </View>
                  <Text style={styles.statLabel}>{t('events.stats.yourBest', 'Your Best')}</Text>
                  <Text style={styles.statValue}>{personalBest} {t('events.stats.taps', 'taps')}</Text>
                </View>
              </SparkleEffect>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="ribbon" size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.statLabel}>{t('events.stats.squadBest', 'Squad Best')}</Text>
                <Text style={styles.statValue}>
                  @{squadBest.name}: {squadBest.score}
                </Text>
              </View>
            </View>

            <PulsingGlow color={COLORS.primary} intensity={0.7} active>
              <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play" size={28} color="#fff" />
                  <Text style={styles.startButtonText}>{t('events.actions.startGame', 'START GAME')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </PulsingGlow>
          </View>
        )}

        {/* COUNTDOWN PHASE */}
        {phase === 'countdown' && (
          <View style={styles.countdownContainer}>
            <Animated.View
              style={[
                styles.countdownNumber,
                {
                  transform: [{ scale: countdownScaleAnim }],
                  opacity: countdownOpacityAnim,
                },
              ]}
            >
              <Text style={styles.countdownText}>
                {countdownValue === 0 ? t('events.countdown.go', 'GO!') : countdownValue}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* PLAYING PHASE */}
        {phase === 'playing' && (
          <View style={styles.playingContainer}>
            {/* Red pulsing border in final seconds */}
            <Animated.View
              style={[
                styles.urgentBorder,
                { opacity: borderPulseOpacity },
              ]}
              pointerEvents="none"
            />

            {/* Timer */}
            <View style={[
              styles.timerContainer,
              timeLeft <= 3000 && styles.timerContainerUrgent,
            ]}>
              <Ionicons
                name="time"
                size={24}
                color={timeLeft <= 3000 ? COLORS.danger : COLORS.textSecondary}
              />
              <Text style={[
                styles.timerText,
                timeLeft <= 3000 && styles.timerTextUrgent,
              ]}>
                {formatTime(timeLeft)}s
              </Text>
            </View>

            {/* Giant tap counter */}
            <Animated.View
              style={[
                styles.tapCounterContainer,
                { transform: [{ scale: tapCounterScaleAnim }] },
              ]}
            >
              <Text style={styles.tapCounter}>{tapCount}</Text>
              <Text style={styles.tapCounterLabel}>{t('events.stats.tapsLabel', 'TAPS')}</Text>
            </Animated.View>

            {/* Milestone text */}
            <Animated.View
              style={[
                styles.milestoneContainer,
                {
                  opacity: milestoneTextAnim,
                  transform: [
                    {
                      translateY: milestoneTextAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                    {
                      scale: milestoneTextAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[COLORS.energy, COLORS.warning]}
                style={styles.milestoneBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.milestoneText}>{milestoneText}</Text>
              </LinearGradient>
            </Animated.View>

            {/* TAP ZONE */}
            <Animated.View
              style={[
                styles.tapZoneWrapper,
                { transform: [{ scale: tapButtonScaleAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.tapZone}
                onPress={handleTap}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.tapZoneGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.tapZoneInner}>
                    <Ionicons name="finger-print" size={64} color={COLORS.textPrimary} />
                    <Text style={styles.tapZoneText}>{t('events.pressureTap.tapHere', 'TAP HERE!')}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* RESULT PHASE */}
        {(phase === 'result' || phase === 'submitting') && (
          <View style={styles.resultContainer}>
            <Animated.View
              style={[
                styles.resultCard,
                {
                  transform: [
                    {
                      scale: resultScaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: resultScaleAnim,
                },
              ]}
            >
              <View style={styles.resultHeader}>
                <SparkleEffect active={tapCount >= 75} intensity="high">
                  <LinearGradient
                    colors={[COLORS.warning, COLORS.secondary]}
                    style={styles.explosionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="flash" size={40} color="#fff" />
                  </LinearGradient>
                </SparkleEffect>
                <Text style={styles.resultTitle}>{t('events.result.timesUp', "TIME'S UP!")}</Text>
              </View>

              <View style={styles.resultScoreContainer}>
                <Text style={styles.resultScoreNumber}>{tapCount}</Text>
                <Text style={styles.resultScoreLabel}>{t('events.stats.tapsLabel', 'TAPS')}</Text>
              </View>

              {isNewPersonalBest && (
                <SparkleEffect active intensity="high">
                  <View style={styles.personalBestBadge}>
                    <Ionicons name="trophy" size={20} color={COLORS.energy} />
                    <Text style={styles.personalBestText}>{t('events.result.newPersonalBest', 'NEW PERSONAL BEST!')}</Text>
                  </View>
                </SparkleEffect>
              )}

              <View style={styles.resultStatsRow}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>{t('events.result.xpEarned', 'XP Earned')}</Text>
                  <SparkleEffect active={calculateXP() >= 75} intensity="medium">
                    <View style={styles.resultStatValueRow}>
                      <Ionicons name="star" size={20} color={COLORS.energy} />
                      <Text style={styles.resultStatValue}>+{calculateXP()}</Text>
                    </View>
                  </SparkleEffect>
                </View>
                <View style={styles.resultStatDivider} />
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>{t('events.result.squadRank', 'Squad Rank')}</Text>
                  <View style={styles.resultStatValueRow}>
                    <Ionicons name="podium" size={20} color={COLORS.primary} />
                    <Text style={styles.resultStatValue}>#{getRank()}</Text>
                  </View>
                </View>
              </View>

              {tapCount < personalBest && (
                <Text style={styles.resultEncouragement}>
                  {t('events.result.moreToBeat', '{{count}} more to beat your best!', { count: personalBest - tapCount })}
                </Text>
              )}

              <Button
                title={phase === 'submitting' ? t('events.actions.submitting', 'Submitting...') : t('events.actions.submitScore', 'SUBMIT SCORE')}
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
                <Text style={styles.playAgainText}>{t('events.actions.tryAgain', 'Try Again')}</Text>
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
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.textPrimary,
    zIndex: 100,
  },
  shakeWrapper: {
    flex: 1,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  statCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
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
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
  },
  urgentBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 6,
    borderColor: COLORS.danger,
    borderRadius: 0,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
  },
  timerContainerUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: COLORS.danger,
  },
  tapCounterContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  tapCounter: {
    fontSize: 120,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: 130,
  },
  tapCounterLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 4,
    marginTop: -10,
  },
  milestoneContainer: {
    position: 'absolute',
    top: '35%',
    alignItems: 'center',
    zIndex: 50,
  },
  milestoneBadge: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  milestoneText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 2,
  },
  tapZoneWrapper: {
    width: '100%',
    paddingHorizontal: 24,
  },
  tapZone: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tapZoneGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  tapZoneInner: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(15, 15, 35, 0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZoneText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    letterSpacing: 2,
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
  explosionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  resultScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultScoreNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 90,
  },
  resultScoreLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },
  personalBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  personalBestText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.energy,
    letterSpacing: 1,
  },
  resultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  resultStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  resultEncouragement: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
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

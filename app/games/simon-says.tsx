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
  withRepeat,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useGameSounds } from '../../src/hooks/useGameSounds';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simon Says Color Palette
const COLORS = {
  background: '#0A0E27',
  cardBg: '#141832',
  // Simon buttons
  red: '#FF4757',
  redActive: '#FF6B7A',
  redDim: '#CC3A47',
  blue: '#00D4FF',
  blueActive: '#4DE4FF',
  blueDim: '#00A8CC',
  green: '#00FF87',
  greenActive: '#4DFFA8',
  greenDim: '#00CC6C',
  yellow: '#FFD700',
  yellowActive: '#FFE44D',
  yellowDim: '#CCAC00',
  // UI colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  textMuted: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F97316',
  primary: '#7C3AED',
  secondary: '#EC4899',
  energy: '#FACC15',
};

type GamePhase = 'ready' | 'watching' | 'playing' | 'success' | 'gameover';
type SimonButton = 'red' | 'blue' | 'green' | 'yellow';

const BUTTON_POSITIONS: Record<SimonButton, { top?: number; bottom?: number; left?: number; right?: number }> = {
  red: { top: 0, left: 0 },
  blue: { top: 0, right: 0 },
  green: { bottom: 0, left: 0 },
  yellow: { bottom: 0, right: 0 },
};

const BUTTON_COLORS: Record<SimonButton, { idle: string; active: string; dim: string }> = {
  red: { idle: COLORS.red, active: COLORS.redActive, dim: COLORS.redDim },
  blue: { idle: COLORS.blue, active: COLORS.blueActive, dim: COLORS.blueDim },
  green: { idle: COLORS.green, active: COLORS.greenActive, dim: COLORS.greenDim },
  yellow: { idle: COLORS.yellow, active: COLORS.yellowActive, dim: COLORS.yellowDim },
};

// Haptic patterns for each button
const HAPTIC_PATTERNS: Record<SimonButton, Haptics.ImpactFeedbackStyle> = {
  red: Haptics.ImpactFeedbackStyle.Heavy,
  blue: Haptics.ImpactFeedbackStyle.Medium,
  green: Haptics.ImpactFeedbackStyle.Light,
  yellow: Haptics.ImpactFeedbackStyle.Rigid,
};

const SEQUENCE_INTERVAL = 500; // Time between sequence plays
const LIGHT_DURATION = 300; // How long button stays lit

export default function SimonSaysScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { playSound, playSimonNote, initAudio } = useGameSounds();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [sequence, setSequence] = useState<SimonButton[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [level, setLevel] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeButton, setActiveButton] = useState<SimonButton | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Reanimated shared values
  const centerScale = useSharedValue(1);
  const centerGlow = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const levelPop = useSharedValue(1);
  const gameOverScale = useSharedValue(0);

  // Button animation values
  const redGlow = useSharedValue(0);
  const blueGlow = useSharedValue(0);
  const greenGlow = useSharedValue(0);
  const yellowGlow = useSharedValue(0);

  const redScale = useSharedValue(1);
  const blueScale = useSharedValue(1);
  const greenScale = useSharedValue(1);
  const yellowScale = useSharedValue(1);

  const redPulse = useSharedValue(0);
  const bluePulse = useSharedValue(0);
  const greenPulse = useSharedValue(0);
  const yellowPulse = useSharedValue(0);

  const buttonGlows: Record<SimonButton, Animated.SharedValue<number>> = {
    red: redGlow,
    blue: blueGlow,
    green: greenGlow,
    yellow: yellowGlow,
  };

  const buttonScales: Record<SimonButton, Animated.SharedValue<number>> = {
    red: redScale,
    blue: blueScale,
    green: greenScale,
    yellow: yellowScale,
  };

  const buttonPulses: Record<SimonButton, Animated.SharedValue<number>> = {
    red: redPulse,
    blue: bluePulse,
    green: greenPulse,
    yellow: yellowPulse,
  };

  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const centerScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
  }));

  const centerGlowStyle = useAnimatedStyle(() => ({
    opacity: centerGlow.value,
  }));

  const levelPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelPop.value }],
  }));

  const gameOverStyle = useAnimatedStyle(() => ({
    opacity: gameOverScale.value,
    transform: [{ scale: interpolate(gameOverScale.value, [0, 1], [0.8, 1]) }],
  }));

  // Start player turn pulse animation
  useEffect(() => {
    if (phase === 'playing') {
      const buttons: SimonButton[] = ['red', 'blue', 'green', 'yellow'];
      buttons.forEach((btn, index) => {
        buttonPulses[btn].value = withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      });
    } else {
      const buttons: SimonButton[] = ['red', 'blue', 'green', 'yellow'];
      buttons.forEach((btn) => {
        buttonPulses[btn].value = withTiming(0, { duration: 100 });
      });
    }
  }, [phase]);

  const generateNextButton = useCallback((): SimonButton => {
    const buttons: SimonButton[] = ['red', 'blue', 'green', 'yellow'];
    return buttons[Math.floor(Math.random() * 4)];
  }, []);

  const lightUpButton = useCallback((button: SimonButton, duration: number = LIGHT_DURATION) => {
    return new Promise<void>((resolve) => {
      setActiveButton(button);

      // Play unique note for each color
      playSimonNote(button);

      // Animate button glow
      buttonGlows[button].value = withTiming(1, { duration: 50 });
      buttonScales[button].value = withSpring(1.1, { damping: 8, stiffness: 100 });

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(HAPTIC_PATTERNS[button]);
      }

      setTimeout(() => {
        setActiveButton(null);
        buttonGlows[button].value = withTiming(0, { duration: 100 });
        buttonScales[button].value = withSpring(1, { damping: 8, stiffness: 100 });
        resolve();
      }, duration);
    });
  }, []);

  const playSequence = useCallback(async (seq: SimonButton[]) => {
    setPhase('watching');

    // Brief pause before starting
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let i = 0; i < seq.length; i++) {
      await lightUpButton(seq[i]);
      if (i < seq.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, SEQUENCE_INTERVAL - LIGHT_DURATION));
      }
    }

    // Transition to player's turn
    await new Promise((resolve) => setTimeout(resolve, 300));
    setPlayerIndex(0);
    setPhase('playing');
  }, [lightUpButton]);

  const startGame = useCallback(() => {
    initAudio(); // Initialize audio on first interaction
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    const firstButton = generateNextButton();
    setSequence([firstButton]);
    setLevel(1);
    setPlayerIndex(0);
    setIsNewHighScore(false);

    // Animate center
    centerScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    setTimeout(() => {
      playSequence([firstButton]);
    }, 500);
  }, [generateNextButton, playSequence]);

  const handleButtonPress = useCallback(async (button: SimonButton) => {
    if (phase !== 'playing') return;

    // Light up the pressed button
    await lightUpButton(button, 200);

    const expectedButton = sequence[playerIndex];

    if (button === expectedButton) {
      // Correct!
      if (playerIndex === sequence.length - 1) {
        // Completed the sequence!
        const newLevel = level + 1;
        setLevel(newLevel);

        // Check for high score
        const isNewBest = newLevel > highScore;
        if (isNewBest) {
          setHighScore(newLevel);
          setIsNewHighScore(true);
        }

        // Level up animation
        levelPop.value = withSequence(
          withTiming(1.3, { duration: 150 }),
          withSpring(1, { damping: 8, stiffness: 100 })
        );

        // Success sound and haptic
        playSound('success'); // Level complete sound
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        centerGlow.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 300 })
        );

        // Add next button to sequence
        setPhase('success');
        setTimeout(() => {
          const nextButton = generateNextButton();
          const newSequence = [...sequence, nextButton];
          setSequence(newSequence);
          playSequence(newSequence);
        }, 800);
      } else {
        // Move to next button in sequence
        setPlayerIndex(playerIndex + 1);
      }
    } else {
      // Wrong button - Game Over!
      setPhase('gameover');

      // Error sound and haptic
      playSound('gameOver'); // Game over sound
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Screen shake
      shakeX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Dim all buttons
      const buttons: SimonButton[] = ['red', 'blue', 'green', 'yellow'];
      buttons.forEach((btn) => {
        buttonGlows[btn].value = withTiming(-1, { duration: 300 });
      });

      // Game over overlay animation
      gameOverScale.value = withSpring(1, { damping: 10, stiffness: 50 });
    }
  }, [phase, sequence, playerIndex, level, highScore, lightUpButton, generateNextButton, playSequence]);

  const resetGame = useCallback(() => {
    setPhase('ready');
    setSequence([]);
    setPlayerIndex(0);
    setLevel(0);
    setActiveButton(null);
    setIsNewHighScore(false);

    gameOverScale.value = 0;

    const buttons: SimonButton[] = ['red', 'blue', 'green', 'yellow'];
    buttons.forEach((btn) => {
      buttonGlows[btn].value = 0;
      buttonScales[btn].value = 1;
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const getPhaseText = () => {
    switch (phase) {
      case 'ready':
        return t('game.tapToStart').toUpperCase();
      case 'watching':
        return t('games.simonSays.watch').toUpperCase();
      case 'playing':
        return t('games.simonSays.yourTurn').toUpperCase();
      case 'success':
        return t('games.simonSays.correct').toUpperCase();
      case 'gameover':
        return t('games.simonSays.gameOver').toUpperCase();
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'ready':
        return COLORS.textSecondary;
      case 'watching':
        return COLORS.warning;
      case 'playing':
        return COLORS.success;
      case 'success':
        return COLORS.energy;
      case 'gameover':
        return COLORS.danger;
    }
  };

  const renderSimonButton = (button: SimonButton) => {
    const position = BUTTON_POSITIONS[button];
    const colors = BUTTON_COLORS[button];

    const glowValue = buttonGlows[button];
    const scaleValue = buttonScales[button];
    const pulseValue = buttonPulses[button];

    const buttonAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const glowAnimStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        glowValue.value,
        [-1, 0, 1],
        [colors.dim, colors.idle, colors.active]
      ),
    }));

    const glowOpacityStyle = useAnimatedStyle(() => ({
      opacity: interpolate(glowValue.value, [-1, 0, 1], [0, 0.3, 1]),
    }));

    const pulseOpacityStyle = useAnimatedStyle(() => ({
      opacity: phase === 'playing' ? interpolate(pulseValue.value, [0, 1], [0, 0.3]) : 0,
    }));

    // Border radius for each quadrant
    const borderRadii = {
      red: { borderTopLeftRadius: 150, borderTopRightRadius: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
      blue: { borderTopLeftRadius: 12, borderTopRightRadius: 150, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
      green: { borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 150, borderBottomRightRadius: 12 },
      yellow: { borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 150 },
    };

    return (
      <Animated.View
        key={button}
        style={[
          styles.simonButtonWrapper,
          position,
          buttonAnimStyle,
        ]}
      >
        {/* Glow layer */}
        <Animated.View
          style={[
            styles.buttonGlow,
            borderRadii[button],
            { backgroundColor: colors.active },
            glowOpacityStyle,
          ]}
        />

        {/* Pulse layer for player turn */}
        <Animated.View
          style={[
            styles.buttonPulse,
            borderRadii[button],
            { borderColor: colors.active },
            pulseOpacityStyle,
          ]}
        />

        <TouchableOpacity
          style={[styles.simonButton]}
          onPress={() => handleButtonPress(button)}
          activeOpacity={0.8}
          disabled={phase !== 'playing'}
        >
          <Animated.View
            style={[
              styles.simonButtonInner,
              borderRadii[button],
              glowAnimStyle,
            ]}
          >
            {/* Inner gradient highlight */}
            <View style={[styles.buttonHighlight, borderRadii[button]]} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const calculateXP = () => {
    let xp = 10; // Base participation
    if (level >= 10) xp += 50;
    else if (level >= 5) xp += 25;
    if (isNewHighScore) xp += 25;
    return xp;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen shake wrapper */}
      <Animated.View style={[styles.mainContent, shakeStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>{t('games.simonSays.title').toUpperCase()}</Text>
          </View>

          <View style={styles.highScoreContainer}>
            <Ionicons name="trophy" size={16} color={COLORS.energy} />
            <Text style={styles.highScoreText}>{highScore}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          {/* Simon Grid */}
          <View style={styles.simonGrid}>
            {renderSimonButton('red')}
            {renderSimonButton('blue')}
            {renderSimonButton('green')}
            {renderSimonButton('yellow')}

            {/* Center Circle */}
            <Animated.View style={[styles.centerCircle, centerScaleStyle]}>
              {/* Center glow effect */}
              <Animated.View style={[styles.centerGlow, centerGlowStyle]} />

              <TouchableOpacity
                style={styles.centerButton}
                onPress={phase === 'ready' || phase === 'gameover' ? (phase === 'gameover' ? resetGame : startGame) : undefined}
                activeOpacity={phase === 'ready' || phase === 'gameover' ? 0.8 : 1}
              >
                <LinearGradient
                  colors={[COLORS.cardBg, '#1E2246']}
                  style={styles.centerGradient}
                >
                  {phase === 'ready' && (
                    <>
                      <Ionicons name="play" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.centerText}>{t('game.startGame').toUpperCase()}</Text>
                    </>
                  )}

                  {(phase === 'watching' || phase === 'playing' || phase === 'success') && (
                    <>
                      <Animated.Text style={[styles.levelNumber, levelPopStyle]}>
                        {level}
                      </Animated.Text>
                      <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
                        {getPhaseText()}
                      </Text>
                    </>
                  )}

                  {phase === 'gameover' && (
                    <>
                      <Ionicons name="refresh" size={32} color={COLORS.danger} />
                      <Text style={styles.gameOverText}>{t('games.simonSays.level').toUpperCase()} {level}</Text>
                      <Text style={styles.tryAgainText}>{t('game.playAgain').toUpperCase()}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Bottom Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('games.simonSays.level').toUpperCase()}</Text>
            <Text style={styles.statValue}>{level}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('game.round').toUpperCase()}</Text>
            <Text style={styles.statValue}>
              {phase === 'playing' ? `${playerIndex + 1}/${sequence.length}` : sequence.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('games.highScore').toUpperCase()}</Text>
            <View style={styles.statValueRow}>
              <Ionicons name="trophy" size={16} color={COLORS.energy} />
              <Text style={[styles.statValue, { color: COLORS.energy }]}>{highScore}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        {phase === 'ready' && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {t('games.simonSays.instructions')}
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const GRID_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const BUTTON_SIZE = (GRID_SIZE - 12) / 2;
const CENTER_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  highScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.energy,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  simonGrid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    position: 'relative',
  },
  simonButtonWrapper: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  buttonGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  buttonPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 3,
  },
  simonButton: {
    flex: 1,
  },
  simonButtonInner: {
    flex: 1,
    overflow: 'hidden',
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerCircle: {
    position: 'absolute',
    top: GRID_SIZE / 2 - CENTER_SIZE / 2,
    left: GRID_SIZE / 2 - CENTER_SIZE / 2,
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    zIndex: 10,
  },
  centerGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: (CENTER_SIZE + 20) / 2,
    backgroundColor: COLORS.success,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
        shadowOpacity: 0.8,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  centerButton: {
    flex: 1,
    borderRadius: CENTER_SIZE / 2,
    overflow: 'hidden',
  },
  centerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CENTER_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  centerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 1,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  phaseText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gameOverText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
    marginTop: 2,
  },
  tryAgainText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    marginHorizontal: 16,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  instructionsSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

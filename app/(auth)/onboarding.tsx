import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { AvatarIcon } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors from UX recommendations
const COLORS = {
  background: '#0F0F23',
  cardBg: '#1A1A2E',
  electricPurple: '#7C3AED',
  deepViolet: '#5B21B6',
  hotPink: '#EC4899',
  cyberCyan: '#06B6D4',
  neonYellow: '#FACC15',
  victoryGreen: '#10B981',
  fireOrange: '#F97316',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
};

// Avatar options with Ionicons
const AVATAR_OPTIONS: { icon: AvatarIcon; label: string; color: string }[] = [
  { icon: 'flame', label: 'Competitive', color: '#EF4444' },
  { icon: 'glasses', label: 'Cool', color: '#3B82F6' },
  { icon: 'flash', label: 'Speed', color: '#FACC15' },
  { icon: 'trophy', label: 'Winner', color: '#F59E0B' },
  { icon: 'hardware-chip', label: 'Robot', color: '#6366F1' },
  { icon: 'sparkles', label: 'Magical', color: '#EC4899' },
  { icon: 'skull', label: 'Danger', color: '#8B5CF6' },
  { icon: 'planet', label: 'Alien', color: '#06B6D4' },
];

// Poll options for training
const POLL_OPTIONS = [
  { id: 'cheetah', label: 'Cheetah', emoji: '1' },
  { id: 'ostrich', label: 'Ostrich', emoji: '2' },
  { id: 'roadrunner', label: 'Roadrunner', emoji: '3' },
  { id: 'usain', label: 'Usain Bolt', emoji: '4' },
];

// ============================================================
// Silhouette Item Component (separate to avoid hooks in loop)
// ============================================================
function SilhouetteItem({ index, delay }: { index: number; delay: number }) {
  const opacity = useSharedValue(0);
  const avatar = AVATAR_OPTIONS[index];

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: interpolate(opacity.value, [0, 1], [20, 0]) },
      { scale: interpolate(opacity.value, [0, 1], [0.8, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.silhouette, animStyle]}>
      <View style={[styles.silhouetteGlow, { backgroundColor: avatar.color }]} />
      <Ionicons name={avatar.icon as any} size={40} color={avatar.color} />
    </Animated.View>
  );
}

// ============================================================
// Floating particle component
// ============================================================
function FloatingParticle({ delay, initialX, color }: { delay: number; initialX: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const randomDuration = 3000 + Math.random() * 2000;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-SCREEN_HEIGHT * 0.5, { duration: randomDuration, easing: Easing.linear }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );

    opacity.value = withDelay(delay, withTiming(0.6, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        { left: initialX, backgroundColor: color },
      ]}
    />
  );
}

// ============================================================
// SCREEN 1: Epic Welcome
// ============================================================
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const titleScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Generate particles once
  const particles = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      id: i,
      delay: i * 100,
      x: Math.random() * SCREEN_WIDTH,
      color: Math.random() > 0.5 ? COLORS.electricPurple : COLORS.hotPink,
    })),
  []);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleScale.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  return (
    <View style={styles.screenContainer}>
      {/* Animated particles background effect */}
      <View style={styles.particlesContainer}>
        {particles.map((p) => (
          <FloatingParticle key={p.id} delay={p.delay} initialX={p.x} color={p.color} />
        ))}
      </View>

      <Animated.View style={[styles.welcomeContent, titleStyle]}>
        <Text style={styles.welcomeTitle}>YOUR SQUAD</Text>
        <Text style={styles.welcomeTitleGradient}>AWAITS</Text>
      </Animated.View>

      {/* Squad silhouettes */}
      <View style={styles.silhouettesContainer}>
        {[0, 1, 2, 3].map((index) => (
          <SilhouetteItem key={index} index={index} delay={300 + index * 200} />
        ))}
      </View>

      <Animated.Text
        entering={FadeInUp.delay(800).duration(500)}
        style={styles.welcomeSubtitle}
      >
        Daily challenges with friends.{'\n'}Prove who's the real MVP.
      </Animated.Text>

      <Animated.View
        entering={FadeInUp.delay(1000).duration(500)}
        style={styles.buttonContainer}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onNext}
        >
          <Animated.View style={[styles.primaryButton, buttonStyle]}>
            <LinearGradient
              colors={[COLORS.electricPurple, COLORS.hotPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>LET'S GO</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ============================================================
// SCREEN 2: Create Player Card
// ============================================================
function PlayerCardScreen({
  onNext,
  displayName,
  setDisplayName,
  selectedAvatar,
  setSelectedAvatar,
}: {
  onNext: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  selectedAvatar: AvatarIcon | null;
  setSelectedAvatar: (avatar: AvatarIcon) => void;
}) {
  const [error, setError] = useState('');
  const cardScale = useSharedValue(1);
  const cardRotate = useSharedValue(0);

  // Animate card preview on changes
  useEffect(() => {
    cardScale.value = withSequence(
      withSpring(1.05, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    cardRotate.value = withSequence(
      withSpring(2, { damping: 10 }),
      withSpring(-2, { damping: 10 }),
      withSpring(0, { damping: 15 })
    );
  }, [selectedAvatar, displayName]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { rotateZ: `${cardRotate.value}deg` },
    ],
  }));

  const handleContinue = () => {
    if (!displayName.trim() || displayName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!selectedAvatar) {
      setError('Pick an avatar to continue');
      return;
    }
    setError('');
    onNext();
  };

  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.icon === selectedAvatar);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.Text entering={FadeInDown.duration(500)} style={styles.screenTitle}>
          CREATE YOUR{'\n'}PLAYER CARD
        </Animated.Text>

        {/* Avatar Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar, index) => {
            const isSelected = selectedAvatar === avatar.icon;
            return (
              <AvatarOption
                key={avatar.icon}
                avatar={avatar}
                isSelected={isSelected}
                onSelect={() => setSelectedAvatar(avatar.icon)}
                delay={index * 50}
              />
            );
          })}
        </Animated.View>

        {/* Name Input */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>What should your squad call you?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your name"
            placeholderTextColor="#6b7280"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            maxLength={20}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Animated.View>

        {/* Live Preview Card */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.previewSection}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <Animated.View style={[styles.playerCard, cardStyle]}>
            <View style={styles.playerCardGlow} />
            <View style={styles.playerCardHeader}>
              {selectedAvatar && selectedAvatarData ? (
                <View style={[styles.previewAvatar, { backgroundColor: selectedAvatarData.color + '30' }]}>
                  <Ionicons
                    name={selectedAvatar as any}
                    size={40}
                    color={selectedAvatarData.color}
                  />
                </View>
              ) : (
                <View style={styles.previewAvatarEmpty}>
                  <Text style={styles.questionMark}>?</Text>
                </View>
              )}
              <View style={styles.playerCardInfo}>
                <Text style={styles.playerCardName}>{displayName || 'Your Name'}</Text>
                <Text style={styles.playerCardLevel}>Rookie - Level 1</Text>
              </View>
            </View>
            <View style={styles.xpBarContainer}>
              <View style={styles.xpBar}>
                <View style={styles.xpBarEmpty} />
              </View>
              <Text style={styles.xpText}>0 / 100 XP</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.buttonContainer}>
          <GradientButton title="LOCK IT IN" onPress={handleContinue} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Avatar option component
function AvatarOption({
  avatar,
  isSelected,
  onSelect,
  delay,
}: {
  avatar: { icon: AvatarIcon; label: string; color: string };
  isSelected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    borderOpacity.value = withSpring(isSelected ? 1 : 0);
    if (isSelected) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [isSelected]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: avatar.color,
    borderWidth: interpolate(borderOpacity.value, [0, 1], [0, 3]),
  }));

  return (
    <Animated.View entering={ZoomIn.delay(delay).duration(300)}>
      <Pressable onPress={onSelect}>
        <Animated.View
          style={[
            styles.avatarOption,
            { backgroundColor: avatar.color + '20' },
            containerStyle,
          ]}
        >
          <Ionicons name={avatar.icon as any} size={32} color={avatar.color} />
          <Text style={[styles.avatarLabel, { color: avatar.color }]}>{avatar.label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// SCREEN 3: Quick Training (Mini Tutorial)
// ============================================================
function TrainingScreen({
  onNext,
  earnedXP,
  setEarnedXP,
}: {
  onNext: () => void;
  earnedXP: number;
  setEarnedXP: (xp: number) => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'tap' | 'tapResult' | 'poll' | 'pollResult' | 'complete'>('intro');
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isGameActive, setIsGameActive] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const xpBarWidth = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  // Tap game timer
  useEffect(() => {
    if (isGameActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isGameActive) {
      setIsGameActive(false);
      setEarnedXP(earnedXP + 10);
      xpBarWidth.value = withSpring((earnedXP + 10) / 20);
      setPhase('tapResult');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGameActive, timeLeft]);

  // Pulse animation for tap button
  useEffect(() => {
    if (phase === 'tap' && !isGameActive) {
      buttonPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    } else {
      buttonPulse.value = 1;
    }
  }, [phase, isGameActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpBarWidth.value * 100}%`,
  }));

  const startTapGame = () => {
    setIsGameActive(true);
    setTapCount(0);
    setTimeLeft(10);
  };

  const handleTap = () => {
    if (isGameActive) {
      setTapCount(prev => prev + 1);
    }
  };

  const handlePollSelect = (optionId: string) => {
    setSelectedPollOption(optionId);
  };

  const submitPoll = () => {
    if (selectedPollOption) {
      setEarnedXP(earnedXP + 10);
      xpBarWidth.value = withSpring((earnedXP + 10) / 20);
      setPhase('pollResult');
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'intro':
        return (
          <View style={styles.trainingContent}>
            <Animated.View entering={ZoomIn.duration(500)} style={styles.trainingIconContainer}>
              <LinearGradient
                colors={[COLORS.electricPurple, COLORS.hotPink]}
                style={styles.trainingIconBg}
              >
                <Ionicons name="fitness" size={60} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.trainingTitle}>
              QUICK TRAINING
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.trainingSubtitle}>
              Learn by playing!{'\n'}Complete 2 mini-games to earn XP
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.xpRewardPreview}>
              <Ionicons name="star" size={20} color={COLORS.neonYellow} />
              <Text style={styles.xpRewardText}>+20 XP up for grabs</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonContainer}>
              <GradientButton title="START TRAINING" onPress={() => setPhase('tap')} />
            </Animated.View>
          </View>
        );

      case 'tap':
        return (
          <View style={styles.trainingContent}>
            <Text style={styles.miniGameLabel}>Challenge 1/2</Text>
            <Text style={styles.miniGameTitle}>PRESSURE TAP</Text>
            <Text style={styles.miniGameSubtitle}>Tap as fast as you can!</Text>

            {!isGameActive ? (
              <Pressable onPress={startTapGame}>
                <Animated.View style={[styles.tapButton, pulseStyle]}>
                  <LinearGradient
                    colors={[COLORS.cyberCyan, COLORS.electricPurple]}
                    style={styles.tapButtonGradient}
                  >
                    <Text style={styles.tapButtonText}>TAP TO START</Text>
                    <Text style={styles.tapButtonSubtext}>10 seconds</Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            ) : (
              <View style={styles.tapGameActive}>
                <Text style={styles.timerText}>{timeLeft}s</Text>
                <Pressable onPress={handleTap} style={styles.tapZone}>
                  <LinearGradient
                    colors={[COLORS.hotPink, COLORS.electricPurple]}
                    style={styles.tapZoneGradient}
                  >
                    <Text style={styles.tapCountText}>{tapCount}</Text>
                    <Text style={styles.tapLabel}>TAPS</Text>
                  </LinearGradient>
                </Pressable>
                <Text style={styles.tapInstruction}>TAP! TAP! TAP!</Text>
              </View>
            )}
          </View>
        );

      case 'tapResult':
        return (
          <View style={styles.trainingContent}>
            <Animated.View entering={ZoomIn.duration(500)} style={styles.resultIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.victoryGreen} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.resultTitle}>
              {tapCount} TAPS!
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.resultSubtitle}>
              {tapCount >= 50 ? 'AMAZING!' : tapCount >= 30 ? 'Not bad, Rookie!' : 'Keep practicing!'}
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.xpEarnedContainer}>
              <Text style={styles.xpEarnedText}>+10 XP</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonContainer}>
              <GradientButton title="NEXT CHALLENGE" onPress={() => setPhase('poll')} />
            </Animated.View>
          </View>
        );

      case 'poll':
        return (
          <View style={styles.trainingContent}>
            <Text style={styles.miniGameLabel}>Challenge 2/2</Text>
            <Text style={styles.miniGameTitle}>QUICK POLL</Text>
            <View style={styles.pollQuestion}>
              <Ionicons name="help-circle" size={24} color={COLORS.electricPurple} />
              <Text style={styles.pollQuestionText}>Which animal would win in a race?</Text>
            </View>

            <View style={styles.pollOptions}>
              {POLL_OPTIONS.map((option, index) => (
                <Animated.View
                  key={option.id}
                  entering={SlideInRight.delay(index * 100).duration(300)}
                >
                  <Pressable
                    onPress={() => handlePollSelect(option.id)}
                    style={[
                      styles.pollOption,
                      selectedPollOption === option.id && styles.pollOptionSelected,
                    ]}
                  >
                    <Text style={styles.pollOptionEmoji}>{option.emoji}</Text>
                    <Text style={styles.pollOptionText}>{option.label}</Text>
                    {selectedPollOption === option.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.victoryGreen} />
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <GradientButton
                title="LOCK IN ANSWER"
                onPress={submitPoll}
                disabled={!selectedPollOption}
              />
            </View>
          </View>
        );

      case 'pollResult':
        return (
          <View style={styles.trainingContent}>
            <Animated.View entering={ZoomIn.duration(500)} style={styles.resultIconContainer}>
              <Ionicons name="trophy" size={80} color={COLORS.neonYellow} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.resultTitle}>
              NICE PICK!
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.resultSubtitle}>
              In Squad Game, you'll predict{'\n'}what your friends think!
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.xpEarnedContainer}>
              <Text style={styles.xpEarnedText}>+10 XP</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonContainer}>
              <GradientButton title="COMPLETE TRAINING" onPress={() => setPhase('complete')} />
            </Animated.View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.trainingContent}>
            <ConfettiEffect />
            <Animated.View entering={ZoomIn.duration(500)} style={styles.completeContainer}>
              <Text style={styles.completeTitle}>TRAINING COMPLETE!</Text>
              <Text style={styles.completeSubtitle}>You earned {earnedXP} XP!</Text>

              <View style={styles.completionXpBar}>
                <View style={styles.xpBarBackground}>
                  <Animated.View style={[styles.xpBarFill, xpBarStyle]}>
                    <LinearGradient
                      colors={[COLORS.electricPurple, COLORS.hotPink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.xpBarGradient}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.completionXpText}>{earnedXP} / 100 XP</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.buttonContainer}>
              <GradientButton title="FIND YOUR SQUAD" onPress={onNext} />
            </Animated.View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* XP Progress at top */}
      <View style={styles.trainingHeader}>
        <View style={styles.trainingXpContainer}>
          <Text style={styles.trainingXpLabel}>TRAINING XP</Text>
          <View style={styles.trainingXpBar}>
            <Animated.View style={[styles.trainingXpFill, xpBarStyle]}>
              <LinearGradient
                colors={[COLORS.electricPurple, COLORS.hotPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.xpBarGradient}
              />
            </Animated.View>
          </View>
          <Text style={styles.trainingXpText}>{earnedXP} / 20 XP</Text>
        </View>
      </View>

      {renderPhase()}
    </View>
  );
}

// Confetti effect component
function ConfettiEffect() {
  const confettiPieces = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 500,
      color: [COLORS.electricPurple, COLORS.hotPink, COLORS.neonYellow, COLORS.cyberCyan, COLORS.victoryGreen][Math.floor(Math.random() * 5)],
    })),
  []);

  return (
    <View style={styles.confettiContainer}>
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} x={piece.x} delay={piece.delay} color={piece.color} />
      ))}
    </View>
  );
}

function ConfettiPiece({ x, delay, color }: { x: number; delay: number; color: string }) {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT, { duration: 2000, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1)
    );
    opacity.value = withDelay(delay + 1500, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.confettiPiece, { backgroundColor: color, left: x }, style]} />
  );
}

// ============================================================
// SCREEN 4: Join Squad
// ============================================================
function JoinSquadScreen({
  displayName,
  selectedAvatar,
  earnedXP,
  onBack,
}: {
  displayName: string;
  selectedAvatar: AvatarIcon | null;
  earnedXP: number;
  onBack: () => void;
}) {
  const router = useRouter();
  const { updateProfile, isLoading } = useAuthStore();
  const [squadCode, setSquadCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [error, setError] = useState('');

  const createScale = useSharedValue(1);
  const joinScale = useSharedValue(1);

  const createStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createScale.value }],
  }));

  const joinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: joinScale.value }],
  }));

  const handleComplete = async (action: 'create' | 'join') => {
    // Save profile with avatar and name
    const result = await updateProfile({
      display_name: displayName.trim(),
      avatar_icon: selectedAvatar,
      xp: earnedXP,
      level: 1,
    });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Navigate based on action
    if (action === 'create') {
      router.replace('/squads/create' as any);
    } else {
      if (squadCode.length >= 4) {
        router.replace(`/squads/join?code=${squadCode}` as any);
      } else {
        setError('Enter a valid squad code');
      }
    }
  };

  if (mode === 'join') {
    return (
      <View style={styles.screenContainer}>
        <Pressable onPress={() => setMode('choose')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        <View style={styles.joinContent}>
          <Animated.Text entering={FadeInDown.duration(500)} style={styles.screenTitle}>
            ENTER SQUAD CODE
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="SQUAD CODE"
              placeholderTextColor="#6b7280"
              value={squadCode}
              onChangeText={(text) => setSquadCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.buttonContainer}>
            <GradientButton
              title="JOIN SQUAD"
              onPress={() => handleComplete('join')}
              loading={isLoading}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <Animated.Text entering={FadeInDown.duration(500)} style={styles.screenTitle}>
        FIND YOUR SQUAD
      </Animated.Text>

      <View style={styles.squadOptions}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable
            onPressIn={() => { createScale.value = withSpring(0.95); }}
            onPressOut={() => { createScale.value = withSpring(1); }}
            onPress={() => handleComplete('create')}
          >
            <Animated.View style={[styles.squadOption, createStyle]}>
              <LinearGradient
                colors={[COLORS.electricPurple + '40', COLORS.electricPurple + '10']}
                style={styles.squadOptionGradient}
              >
                <View style={styles.squadOptionIcon}>
                  <Ionicons name="add-circle" size={48} color={COLORS.electricPurple} />
                </View>
                <Text style={styles.squadOptionTitle}>CREATE NEW SQUAD</Text>
                <Text style={styles.squadOptionSubtitle}>Be the leader. Invite friends.</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.orDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Pressable
            onPressIn={() => { joinScale.value = withSpring(0.95); }}
            onPressOut={() => { joinScale.value = withSpring(1); }}
            onPress={() => setMode('join')}
          >
            <Animated.View style={[styles.squadOption, joinStyle]}>
              <LinearGradient
                colors={[COLORS.hotPink + '40', COLORS.hotPink + '10']}
                style={styles.squadOptionGradient}
              >
                <View style={styles.squadOptionIcon}>
                  <Ionicons name="enter" size={48} color={COLORS.hotPink} />
                </View>
                <Text style={styles.squadOptionTitle}>JOIN A SQUAD</Text>
                <Text style={styles.squadOptionSubtitle}>Got an invite? Enter the code.</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.Text entering={FadeInUp.delay(800).duration(500)} style={styles.squadTip}>
        Squads work best with 4-8 players
      </Animated.Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ============================================================
// Gradient Button Component
// ============================================================
function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <Pressable
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
    >
      <Animated.View style={[styles.gradientButtonContainer, animatedStyle]}>
        <LinearGradient
          colors={[COLORS.electricPurple, COLORS.hotPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.gradientButtonText}>{loading ? 'Loading...' : title}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ============================================================
// Main Onboarding Screen
// ============================================================
export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarIcon | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);

  const goToNext = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const goBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <WelcomeScreen onNext={goToNext} />;
      case 1:
        return (
          <PlayerCardScreen
            onNext={goToNext}
            displayName={displayName}
            setDisplayName={setDisplayName}
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
          />
        );
      case 2:
        return (
          <TrainingScreen
            onNext={goToNext}
            earnedXP={earnedXP}
            setEarnedXP={setEarnedXP}
          />
        );
      case 3:
        return (
          <JoinSquadScreen
            displayName={displayName}
            selectedAvatar={selectedAvatar}
            earnedXP={earnedXP}
            onBack={goBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              currentScreen >= index && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {renderScreen()}
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: COLORS.electricPurple,
    width: 24,
  },

  // Welcome Screen
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    bottom: 0,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  welcomeTitleGradient: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.hotPink,
    textAlign: 'center',
    letterSpacing: 4,
  },
  silhouettesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  silhouette: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  silhouetteGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },

  // Screen Title
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },

  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatarOption: {
    width: 75,
    height: 85,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#374151',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Player Card Preview
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  playerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.electricPurple + '40',
  },
  playerCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: COLORS.electricPurple,
    opacity: 0.1,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewAvatarEmpty: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  questionMark: {
    fontSize: 24,
    color: '#6b7280',
  },
  playerCardInfo: {
    flex: 1,
  },
  playerCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  playerCardLevel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarEmpty: {
    width: '0%',
    height: '100%',
    backgroundColor: COLORS.electricPurple,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Training Screen
  trainingHeader: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  trainingXpContainer: {
    alignItems: 'center',
  },
  trainingXpLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  trainingXpBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  trainingXpFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trainingXpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  xpBarGradient: {
    flex: 1,
  },
  trainingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  trainingIconContainer: {
    marginBottom: 24,
  },
  trainingIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  trainingSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  xpRewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.neonYellow + '20',
    borderRadius: 20,
  },
  xpRewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neonYellow,
  },

  // Mini Games
  miniGameLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  miniGameTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  miniGameSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  tapButton: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  tapButtonGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tapButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tapGameActive: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.fireOrange,
    marginBottom: 20,
  },
  tapZone: {
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tapZoneGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapCountText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#fff',
  },
  tapLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
  },
  tapInstruction: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.hotPink,
    letterSpacing: 2,
  },

  // Results
  resultIconContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  xpEarnedContainer: {
    backgroundColor: COLORS.victoryGreen + '20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  xpEarnedText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.victoryGreen,
  },

  // Poll
  pollQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
  },
  pollQuestionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pollOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  pollOptionSelected: {
    borderColor: COLORS.victoryGreen,
    backgroundColor: COLORS.victoryGreen + '10',
  },
  pollOptionEmoji: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  pollOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  // Complete
  completeContainer: {
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 18,
    color: COLORS.victoryGreen,
    marginBottom: 24,
  },
  completionXpBar: {
    width: '100%',
    alignItems: 'center',
  },
  xpBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  completionXpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  // Squad Screen
  squadOptions: {
    gap: 16,
    paddingHorizontal: 20,
  },
  squadOption: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  squadOptionGradient: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 20,
  },
  squadOptionIcon: {
    marginBottom: 16,
  },
  squadOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  squadOptionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  orText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  squadTip: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },

  // Join Squad
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinContent: {
    alignItems: 'center',
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 2,
    borderColor: COLORS.hotPink + '40',
  },

  // Gradient Button
  gradientButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
});

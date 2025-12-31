/**
 * Memory Match Game
 * A simple but beautiful memory matching game
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate card size based on screen, with min/max bounds for web
const getCardSize = () => {
  const baseSize = Math.min(SCREEN_WIDTH, 500) - 64;
  return Math.max(60, Math.min(100, baseSize / 4));
};

const COLORS = {
  background: '#0A0E27',
  cardBack: '#1A1A2E',
  cardBorderGlow: '#9B59FF',
  gradientStart: '#9B59FF',
  gradientEnd: '#FF2D92',
  matched: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  success: '#10B981',
};

// Card emojis
const CARD_EMOJIS = ['🎮', '🎯', '🎪', '🎨', '🎭', '🎰', '🎲', '🎳'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Card Component
function GameCard({
  card,
  onPress,
  disabled,
}: {
  card: Card;
  onPress: () => void;
  disabled: boolean;
}) {
  const flipRotation = useSharedValue(0);

  useEffect(() => {
    flipRotation.value = withSpring(card.isFlipped || card.isMatched ? 180 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [card.isFlipped, card.isMatched]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value}deg` }],
    opacity: flipRotation.value < 90 ? 1 : 0,
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value - 180}deg` }],
    opacity: flipRotation.value > 90 ? 1 : 0,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || card.isFlipped || card.isMatched}
      style={styles.cardContainer}
      activeOpacity={0.8}
    >
      {/* Card Back */}
      <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
        <LinearGradient
          colors={[COLORS.cardBack, '#252542']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardQuestion}>?</Text>
        </LinearGradient>
      </Animated.View>

      {/* Card Front */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          card.isMatched && styles.cardMatched,
          frontStyle,
        ]}
      >
        <LinearGradient
          colors={
            card.isMatched
              ? [COLORS.matched, '#FFA500']
              : [COLORS.gradientStart, COLORS.gradientEnd]
          }
          style={styles.cardGradient}
        >
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MemoryMatchGame() {
  const router = useRouter();
  const navigation = useNavigation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [navigation, router]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize game
  const initializeGame = useCallback(() => {
    const shuffledEmojis = [...CARD_EMOJIS, ...CARD_EMOJIS]
      .sort(() => Math.random() - 0.5);

    const newCards: Card[] = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameStarted(false);
    setGameComplete(false);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameComplete) return;

    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found!
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches((m) => m + 1);
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }

      setMoves((m) => m + 1);
    }
  }, [flippedCards, cards]);

  // Check for game complete
  useEffect(() => {
    if (matches === CARD_EMOJIS.length && matches > 0) {
      setGameComplete(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [matches]);

  const handleCardPress = (index: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (isChecking || flippedCards.length >= 2) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedCards((prev) => [...prev, index]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Memory Match</Text>
          <TouchableOpacity onPress={initializeGame} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.gradientStart} />
            <Text style={styles.statValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.gradientEnd} />
            <Text style={styles.statValue}>{moves} moves</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.matched} />
            <Text style={styles.statValue}>{matches}/{CARD_EMOJIS.length}</Text>
          </View>
        </View>

        {/* Game Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {cards.map((card, index) => (
              <GameCard
                key={card.id}
                card={card}
                onPress={() => handleCardPress(index)}
                disabled={isChecking}
              />
            ))}
          </View>
        </View>

        {/* Victory Overlay */}
        {gameComplete && (
          <Animated.View entering={FadeIn} style={styles.victoryOverlay}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.victoryCard}>
              <Text style={styles.victoryEmoji}>🎉</Text>
              <Text style={styles.victoryTitle}>Amazing!</Text>
              <Text style={styles.victorySubtitle}>
                Completed in {formatTime(timer)} with {moves} moves
              </Text>
              <View style={styles.victoryButtons}>
                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={initializeGame}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.playAgainGradient}
                  >
                    <Text style={styles.playAgainText}>Play Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={handleGoBack}
                >
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const CARD_SIZE = getCardSize();

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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  resetButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: 400,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    maxWidth: 500,
    width: '100%',
  },
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    minWidth: 60,
    minHeight: 60,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  cardBack: {
    borderWidth: 2,
    borderColor: COLORS.cardBorderGlow,
  },
  cardFront: {},
  cardMatched: {
    borderWidth: 2,
    borderColor: COLORS.matched,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardQuestion: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  cardEmoji: {
    fontSize: 32,
  },
  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  victoryCard: {
    backgroundColor: COLORS.cardBack,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: COLORS.gradientStart,
  },
  victoryEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  victoryTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.matched,
    marginBottom: 8,
  },
  victorySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  victoryButtons: {
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
    color: COLORS.textPrimary,
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

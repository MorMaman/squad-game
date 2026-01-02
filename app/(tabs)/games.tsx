import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';

// Game Color Palette
const COLORS = {
  GAME_ORANGE: '#FF6B00',
  GAME_CORAL: '#FF4757',
  ELECTRIC_CYAN: '#00D4FF',
  NEON_GREEN: '#00FF87',
  GOLD: '#FFD700',
  PURPLE: '#9B59FF',
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Game data
interface Game {
  id: string;
  name: string;
  icon: string;
  description: string;
  route: string;
  gradientColors: readonly [string, string];
  glowColor: string;
  highScore: number;
}

const GAMES: Game[] = [
  {
    id: 'memory-match',
    name: 'Memory Match',
    icon: 'brain',
    description: 'Match the pairs!',
    route: '/games/memory-match',
    gradientColors: [COLORS.PURPLE, '#7C3AED'] as const,
    glowColor: COLORS.PURPLE,
    highScore: 1250,
  },
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    icon: 'zap',
    description: 'How fast are you?',
    route: '/games/reaction-time',
    gradientColors: [COLORS.ELECTRIC_CYAN, '#0891B2'] as const,
    glowColor: COLORS.ELECTRIC_CYAN,
    highScore: 185,
  },
  {
    id: 'color-match',
    name: 'Color Match',
    icon: 'palette',
    description: "Don't get tricked!",
    route: '/games/color-match',
    gradientColors: [COLORS.GAME_CORAL, '#DC2626'] as const,
    glowColor: COLORS.GAME_CORAL,
    highScore: 890,
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    icon: 'calculator',
    description: 'Beat the clock!',
    route: '/games/quick-math',
    gradientColors: [COLORS.NEON_GREEN, '#10B981'] as const,
    glowColor: COLORS.NEON_GREEN,
    highScore: 2100,
  },
  {
    id: 'simon-says',
    name: 'Simon Says',
    icon: 'musical-notes',
    description: 'Follow the pattern!',
    route: '/games/simon-says',
    gradientColors: [COLORS.GOLD, '#F59E0B'] as const,
    glowColor: COLORS.GOLD,
    highScore: 15,
  },
];

// Emoji icons mapping to valid Ionicons names
const EMOJI_ICONS: Record<string, string> = {
  brain: 'grid',
  zap: 'flash',
  palette: 'color-palette',
  calculator: 'apps',
  'musical-notes': 'musical-notes',
};

// Animated Glow Effect Component
function GlowEffect({
  color,
  intensity = 0.6,
}: {
  color: string;
  intensity?: number;
}) {
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [intensity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.glowEffect,
        { backgroundColor: color },
        glowStyle,
      ]}
    />
  );
}

// Game Card Component
function GameCard({
  game,
  index,
  onPress,
}: {
  game: Game;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Subtle floating animation
    translateY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Glow pulse animation
    glowOpacity.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [index]);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Get the icon name for Ionicons
  const iconName = EMOJI_ICONS[game.icon] || 'game-controller';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(500).springify()}
      style={styles.cardWrapper}
    >
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.cardTouchable}
        >
        {/* Glow Background */}
        <Animated.View
          style={[
            styles.cardGlow,
            { backgroundColor: game.glowColor },
            glowStyle,
          ]}
        />

        {/* Card Content */}
        <LinearGradient
          colors={game.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <GameIcon name={game.icon} color={COLORS.TEXT_PRIMARY} size={40} />
          </View>

          {/* Game Name */}
          <Text style={styles.gameName}>{game.name}</Text>

          {/* Description */}
          <Text style={styles.gameDescription}>{game.description}</Text>

          {/* High Score */}
          <View style={styles.highScoreContainer}>
            <View style={styles.highScoreBadge}>
              <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
              <Text style={styles.highScoreValue}>
                {game.highScore.toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// Simple Game Icon Component using valid Ionicons names
function GameIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  // Map game icon names to valid Ionicons names
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    brain: 'grid',
    zap: 'flash',
    palette: 'color-palette',
    calculator: 'keypad',
    'musical-notes': 'musical-notes',
  };

  const iconName = iconMap[name] || 'game-controller';

  return <Ionicons name={iconName} size={size} color={color} />;
}

// Header Component
function GamesHeader() {
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    titleOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  return (
    <Animated.View style={[styles.header, titleStyle]}>
      <LinearGradient
        colors={[COLORS.GAME_ORANGE, COLORS.GAME_CORAL]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <GameIcon name="zap" color={COLORS.DARK_NAVY} size={28} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>GAMES HUB</Text>
            <Text style={styles.headerSubtitle}>Challenge your skills</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Background Particles
function BackgroundParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <View style={styles.particlesContainer}>
      {particles.map((i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

function Particle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  const startX = (index * 53) % SCREEN_WIDTH;
  const startY = (index * 97) % 700;
  const size = 2 + (index % 4);

  useEffect(() => {
    const delay = index * 200;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-80, { duration: 12000 + index * 500, easing: Easing.linear }),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2500 }),
          withTiming(0.15, { duration: 2500 })
        ),
        -1,
        false
      )
    );
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const particleColors = [
    COLORS.GAME_ORANGE,
    COLORS.ELECTRIC_CYAN,
    COLORS.PURPLE,
    COLORS.NEON_GREEN,
    COLORS.GOLD,
  ];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          backgroundColor: particleColors[index % particleColors.length],
        },
        particleStyle,
      ]}
    />
  );
}

// Stats Section
function StatsSection() {
  return (
    <Animated.View
      entering={FadeInDown.delay(500).duration(500).springify()}
      style={styles.statsSection}
    >
      <Text style={styles.statsSectionTitle}>YOUR STATS</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
            style={styles.statCardGradient}
          >
            <Text style={styles.statValue}>5,420</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
            style={styles.statCardGradient}
          >
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
            style={styles.statCardGradient}
          >
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Win Streak</Text>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
}

// Main Games Screen
export default function GamesScreen() {
  const router = useRouter();

  const handleGamePress = (game: Game) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(game.route as Href);
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.DARK_NAVY, '#0D1234', COLORS.DARK_NAVY]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background particles */}
      <BackgroundParticles />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GamesHeader />

          {/* Games Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AVAILABLE GAMES</Text>
            <View style={styles.gamesGrid}>
              {GAMES.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  onPress={() => handleGamePress(game)}
                />
              ))}
            </View>
          </View>

          {/* Stats Section */}
          <StatsSection />

          {/* Coming Soon Section */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(500).springify()}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>COMING SOON</Text>
            <View style={styles.comingSoonCard}>
              <LinearGradient
                colors={[COLORS.DEEP_PURPLE, COLORS.MIDNIGHT_BLUE]}
                style={styles.comingSoonGradient}
              >
                <View style={styles.comingSoonContent}>
                  <View style={styles.comingSoonIcon}>
                    <GameIcon name="zap" color={COLORS.GAME_ORANGE} size={24} />
                  </View>
                  <View style={styles.comingSoonText}>
                    <Text style={styles.comingSoonTitle}>More Games Loading...</Text>
                    <Text style={styles.comingSoonSubtitle}>
                      New challenges coming every week!
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_NAVY,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Particles
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },

  // Header
  header: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.DARK_NAVY,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(10, 14, 39, 0.7)',
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // Games Grid
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // Card Styles
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardTouchable: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 28,
    opacity: 0.3,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minHeight: 180,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  highScoreContainer: {
    marginTop: 'auto',
  },
  highScoreBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  highScoreValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },

  // Glow Effect
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.GAME_ORANGE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },

  // Coming Soon
  comingSoonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    borderStyle: 'dashed',
  },
  comingSoonGradient: {
    padding: 20,
  },
  comingSoonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  comingSoonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  comingSoonSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
});

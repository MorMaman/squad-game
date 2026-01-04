import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
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
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Battle Game Color Palette - Vibrant & Varied
const COLORS = {
  // Base
  DARK_NAVY: '#0A0E27',
  CARD_BG: '#1A2245',
  CARD_BG_LIGHT: '#252B50',

  // Accent Colors - Each game gets a unique theme!
  LIME_GREEN: '#A3E635',    // Success, wins
  CYAN: '#00D4FF',          // Info, stats
  PURPLE: '#9B59FF',        // Magic, special
  ORANGE: '#FF6B00',        // Fire, energy
  GOLD: '#FFD700',          // Rewards, premium
  PINK: '#FF69B4',          // Hearts, social
  RED: '#EF4444',           // Danger, losses
  ELECTRIC_BLUE: '#3B82F6', // Electric, speed
  EMERALD: '#10B981',       // Nature, growth
  AMBER: '#F59E0B',         // Warning, attention

  // Text
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',

  // Gradients for backgrounds
  GRADIENT_START: '#0D1234',
  GRADIENT_END: '#0A0E27',
};

// Game Themes - Each game has unique colors!
const GAME_THEMES = {
  memoryMatch: {
    primary: COLORS.PURPLE,
    secondary: '#7C3AED',
    glow: 'rgba(155, 89, 255, 0.5)',
    gradient: ['#9B59FF', '#7C3AED', '#5B21B6'] as const,
    icon: 'grid',
    emoji: '🧠',
  },
  reactionTime: {
    primary: COLORS.CYAN,
    secondary: '#0891B2',
    glow: 'rgba(0, 212, 255, 0.5)',
    gradient: ['#00D4FF', '#06B6D4', '#0891B2'] as const,
    icon: 'flash',
    emoji: '⚡',
  },
  colorMatch: {
    primary: COLORS.PINK,
    secondary: '#DB2777',
    glow: 'rgba(255, 105, 180, 0.5)',
    gradient: ['#FF69B4', '#EC4899', '#DB2777'] as const,
    icon: 'color-palette',
    emoji: '🎨',
  },
  quickMath: {
    primary: COLORS.LIME_GREEN,
    secondary: '#65A30D',
    glow: 'rgba(163, 230, 53, 0.5)',
    gradient: ['#A3E635', '#84CC16', '#65A30D'] as const,
    icon: 'calculator',
    emoji: '🔢',
  },
  simonSays: {
    primary: COLORS.GOLD,
    secondary: '#D97706',
    glow: 'rgba(255, 215, 0, 0.5)',
    gradient: ['#FFD700', '#F59E0B', '#D97706'] as const,
    icon: 'musical-notes',
    emoji: '🎵',
  },
  wordScramble: {
    primary: COLORS.ORANGE,
    secondary: '#EA580C',
    glow: 'rgba(255, 107, 0, 0.5)',
    gradient: ['#FF6B00', '#F97316', '#EA580C'] as const,
    icon: 'text',
    emoji: '📝',
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Game data with unique themes
interface Game {
  id: string;
  nameKey: string;
  descriptionKey: string;
  themeKey: keyof typeof GAME_THEMES;
  route: string;
  highScore: number;
  isNew?: boolean;
  isHot?: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const GAMES: Game[] = [
  {
    id: 'memory-match',
    nameKey: 'games.memoryMatch.title',
    descriptionKey: 'games.memoryMatch.description',
    themeKey: 'memoryMatch',
    route: '/games/memory-match',
    highScore: 1250,
    isHot: true,
    difficulty: 'medium',
  },
  {
    id: 'reaction-time',
    nameKey: 'games.reactionTime.title',
    descriptionKey: 'games.reactionTime.description',
    themeKey: 'reactionTime',
    route: '/games/reaction-time',
    highScore: 185,
    isNew: true,
    difficulty: 'easy',
  },
  {
    id: 'color-match',
    nameKey: 'games.colorMatch.title',
    descriptionKey: 'games.colorMatch.description',
    themeKey: 'colorMatch',
    route: '/games/color-match',
    highScore: 890,
    difficulty: 'hard',
  },
  {
    id: 'quick-math',
    nameKey: 'games.quickMath.title',
    descriptionKey: 'games.quickMath.description',
    themeKey: 'quickMath',
    route: '/games/quick-math',
    highScore: 2100,
    difficulty: 'medium',
  },
  {
    id: 'simon-says',
    nameKey: 'games.simonSays.title',
    descriptionKey: 'games.simonSays.description',
    themeKey: 'simonSays',
    route: '/games/simon-says',
    highScore: 15,
    isHot: true,
    difficulty: 'hard',
  },
];

// Animated Icon Component with Glow
function AnimatedGameIcon({
  iconName,
  color,
  size,
  glowColor,
}: {
  iconName: string;
  color: string;
  size: number;
  glowColor: string;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Subtle rotation wiggle
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Pulse scale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    grid: 'grid',
    flash: 'flash',
    'color-palette': 'color-palette',
    calculator: 'calculator',
    'musical-notes': 'musical-notes',
    text: 'text',
  };

  return (
    <View style={styles.iconWrapper}>
      {/* Glow effect behind icon */}
      <Animated.View
        style={[
          styles.iconGlow,
          { backgroundColor: glowColor },
          glowStyle,
        ]}
      />
      <Animated.View style={iconStyle}>
        <Ionicons
          name={iconMap[iconName] || 'game-controller'}
          size={size}
          color={color}
        />
      </Animated.View>
    </View>
  );
}

// Badge Component (NEW, HOT, etc.)
function Badge({ type }: { type: 'new' | 'hot' }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const isNew = type === 'new';
  const bgColor = isNew ? COLORS.CYAN : COLORS.ORANGE;
  const label = isNew ? 'NEW' : 'HOT';

  return (
    <Animated.View style={[styles.badge, { backgroundColor: bgColor }, pulseStyle]}>
      <Text style={styles.badgeText}>{label}</Text>
      {!isNew && <Text style={styles.badgeEmoji}>🔥</Text>}
    </Animated.View>
  );
}

// Difficulty Indicator
function DifficultyIndicator({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const colors = {
    easy: COLORS.LIME_GREEN,
    medium: COLORS.AMBER,
    hard: COLORS.RED,
  };

  const dots = level === 'easy' ? 1 : level === 'medium' ? 2 : 3;

  return (
    <View style={styles.difficultyContainer}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.difficultyDot,
            {
              backgroundColor: i <= dots ? colors[level] : 'rgba(255,255,255,0.2)',
            },
          ]}
        />
      ))}
    </View>
  );
}

// Enhanced Game Card Component
function GameCard({
  game,
  index,
  onPress,
}: {
  game: Game;
  index: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = GAME_THEMES[game.themeKey];

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const borderGlow = useSharedValue(0);

  useEffect(() => {
    // Floating animation with stagger
    translateY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Glow pulse
    glowOpacity.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Border glow animation
    borderGlow.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [index]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.92, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ['rgba(255,255,255,0.1)', theme.primary]
    ),
    borderWidth: interpolate(borderGlow.value, [0, 1], [1, 2]),
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(500).springify()}
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
          {/* Outer Glow */}
          <Animated.View
            style={[
              styles.cardOuterGlow,
              { backgroundColor: theme.glow },
              glowStyle,
            ]}
          />

          {/* Card Container with animated border */}
          <Animated.View style={[styles.cardBorderContainer, borderStyle]}>
            <LinearGradient
              colors={[COLORS.CARD_BG_LIGHT, COLORS.CARD_BG]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Badges */}
              {game.isNew && (
                <View style={styles.badgeContainer}>
                  <Badge type="new" />
                </View>
              )}
              {game.isHot && !game.isNew && (
                <View style={styles.badgeContainer}>
                  <Badge type="hot" />
                </View>
              )}

              {/* Colored Top Bar */}
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardTopBar}
              />

              {/* Icon Container with Theme Color */}
              <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
                <AnimatedGameIcon
                  iconName={theme.icon}
                  color={theme.primary}
                  size={36}
                  glowColor={theme.glow}
                />
              </View>

              {/* Game Name */}
              <Text style={[styles.gameName, { color: theme.primary }]}>
                {t(game.nameKey)}
              </Text>

              {/* Description */}
              <Text style={styles.gameDescription} numberOfLines={2}>
                {t(game.descriptionKey)}
              </Text>

              {/* Difficulty */}
              <DifficultyIndicator level={game.difficulty} />

              {/* High Score Badge */}
              <View style={styles.highScoreContainer}>
                <LinearGradient
                  colors={[theme.secondary, theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.highScoreBadge}
                >
                  <Ionicons name="trophy" size={12} color={COLORS.TEXT_PRIMARY} />
                  <Text style={styles.highScoreValue}>
                    {game.highScore.toLocaleString()}
                  </Text>
                </LinearGradient>
              </View>

              {/* Play Button */}
              <View style={styles.playButtonContainer}>
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.playButton}
                >
                  <Ionicons name="play" size={16} color={COLORS.DARK_NAVY} />
                  <Text style={styles.playButtonText}>PLAY</Text>
                </LinearGradient>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// Animated Header Component
function GamesHeader() {
  const { t } = useTranslation();
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(-100);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    titleOpacity.value = withTiming(1, { duration: 600 });

    // Shimmer effect
    shimmerPosition.value = withRepeat(
      withTiming(200, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  return (
    <Animated.View style={[styles.header, titleStyle]}>
      <LinearGradient
        colors={[COLORS.PURPLE, '#7C3AED', COLORS.PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative Elements */}
        <View style={styles.headerDecor}>
          <View style={[styles.headerOrb, { backgroundColor: COLORS.CYAN, left: -20, top: -20 }]} />
          <View style={[styles.headerOrb, { backgroundColor: COLORS.GOLD, right: -10, bottom: -15 }]} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="game-controller" size={32} color={COLORS.TEXT_PRIMARY} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>GAME HUB</Text>
            <Text style={styles.headerSubtitle}>Challenge your skills & win rewards!</Text>
          </View>
          <View style={styles.headerStarsContainer}>
            <Ionicons name="star" size={20} color={COLORS.GOLD} />
            <Text style={styles.headerStarsText}>5,420</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Background Particles with Multiple Colors
function BackgroundParticles() {
  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => i), []);

  return (
    <View style={styles.particlesContainer} pointerEvents="none">
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
  const scale = useSharedValue(1);

  const startX = (index * 47) % SCREEN_WIDTH;
  const startY = (index * 89) % 800;
  const size = 3 + (index % 5);

  const particleColors = [
    COLORS.PURPLE,
    COLORS.CYAN,
    COLORS.PINK,
    COLORS.LIME_GREEN,
    COLORS.GOLD,
    COLORS.ORANGE,
    COLORS.ELECTRIC_BLUE,
  ];

  useEffect(() => {
    const delay = index * 150;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration: 10000 + index * 400, easing: Easing.linear }),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.2, { duration: 2000 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 3000 }),
          withTiming(0.8, { duration: 3000 })
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
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

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

// Stats Section with Multiple Colors
function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { value: '5,420', label: t('games.totalScore'), color: COLORS.GOLD, icon: 'trophy' },
    { value: '23', label: t('games.gamesPlayed'), color: COLORS.CYAN, icon: 'game-controller' },
    { value: '3', label: t('games.winStreak'), color: COLORS.LIME_GREEN, icon: 'flame' },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(500).duration(500).springify()}
      style={styles.statsSection}
    >
      <Text style={styles.statsSectionTitle}>YOUR STATS</Text>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

function StatCard({
  stat,
  index,
}: {
  stat: { value: string; label: string; color: string; icon: string };
  index: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        false
      )
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <LinearGradient
        colors={[COLORS.CARD_BG_LIGHT, COLORS.CARD_BG]}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
        </View>
        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Coming Soon Section
function ComingSoonSection() {
  const { t } = useTranslation();
  const borderGlow = useSharedValue(0);

  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ['rgba(255, 107, 0, 0.3)', 'rgba(255, 107, 0, 0.8)']
    ),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(600).duration(500).springify()}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>COMING SOON</Text>
      <Animated.View style={[styles.comingSoonCard, borderStyle]}>
        <LinearGradient
          colors={[COLORS.CARD_BG_LIGHT, COLORS.CARD_BG]}
          style={styles.comingSoonGradient}
        >
          <View style={styles.comingSoonContent}>
            <View style={[styles.comingSoonIcon, { backgroundColor: `${COLORS.ORANGE}20` }]}>
              <Ionicons name="rocket" size={28} color={COLORS.ORANGE} />
            </View>
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>More Games Loading...</Text>
              <Text style={styles.comingSoonSubtitle}>
                New challenges dropping every week!
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>3 NEW</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

// Quick Play Section
function QuickPlaySection() {
  const quickPlayGames = [
    { name: 'Daily Challenge', icon: 'calendar', color: COLORS.PURPLE, reward: '+50 XP' },
    { name: 'Random Game', icon: 'shuffle', color: COLORS.CYAN, reward: '+25 XP' },
    { name: 'Tournament', icon: 'trophy', color: COLORS.GOLD, reward: '+100 XP' },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(500).springify()}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>QUICK PLAY</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickPlayScroll}
      >
        {quickPlayGames.map((item, index) => (
          <TouchableOpacity key={index} style={styles.quickPlayCard}>
            <LinearGradient
              colors={[item.color, `${item.color}88`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickPlayGradient}
            >
              <Ionicons name={item.icon as any} size={28} color={COLORS.TEXT_PRIMARY} />
              <Text style={styles.quickPlayName}>{item.name}</Text>
              <View style={styles.quickPlayReward}>
                <Text style={styles.quickPlayRewardText}>{item.reward}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// Main Games Screen
export default function GamesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleGamePress = useCallback((game: Game) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(game.route as Href);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.DARK_NAVY, COLORS.GRADIENT_END]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background particles */}
      <BackgroundParticles />

      <View style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GamesHeader />

          {/* Quick Play Section */}
          <QuickPlaySection />

          {/* Games Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALL GAMES</Text>
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
          <ComingSoonSection />

          {/* Bottom padding for tab bar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
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
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 20,
    position: 'relative',
  },
  headerDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOrb: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  headerStarsText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.GOLD,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 2,
    marginBottom: 16,
  },

  // Quick Play
  quickPlayScroll: {
    paddingRight: 16,
    gap: 12,
  },
  quickPlayCard: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickPlayGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickPlayName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  quickPlayReward: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quickPlayRewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.LIME_GREEN,
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
  cardOuterGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    opacity: 0.3,
  },
  cardBorderContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 220,
    position: 'relative',
  },
  cardTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.DARK_NAVY,
    letterSpacing: 0.5,
  },
  badgeEmoji: {
    fontSize: 10,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  highScoreContainer: {
    marginBottom: 10,
  },
  highScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  highScoreValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  playButtonContainer: {
    marginTop: 'auto',
    width: '100%',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.DARK_NAVY,
    letterSpacing: 1,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.TEXT_MUTED,
    letterSpacing: 2,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Coming Soon
  comingSoonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 107, 0, 0.3)',
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
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  comingSoonSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
});

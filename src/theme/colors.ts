/**
 * Squad Game - Electric Squad Color Palette
 * A vibrant, game-like color system designed to make the app feel exciting and fun
 */

// Primary Palette - "Electric Squad"
export const colors = {
  // Primary Colors
  primary: '#7C3AED', // Electric Purple - Main actions, XP, level indicators
  primaryDark: '#5B21B6', // Deep Violet - Headers, emphasis
  primaryLight: '#A78BFA', // Soft Lavender - Secondary text, accents

  // Secondary & Accent Colors
  secondary: '#EC4899', // Hot Pink - Notifications, urgency, streaks
  accent: '#06B6D4', // Cyber Cyan - Success states, achievements
  energy: '#FACC15', // Neon Yellow - Highlights, coins, rewards

  // Semantic Colors
  success: '#10B981', // Victory Green - Correct answers, wins
  warning: '#F97316', // Fire Orange - Time pressure, alerts
  error: '#EF4444', // Danger Red - Errors, critical states

  // Background Colors
  backgroundDark: '#0F0F23', // Midnight - Main background
  backgroundCard: '#1A1A2E', // Dark Purple - Card backgrounds
  backgroundElevated: '#252542', // Elevated surfaces

  // Text Colors
  textPrimary: '#FFFFFF', // Pure White - Primary text
  textSecondary: '#A78BFA', // Soft Lavender - Secondary text
  textMuted: '#6B7280', // Gray - Disabled/muted text
  textOnColor: '#FFFFFF', // Text on colored backgrounds

  // Border Colors
  border: '#374151', // Gray border
  borderLight: '#4B5563', // Light gray border
  borderAccent: '#7C3AED', // Purple accent border

  // Streak Tier Colors
  streakWarm: '#F97316', // Small flame (1-6 days)
  streakHot: '#EF4444', // Medium flame (7-29 days)
  streakFire: '#DC2626', // Large flame (30-99 days)
  streakLegendary: '#FACC15', // Golden flame (100+ days)

  // Rank Colors
  rankGold: '#FACC15', // 1st place
  rankSilver: '#C0C0C0', // 2nd place
  rankBronze: '#CD7F32', // 3rd place

  // Level Badge Colors
  levelBadge: '#7C3AED',
  levelBadgeBorder: '#A78BFA',

  // Glow Colors (with alpha for shadows)
  glowPurple: 'rgba(124, 58, 237, 0.5)',
  glowPink: 'rgba(236, 72, 153, 0.5)',
  glowCyan: 'rgba(6, 182, 212, 0.5)',
  glowYellow: 'rgba(250, 204, 21, 0.5)',
  glowGreen: 'rgba(16, 185, 129, 0.5)',
} as const;

// Gradient Definitions (for components that support gradient arrays)
export const gradients = {
  // Hero Gradient - for headers and splash screens
  hero: ['#7C3AED', '#EC4899', '#06B6D4'] as const,

  // XP Bar Gradient
  xp: ['#7C3AED', '#EC4899'] as const,

  // Win State Gradient
  win: ['#10B981', '#06B6D4'] as const,

  // Streak Fire Gradient
  streak: ['#F97316', '#FACC15'] as const,

  // Level Up Gradient
  levelUp: ['#7C3AED', '#A855F7', '#EC4899'] as const,

  // Card Background Gradient (subtle)
  card: ['#1A1A2E', '#252542'] as const,

  // Button Primary Gradient
  buttonPrimary: ['#7C3AED', '#6D28D9'] as const,

  // Celebration Gradient
  celebration: ['#FACC15', '#F97316', '#EC4899'] as const,
} as const;

// Event Type Specific Colors
export const eventColors = {
  POLL: {
    primary: '#7C3AED',
    gradient: ['#7C3AED', '#A855F7'] as const,
    icon: 'help-circle',
    glow: 'rgba(124, 58, 237, 0.3)',
  },
  LIVE_SELFIE: {
    primary: '#EC4899',
    gradient: ['#EC4899', '#F472B6'] as const,
    icon: 'camera',
    glow: 'rgba(236, 72, 153, 0.3)',
  },
  PRESSURE_TAP: {
    primary: '#06B6D4',
    gradient: ['#06B6D4', '#22D3EE'] as const,
    icon: 'flash',
    glow: 'rgba(6, 182, 212, 0.3)',
  },
} as const;

// Component-Specific Color Configurations
export const componentColors = {
  // XP Bar
  xpBar: {
    background: colors.backgroundCard,
    fill: colors.primary,
    fillEnd: colors.secondary,
    glow: colors.glowPurple,
    text: colors.textPrimary,
    levelBadge: colors.primary,
  },

  // Streak Badge
  streakBadge: {
    warmColor: colors.streakWarm,
    hotColor: colors.streakHot,
    fireColor: colors.streakFire,
    legendaryColor: colors.streakLegendary,
    background: colors.backgroundCard,
    text: colors.textPrimary,
    atRiskBorder: colors.warning,
  },

  // Player Card
  playerCard: {
    background: colors.backgroundCard,
    headerGradient: gradients.hero,
    border: colors.border,
    avatarBorder: colors.primary,
    levelBadge: colors.primary,
    xpBar: colors.primary,
    statsLabel: colors.textSecondary,
    statsValue: colors.textPrimary,
    badgeBackground: colors.backgroundElevated,
  },

  // Celebration Overlay
  celebration: {
    background: 'rgba(15, 15, 35, 0.95)',
    titleWin: colors.energy,
    titleLevelUp: colors.primary,
    titleBadge: colors.accent,
    titleStreak: colors.streakFire,
    confettiColors: [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.energy,
      colors.success,
    ],
    xpText: colors.energy,
    buttonBackground: colors.primary,
    buttonText: colors.textOnColor,
  },

  // Leaderboard
  leaderboard: {
    background: colors.backgroundCard,
    rowBackground: colors.backgroundElevated,
    currentUserBackground: 'rgba(124, 58, 237, 0.2)',
    rankFirst: colors.rankGold,
    rankSecond: colors.rankSilver,
    rankThird: colors.rankBronze,
    changeUp: colors.success,
    changeDown: colors.error,
    changeSame: colors.textMuted,
  },

  // Button
  button: {
    primary: colors.primary,
    primaryPressed: colors.primaryDark,
    secondary: colors.backgroundElevated,
    danger: colors.error,
    ghost: 'transparent',
    ghostBorder: colors.primary,
    disabled: colors.textMuted,
    text: colors.textOnColor,
  },

  // Card
  card: {
    background: colors.backgroundCard,
    elevated: colors.backgroundElevated,
    border: colors.border,
    glow: colors.glowPurple,
  },

  // Input
  input: {
    background: colors.backgroundElevated,
    border: colors.border,
    borderFocused: colors.primary,
    text: colors.textPrimary,
    placeholder: colors.textMuted,
  },
} as const;

// Animation timing presets
export const animationTimings = {
  fast: 150,
  normal: 300,
  slow: 500,
  celebration: 2000,
  xpFill: 1000,
  confetti: 3000,
} as const;

// Spacing and sizing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Typography
export const typography = {
  // Font weights (as string literals for RN compatibility)
  weightNormal: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,
  weightExtrabold: '800' as const,

  // Font sizes
  sizeXs: 10,
  sizeSm: 12,
  sizeMd: 14,
  sizeLg: 16,
  sizeXl: 18,
  size2xl: 20,
  size3xl: 24,
  size4xl: 32,
  size5xl: 40,
  size6xl: 48,
} as const;

// Level configuration
export const levelConfig = {
  // XP required per level (exponential but approachable)
  xpPerLevel: [
    100,   // Level 1 -> 2
    150,   // Level 2 -> 3
    225,   // Level 3 -> 4
    340,   // Level 4 -> 5
    500,   // Level 5 -> 6
    750,   // Level 6 -> 7
    1000,  // Level 7 -> 8
    1350,  // Level 8 -> 9
    1750,  // Level 9 -> 10
    2200,  // Level 10 -> 11
    2750,  // Level 11 -> 12
    3400,  // Level 12 -> 13
    4200,  // Level 13 -> 14
    5100,  // Level 14 -> 15
    6200,  // Level 15 -> 16
    7500,  // Level 16 -> 17
    9000,  // Level 17 -> 18
    10800, // Level 18 -> 19
    13000, // Level 19 -> 20
  ] as const,

  // Level titles
  titles: {
    1: 'Newbie',
    2: 'Rookie',
    5: 'Rising Star',
    10: 'Competitor',
    15: 'Challenge Seeker',
    20: 'Squad Veteran',
    25: 'Elite Player',
    30: 'Legend',
    40: 'Hall of Famer',
    50: 'Mythic',
  } as Record<number, string>,

  // Get level title based on current level
  getTitle: (level: number): string => {
    const titles = levelConfig.titles;
    const milestones = Object.keys(titles).map(Number).sort((a, b) => b - a);
    for (const milestone of milestones) {
      if (level >= milestone) {
        return titles[milestone];
      }
    }
    return 'Newbie';
  },

  // Calculate total XP needed to reach a level
  getTotalXpForLevel: (level: number): number => {
    const xpLevels = levelConfig.xpPerLevel;
    let total = 0;
    for (let i = 0; i < level - 1 && i < xpLevels.length; i++) {
      total += xpLevels[i];
    }
    // For levels beyond our array, use the last value * 1.2 for each additional level
    if (level > xpLevels.length) {
      const lastXp = xpLevels[xpLevels.length - 1];
      for (let i = xpLevels.length; i < level - 1; i++) {
        total += Math.floor(lastXp * Math.pow(1.2, i - xpLevels.length + 1));
      }
    }
    return total;
  },

  // Get XP needed for next level from current level
  getXpForNextLevel: (level: number): number => {
    const xpLevels = levelConfig.xpPerLevel;
    if (level <= xpLevels.length) {
      return xpLevels[level - 1];
    }
    // For levels beyond our array
    const lastXp = xpLevels[xpLevels.length - 1];
    return Math.floor(lastXp * Math.pow(1.2, level - xpLevels.length));
  },

  // Calculate level from total XP
  getLevelFromXp: (totalXp: number): { level: number; currentXp: number; xpForNext: number } => {
    let level = 1;
    let xpRemaining = totalXp;

    while (true) {
      const xpNeeded = levelConfig.getXpForNextLevel(level);
      if (xpRemaining < xpNeeded) {
        return {
          level,
          currentXp: xpRemaining,
          xpForNext: xpNeeded,
        };
      }
      xpRemaining -= xpNeeded;
      level++;
    }
  },
} as const;

// Streak configuration
export const streakConfig = {
  tiers: {
    warm: { minDays: 1, maxDays: 6, color: colors.streakWarm, label: 'Warm' },
    hot: { minDays: 7, maxDays: 29, color: colors.streakHot, label: 'Hot' },
    fire: { minDays: 30, maxDays: 99, color: colors.streakFire, label: 'On Fire' },
    legendary: { minDays: 100, maxDays: Infinity, color: colors.streakLegendary, label: 'Legendary' },
  } as const,

  getTier: (days: number): 'warm' | 'hot' | 'fire' | 'legendary' => {
    if (days >= 100) return 'legendary';
    if (days >= 30) return 'fire';
    if (days >= 7) return 'hot';
    return 'warm';
  },

  getColor: (days: number): string => {
    const tier = streakConfig.getTier(days);
    return streakConfig.tiers[tier].color;
  },
} as const;

export type EventType = keyof typeof eventColors;
export type StreakTier = keyof typeof streakConfig.tiers;

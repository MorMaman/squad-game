/**
 * Squad Game - VIBRANT Game Color Palette
 * Inspired by Candy Crush, Clash Royale, and Brawl Stars
 * These colors are designed to create excitement and dopamine hits!
 */

export const GAME_COLORS = {
  // Primary Action Colors - Maximum Excitement
  primary: {
    orange: '#FF6B00', // Primary CTA, urgent actions
    coral: '#FF4757', // Notifications, alerts, competition
    purple: '#9B59FF', // Special events, premium, mystery
  },

  // Reward & Achievement Colors - Dopamine Triggers
  reward: {
    gold: '#FFD700', // XP, coins, primary rewards
    goldGlow: '#FFA500', // Gold glow effect
    champion: '#F1C40F', // Victory, first place
  },

  // Energy & Progress Colors - Momentum
  energy: {
    cyan: '#00D4FF', // Active states, progress, energy
    green: '#00FF87', // Success, completion, go
    blue: '#3742FA', // Secondary actions, info
  },

  // Background & Base Colors - Deep, Immersive
  background: {
    dark: '#0A0E27', // Primary background (makes colors pop!)
    medium: '#1A1A2E', // Secondary background
    card: '#16213E', // Card backgrounds
  },

  // Accent & Glow Colors - Visual Flair
  accent: {
    pink: '#FF2D92', // Social, celebration accents
    fire: '#FF3838', // Urgency, limited time
    ice: '#F0F8FF', // Text, highlights
  },

  // Gradient Combinations - For LinearGradient components
  gradients: {
    victory: ['#FFD700', '#FF6B00'] as const,
    power: ['#00D4FF', '#9B59FF'] as const,
    fire: ['#FF4757', '#FF6B00'] as const,
    legendary: ['#9B59FF', '#FF2D92'] as const,
    success: ['#00FF87', '#00D4FF'] as const,
    energy: ['#3742FA', '#00D4FF'] as const,
    gold: ['#FFD700', '#FFA500'] as const,
    champion: ['#F1C40F', '#FF6B00'] as const,
  },

  // Glow Colors (with alpha for shadows)
  glow: {
    orange: 'rgba(255, 107, 0, 0.6)',
    coral: 'rgba(255, 71, 87, 0.6)',
    purple: 'rgba(155, 89, 255, 0.6)',
    gold: 'rgba(255, 215, 0, 0.7)',
    cyan: 'rgba(0, 212, 255, 0.6)',
    green: 'rgba(0, 255, 135, 0.6)',
    pink: 'rgba(255, 45, 146, 0.6)',
  },

  // Confetti Colors - Celebration Particles
  confetti: [
    '#FF6B00', // Orange
    '#FFD700', // Gold
    '#00FF87', // Green
    '#00D4FF', // Cyan
    '#9B59FF', // Purple
    '#FF2D92', // Pink
    '#F1C40F', // Yellow
    '#FF4757', // Coral
  ] as const,

  // Rarity Colors - For player cards and items
  rarity: {
    common: {
      primary: '#4A5568',
      gradient: ['#4A5568', '#1A1A2E'] as const,
    },
    rare: {
      primary: '#00D4FF',
      gradient: ['#00D4FF', '#3742FA'] as const,
    },
    epic: {
      primary: '#9B59FF',
      gradient: ['#9B59FF', '#FF2D92'] as const,
    },
    legendary: {
      primary: '#FFD700',
      gradient: ['#FFD700', '#FF6B00', '#9B59FF'] as const,
    },
  },

  // Status Colors - Clear Feedback
  status: {
    live: '#00FF87', // Live event
    upcoming: '#FF6B00', // Upcoming
    ended: '#4A5568', // Ended
    success: '#00FF87',
    warning: '#FF6B00',
    error: '#FF4757',
  },
} as const;

// Animation Spring Configurations - For React Native Reanimated
export const GAME_SPRINGS = {
  // Bouncy button press
  bouncy: {
    damping: 8,
    stiffness: 400,
  },
  // Gentle spring for content
  gentle: {
    damping: 15,
    stiffness: 200,
  },
  // Snappy response
  snappy: {
    damping: 12,
    stiffness: 500,
  },
  // Wobbly celebration
  wobbly: {
    damping: 4,
    stiffness: 300,
  },
} as const;

// Animation Duration Presets
export const GAME_DURATIONS = {
  instant: 50,
  fast: 100,
  quick: 150,
  normal: 300,
  slow: 500,
  counting: 800,
  countingLong: 1500,
  celebration: 2000,
  confetti: 3000,
  breathing: 4000,
} as const;

export type GameGradientName = keyof typeof GAME_COLORS.gradients;
export type RarityLevel = keyof typeof GAME_COLORS.rarity;

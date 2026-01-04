/**
 * Squad Game Theme - Central Export
 * Exports all theme-related constants and utilities
 */

export {
  colors,
  gradients,
  eventColors,
  componentColors,
  animationTimings,
  spacing,
  borderRadius,
  typography,
  levelConfig,
  streakConfig,
} from './colors';

export type { EventType, StreakTier } from './colors';

// Game-specific vibrant colors (Candy Crush / Clash Royale inspired)
export {
  GAME_COLORS,
  GAME_SPRINGS,
  GAME_DURATIONS,
} from './gameColors';

export type { GameGradientName, RarityLevel } from './gameColors';

// Clash Royale specific theme for authentic CR-style UI
export { clashRoyaleTheme } from './clashRoyaleTheme';
export type { ClashRoyaleTheme } from './clashRoyaleTheme';

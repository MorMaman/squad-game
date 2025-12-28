/**
 * Game Components - Animated components for exciting game UI
 * These components bring the Squad Game to life with vibrant animations
 */

// Core Button
export { GameButton } from './GameButton';
export type { GameButtonProps } from './GameButton';

// Animated Numbers
export {
  AnimatedNumber,
  AnimatedXP,
  AnimatedScore,
  AnimatedRank,
  AnimatedStreak,
} from './AnimatedNumber';
export type { AnimatedNumberProps } from './AnimatedNumber';

// Glow Effects
export {
  GlowingElement,
  GlowingBorder,
  GlowingText,
  PulsingGlow,
} from './GlowingElement';
export type { GlowingElementProps } from './GlowingElement';

// Breathing/Idle Animations
export {
  BreathingAnimation,
  HeartbeatAnimation,
  FloatingAnimation,
  WiggleAnimation,
  BounceInAnimation,
} from './BreathingAnimation';
export type { BreathingAnimationProps } from './BreathingAnimation';

// Loaders
export {
  GameLoader,
  GameLoaderFullScreen,
  GameLoaderDots,
  GameLoaderBar,
} from './GameLoader';
export type { GameLoaderProps } from './GameLoader';

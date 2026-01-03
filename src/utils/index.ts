/**
 * Squad Game Utilities
 * Helper functions and utilities for the app
 */

export { GameHaptics } from './haptics';

// RTL (Right-to-Left) Utilities
export {
  useRTL,
  isRTLLocale,
  getDirection,
  flipStyle,
  flipHorizontal,
  getFlexDirection,
  getTextAlign,
  createRTLStyles,
  rtlSpacing,
  rtlStyle,
  shouldFlipIcon,
  getIconFlipStyle,
  forceRTL,
  isRTLSupported,
  getWritingDirection,
  FLIPPABLE_ICONS,
} from './rtl';

export type {
  Direction,
  RTLValue,
  FlippableIcon,
} from './rtl';

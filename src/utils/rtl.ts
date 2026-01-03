/**
 * RTL (Right-to-Left) Utilities for Hebrew language support
 * Provides hooks and helper functions for handling RTL layout
 */

import { I18nManager, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { useCallback, useMemo } from 'react';

/**
 * Direction type for RTL-aware styles
 */
export type Direction = 'ltr' | 'rtl';

/**
 * RTL context value type
 */
export interface RTLValue {
  isRTL: boolean;
  direction: Direction;
  flipStyle: <T extends ViewStyle | TextStyle>(style: T) => T;
}

/**
 * Check if the current locale is RTL
 */
export function isRTLLocale(): boolean {
  return I18nManager.isRTL;
}

/**
 * Get current text direction
 */
export function getDirection(): Direction {
  return I18nManager.isRTL ? 'rtl' : 'ltr';
}

/**
 * Map of style properties that need to be flipped for RTL
 */
const RTL_STYLE_MAP: Record<string, string> = {
  // Margins
  marginLeft: 'marginRight',
  marginRight: 'marginLeft',
  marginStart: 'marginEnd',
  marginEnd: 'marginStart',

  // Paddings
  paddingLeft: 'paddingRight',
  paddingRight: 'paddingLeft',
  paddingStart: 'paddingEnd',
  paddingEnd: 'paddingStart',

  // Positions
  left: 'right',
  right: 'left',
  start: 'end',
  end: 'start',

  // Borders
  borderLeftWidth: 'borderRightWidth',
  borderRightWidth: 'borderLeftWidth',
  borderLeftColor: 'borderRightColor',
  borderRightColor: 'borderLeftColor',
  borderStartWidth: 'borderEndWidth',
  borderEndWidth: 'borderStartWidth',
  borderStartColor: 'borderEndColor',
  borderEndColor: 'borderStartColor',
  borderTopLeftRadius: 'borderTopRightRadius',
  borderTopRightRadius: 'borderTopLeftRadius',
  borderBottomLeftRadius: 'borderBottomRightRadius',
  borderBottomRightRadius: 'borderBottomLeftRadius',

  // Text alignment
  textAlign: 'textAlign', // Special handling needed
};

/**
 * Flip a style property for RTL
 */
function flipStyleProperty(key: string, value: any): [string, any] {
  // Special handling for textAlign
  if (key === 'textAlign') {
    if (value === 'left') return [key, 'right'];
    if (value === 'right') return [key, 'left'];
    return [key, value];
  }

  // Special handling for flexDirection
  if (key === 'flexDirection') {
    if (value === 'row') return [key, 'row-reverse'];
    if (value === 'row-reverse') return [key, 'row'];
    return [key, value];
  }

  // Special handling for transform
  if (key === 'transform' && Array.isArray(value)) {
    const flippedTransform = value.map((transform) => {
      if ('translateX' in transform) {
        return { translateX: -transform.translateX };
      }
      if ('scaleX' in transform) {
        return { scaleX: -transform.scaleX };
      }
      if ('rotateY' in transform) {
        const rotation = parseFloat(transform.rotateY);
        return { rotateY: `${-rotation}deg` };
      }
      return transform;
    });
    return [key, flippedTransform];
  }

  // Flip mapped properties
  const flippedKey = RTL_STYLE_MAP[key];
  if (flippedKey && flippedKey !== key) {
    return [flippedKey, value];
  }

  return [key, value];
}

/**
 * Flip a style object for RTL layout
 * Only flips if the app is in RTL mode
 */
export function flipStyle<T extends ViewStyle | TextStyle>(
  style: T,
  forceFlip: boolean = false
): T {
  if (!I18nManager.isRTL && !forceFlip) {
    return style;
  }

  const flippedStyle: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    const [flippedKey, flippedValue] = flipStyleProperty(key, value);
    flippedStyle[flippedKey] = flippedValue;
  }

  return flippedStyle as T;
}

/**
 * Flip horizontal transform for icons and images
 * Useful for directional icons like arrows, chevrons
 */
export function flipHorizontal(): ViewStyle {
  if (!I18nManager.isRTL) {
    return {};
  }

  return {
    transform: [{ scaleX: -1 }],
  };
}

/**
 * Get RTL-aware flex direction
 * Returns 'row-reverse' for RTL, 'row' for LTR
 */
export function getFlexDirection(reverse: boolean = false): 'row' | 'row-reverse' {
  const isRTL = I18nManager.isRTL;
  if (reverse) {
    return isRTL ? 'row' : 'row-reverse';
  }
  return isRTL ? 'row-reverse' : 'row';
}

/**
 * Get RTL-aware text alignment
 */
export function getTextAlign(align: 'start' | 'end' | 'center' | 'left' | 'right'): TextStyle['textAlign'] {
  if (align === 'center') return 'center';

  const isRTL = I18nManager.isRTL;

  if (align === 'start') {
    return isRTL ? 'right' : 'left';
  }
  if (align === 'end') {
    return isRTL ? 'left' : 'right';
  }

  return align;
}

/**
 * Create RTL-aware styles using StyleSheet.create pattern
 * Automatically flips styles when in RTL mode
 */
export function createRTLStyles<T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>
): T {
  if (!I18nManager.isRTL) {
    return StyleSheet.create(styles) as T;
  }

  const flippedStyles: Record<string, any> = {};

  for (const [styleName, styleValue] of Object.entries(styles)) {
    flippedStyles[styleName] = flipStyle(styleValue as ViewStyle | TextStyle);
  }

  return StyleSheet.create(flippedStyles as T) as T;
}

/**
 * Helper to create margin/padding with RTL support
 */
export function rtlSpacing(
  start: number,
  end: number,
  type: 'margin' | 'padding' = 'margin'
): ViewStyle {
  return {
    [`${type}Start`]: start,
    [`${type}End`]: end,
  } as ViewStyle;
}

/**
 * RTL-aware style helper that takes LTR and RTL styles
 * and returns the appropriate one based on current direction
 */
export function rtlStyle<T extends ViewStyle | TextStyle>(
  ltrStyle: T,
  rtlStyleOverride?: Partial<T>
): T {
  if (!I18nManager.isRTL) {
    return ltrStyle;
  }

  if (rtlStyleOverride) {
    return { ...ltrStyle, ...rtlStyleOverride } as T;
  }

  return flipStyle(ltrStyle);
}

/**
 * Hook to get RTL utilities
 * Returns isRTL, direction, and flipStyle function
 */
export function useRTL(): RTLValue {
  const isRTL = I18nManager.isRTL;
  const direction: Direction = isRTL ? 'rtl' : 'ltr';

  const flipStyleFn = useCallback(<T extends ViewStyle | TextStyle>(style: T): T => {
    return flipStyle(style);
  }, []);

  return useMemo(
    () => ({
      isRTL,
      direction,
      flipStyle: flipStyleFn,
    }),
    [isRTL, direction, flipStyleFn]
  );
}

/**
 * Icons that should be flipped in RTL mode
 * Directional icons like arrows, chevrons, etc.
 */
export const FLIPPABLE_ICONS = [
  'arrow-back',
  'arrow-forward',
  'chevron-back',
  'chevron-forward',
  'caret-back',
  'caret-forward',
  'play',
  'play-forward',
  'play-back',
  'arrow-back-circle',
  'arrow-forward-circle',
  'chevron-back-circle',
  'chevron-forward-circle',
  'arrow-back-outline',
  'arrow-forward-outline',
  'chevron-back-outline',
  'chevron-forward-outline',
  'return-down-back',
  'return-down-forward',
  'return-up-back',
  'return-up-forward',
  'exit',
  'enter',
  'log-in',
  'log-out',
  'push',
  'backspace',
] as const;

export type FlippableIcon = typeof FLIPPABLE_ICONS[number];

/**
 * Check if an icon should be flipped in RTL mode
 */
export function shouldFlipIcon(iconName: string): boolean {
  return FLIPPABLE_ICONS.includes(iconName as FlippableIcon);
}

/**
 * Get icon flip style if needed
 */
export function getIconFlipStyle(iconName: string): ViewStyle {
  if (I18nManager.isRTL && shouldFlipIcon(iconName)) {
    return { transform: [{ scaleX: -1 }] };
  }
  return {};
}

/**
 * Force RTL layout (for development/testing)
 * Note: This requires app restart to take effect
 */
export async function forceRTL(enable: boolean): Promise<void> {
  if (I18nManager.isRTL !== enable) {
    I18nManager.allowRTL(enable);
    I18nManager.forceRTL(enable);
  }
}

/**
 * Check if RTL is supported on current platform
 */
export function isRTLSupported(): boolean {
  // RTL is supported on all platforms React Native targets
  return true;
}

/**
 * Get writing direction style for Text components
 */
export function getWritingDirection(): TextStyle {
  return {
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  };
}

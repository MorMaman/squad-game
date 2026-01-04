/**
 * Clash Royale Theme
 * Exact design specifications from the Clash Royale game UI
 * Deep blue backgrounds, light card panels, vibrant buttons with 3D effects
 */

// Color palette interface
export interface ClashRoyaleColors {
  // Background colors
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;

  // Card/Panel colors (light blue-gray tones)
  cardLight: string;
  cardMedium: string;
  cardDark: string;
  cardBorder: string;

  // Button colors
  buttonGreen: string;
  buttonGreenDark: string;
  buttonGreenBorder: string;
  buttonBlue: string;
  buttonBlueDark: string;
  buttonBlueBorder: string;
  buttonRed: string;
  buttonRedDark: string;
  buttonRedBorder: string;
  buttonDisabled: string;
  buttonDisabledBorder: string;

  // Accent colors
  gold: string;
  goldDark: string;
  goldLight: string;
  trophyGold: string;
  purple: string;
  purpleDark: string;

  // Notification/Badge colors
  notificationRed: string;
  notificationRedDark: string;

  // Text colors
  textOnDark: string;
  textOnLight: string;
  textMuted: string;
  textGold: string;
  textBlue: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Special UI colors
  elixirPurple: string;
  rarityCommon: string;
  rarityRare: string;
  rarityEpic: string;
  rarityLegendary: string;
  rarityChampion: string;

  // Border colors
  borderLight: string;
  borderMedium: string;
  borderDark: string;
  borderGold: string;

  // Overlay colors
  overlayDark: string;
  overlayLight: string;
}

// Gradient definitions interface
export interface ClashRoyaleGradients {
  background: readonly [string, string];
  backgroundExtended: readonly [string, string, string];
  cardPanel: readonly [string, string];
  buttonGreen: readonly [string, string];
  buttonBlue: readonly [string, string];
  buttonRed: readonly [string, string];
  gold: readonly [string, string];
  goldShine: readonly [string, string, string];
  elixir: readonly [string, string];
  legendary: readonly [string, string, string];
  victory: readonly [string, string];
  header: readonly [string, string];
}

// Shadow definitions interface
export interface ClashRoyaleShadows {
  button: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  buttonPressed: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  cardElevated: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  text: {
    textShadowColor: string;
    textShadowOffset: { width: number; height: number };
    textShadowRadius: number;
  };
  textStrong: {
    textShadowColor: string;
    textShadowOffset: { width: number; height: number };
    textShadowRadius: number;
  };
  glow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  goldGlow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

// Border radius definitions interface
export interface ClashRoyaleBorderRadius {
  sm: number;
  md: number;
  lg: number;
  pill: number;
  round: number;
  button: number;
  card: number;
  badge: number;
  input: number;
}

// Spacing definitions interface
export interface ClashRoyaleSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Typography definitions interface
export interface ClashRoyaleTypography {
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    display: number;
    hero: number;
  };
  fontWeights: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extrabold: '800';
    black: '900';
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

// Complete theme interface
export interface ClashRoyaleTheme {
  colors: ClashRoyaleColors;
  gradients: ClashRoyaleGradients;
  shadows: ClashRoyaleShadows;
  borderRadius: ClashRoyaleBorderRadius;
  spacing: ClashRoyaleSpacing;
  typography: ClashRoyaleTypography;
  // UI Component-specific properties (for backward compatibility)
  topBar: {
    background: string;
    height: number;
  };
  levelBadge: {
    primary: string;
    secondary: string;
    gradient: readonly [string, string, string];
    border: string;
    text: string;
    shadow: string;
  };
  xpBar: {
    background: string;
    fill: string;
    fillGradient: readonly [string, string];
    text: string;
    border: string;
  };
  gold: {
    iconColor: string;
    iconGradient: readonly [string, string, string];
    background: string;
    text: string;
    border: string;
  };
  gems: {
    iconColor: string;
    iconGradient: readonly [string, string, string];
    background: string;
    text: string;
    border: string;
  };
  stars: {
    iconColor: string;
    iconGradient: readonly [string, string, string];
    background: string;
    text: string;
    border: string;
  };
  addButton: {
    background: string;
    backgroundGradient: readonly [string, string, string];
    pressedBackground: string;
    border: string;
    icon: string;
    shadow: string;
  };
  currencyPill: {
    background: string;
    border: string;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
  };
  text: {
    primary: string;
    secondary: string;
    shadow: {
      color: string;
      offset: { width: number; height: number };
      radius: number;
    };
  };
  iconSizes: {
    small: number;
    medium: number;
    large: number;
    levelIcon: number;
  };
  animation: {
    buttonScale: number;
    numberBounce: number;
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
  };
}

// Colors from Clash Royale screenshots
const colors: ClashRoyaleColors = {
  // Background colors - Deep blue tones
  backgroundPrimary: '#0D1A30',
  backgroundSecondary: '#1A2A4A',
  backgroundGradientStart: '#1A2A4A',
  backgroundGradientEnd: '#0D1A30',

  // Card/Panel colors - Light blue-gray tones
  cardLight: '#D8E2EC',
  cardMedium: '#B8CDE0',
  cardDark: '#A8C0D8',
  cardBorder: '#8BACC8',

  // Green button (primary CTA)
  buttonGreen: '#5CB85C',
  buttonGreenDark: '#4CAE4C',
  buttonGreenBorder: '#3D8B3D',

  // Blue button (secondary)
  buttonBlue: '#3498DB',
  buttonBlueDark: '#2980B9',
  buttonBlueBorder: '#1F6391',

  // Red button (danger/cancel)
  buttonRed: '#E74C3C',
  buttonRedDark: '#C0392B',
  buttonRedBorder: '#962D22',

  // Disabled button
  buttonDisabled: '#7F8C8D',
  buttonDisabledBorder: '#5D6D6E',

  // Gold/Yellow - Currency and highlights
  gold: '#FFD700',
  goldDark: '#DAA520',
  goldLight: '#FFE55C',
  trophyGold: '#DAA520',

  // Purple/Magenta - Special items
  purple: '#9B59B6',
  purpleDark: '#8E44AD',

  // Notification badges
  notificationRed: '#E74C3C',
  notificationRedDark: '#C0392B',

  // Text colors
  textOnDark: '#FFFFFF',
  textOnLight: '#2C3E50',
  textMuted: '#7F8C8D',
  textGold: '#FFD700',
  textBlue: '#3498DB',

  // Status colors
  success: '#5CB85C',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',

  // Special UI colors
  elixirPurple: '#E056FD',
  rarityCommon: '#9E9E9E',
  rarityRare: '#FF9800',
  rarityEpic: '#9C27B0',
  rarityLegendary: '#FFD700',
  rarityChampion: '#00BCD4',

  // Border colors
  borderLight: '#C8D8E8',
  borderMedium: '#8BACC8',
  borderDark: '#5D7A8C',
  borderGold: '#DAA520',

  // Overlay colors
  overlayDark: 'rgba(13, 26, 48, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
} as const;

// Gradient definitions
const gradients: ClashRoyaleGradients = {
  // Main background gradient (top to bottom)
  background: ['#1A2A4A', '#0D1A30'] as const,
  backgroundExtended: ['#1A2A4A', '#142238', '#0D1A30'] as const,

  // Card panel gradient
  cardPanel: ['#D8E2EC', '#B8CDE0'] as const,

  // Button gradients
  buttonGreen: ['#5CB85C', '#4CAE4C'] as const,
  buttonBlue: ['#3498DB', '#2980B9'] as const,
  buttonRed: ['#E74C3C', '#C0392B'] as const,

  // Gold gradients
  gold: ['#FFD700', '#DAA520'] as const,
  goldShine: ['#FFE55C', '#FFD700', '#DAA520'] as const,

  // Elixir gradient
  elixir: ['#E056FD', '#9B59B6'] as const,

  // Legendary card gradient
  legendary: ['#FFD700', '#FF8C00', '#FFD700'] as const,

  // Victory gradient
  victory: ['#FFD700', '#5CB85C'] as const,

  // Header gradient
  header: ['#2C3E50', '#1A2A4A'] as const,
} as const;

// Shadow definitions
const shadows: ClashRoyaleShadows = {
  // 3D button shadow (Clash Royale style - shadow at bottom)
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 8,
  },

  // Pressed button shadow (reduced depth)
  buttonPressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },

  // Card shadow
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Elevated card shadow
  cardElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },

  // Text shadow (for text on dark backgrounds)
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Strong text shadow (for important text)
  textStrong: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },

  // Generic glow effect
  glow: {
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },

  // Gold glow effect (for rewards, currency)
  goldGlow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Border radius values
const borderRadius: ClashRoyaleBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 16,
  round: 9999,
  button: 8,
  card: 12,
  badge: 16,
  input: 8,
} as const;

// Spacing values
const spacing: ClashRoyaleSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography values
const typography: ClashRoyaleTypography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 56,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
  },
} as const;

// Complete theme export
export const clashRoyaleTheme: ClashRoyaleTheme = {
  colors,
  gradients,
  shadows,
  borderRadius,
  spacing,
  typography,

  // UI Component-specific properties (for backward compatibility with TopCurrencyBar etc.)
  topBar: {
    background: 'rgba(0, 0, 0, 0.60)',
    height: 56,
  },

  levelBadge: {
    primary: '#2196F3',
    secondary: '#1565C0',
    gradient: ['#42A5F5', '#1976D2', '#0D47A1'] as const,
    border: '#64B5F6',
    text: '#FFFFFF',
    shadow: 'rgba(33, 150, 243, 0.5)',
  },

  xpBar: {
    background: 'rgba(0, 0, 0, 0.4)',
    fill: '#4CAF50',
    fillGradient: ['#66BB6A', '#43A047'] as const,
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)',
  },

  gold: {
    iconColor: '#FFD700',
    iconGradient: ['#FFD700', '#FFA000', '#FF8F00'] as const,
    background: 'rgba(30, 30, 30, 0.85)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  gems: {
    iconColor: '#E91E63',
    iconGradient: ['#F48FB1', '#E91E63', '#C2185B'] as const,
    background: 'rgba(30, 30, 30, 0.85)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  stars: {
    iconColor: '#FFD700',
    iconGradient: ['#FFEB3B', '#FFD700', '#FFA000'] as const,
    background: 'rgba(30, 30, 30, 0.85)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  addButton: {
    background: '#5CB85C',
    backgroundGradient: ['#6ECC6E', '#5CB85C', '#4CAF50'] as const,
    pressedBackground: '#4CAF50',
    border: '#4CAF50',
    icon: '#FFFFFF',
    shadow: 'rgba(92, 184, 92, 0.4)',
  },

  currencyPill: {
    background: 'rgba(30, 30, 30, 0.85)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offset: { width: 0, height: 1 },
      radius: 2,
    },
  },

  iconSizes: {
    small: 16,
    medium: 20,
    large: 24,
    levelIcon: 22,
  },

  animation: {
    buttonScale: 0.92,
    numberBounce: 1.2,
    duration: {
      fast: 100,
      normal: 200,
      slow: 300,
    },
  },
} as const;

// Helper functions for common Clash Royale styles
export const clashRoyaleHelpers = {
  /**
   * Get button style based on variant
   */
  getButtonStyle: (variant: 'green' | 'blue' | 'red' | 'disabled') => {
    const styles = {
      green: {
        backgroundColor: colors.buttonGreen,
        borderColor: colors.buttonGreenBorder,
        borderBottomColor: colors.buttonGreenDark,
      },
      blue: {
        backgroundColor: colors.buttonBlue,
        borderColor: colors.buttonBlueBorder,
        borderBottomColor: colors.buttonBlueDark,
      },
      red: {
        backgroundColor: colors.buttonRed,
        borderColor: colors.buttonRedBorder,
        borderBottomColor: colors.buttonRedDark,
      },
      disabled: {
        backgroundColor: colors.buttonDisabled,
        borderColor: colors.buttonDisabledBorder,
        borderBottomColor: colors.buttonDisabledBorder,
      },
    };
    return styles[variant];
  },

  /**
   * Get rarity color
   */
  getRarityColor: (rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'champion') => {
    const rarityColors = {
      common: colors.rarityCommon,
      rare: colors.rarityRare,
      epic: colors.rarityEpic,
      legendary: colors.rarityLegendary,
      champion: colors.rarityChampion,
    };
    return rarityColors[rarity];
  },

  /**
   * Create 3D button border style
   */
  get3DButtonBorder: (baseColor: string, darkColor: string) => ({
    borderWidth: 3,
    borderTopWidth: 2,
    borderBottomWidth: 4,
    borderColor: baseColor,
    borderBottomColor: darkColor,
    borderRadius: borderRadius.button,
  }),

  /**
   * Get card panel style
   */
  getCardPanelStyle: () => ({
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    ...shadows.card,
  }),
} as const;

// Type exports for external use
export type ButtonVariant = 'green' | 'blue' | 'red' | 'disabled';
export type RarityType = 'common' | 'rare' | 'epic' | 'legendary' | 'champion';

export default clashRoyaleTheme;

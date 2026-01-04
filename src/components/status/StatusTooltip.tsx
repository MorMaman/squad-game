/**
 * StatusTooltip.tsx
 * Reusable tooltip component for player status indicators
 * Appears on tap of any indicator with dark themed popup
 * Auto-dismiss after 3 seconds or tap elsewhere
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../../theme/gameColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface StatusTooltipProps {
  /** Tooltip title */
  title: string;
  /** Tooltip description text */
  description: string;
  /** Whether tooltip is visible */
  isVisible: boolean;
  /** Callback when tooltip should be dismissed */
  onDismiss: () => void;
  /** Optional accent color for the title */
  accentColor?: string;
  /** Position relative to parent (for arrow placement) */
  position?: 'above' | 'below';
  /** Auto-dismiss timeout in ms (default 3000, 0 to disable) */
  autoDismissMs?: number;
}

export function StatusTooltip({
  title,
  description,
  isVisible,
  onDismiss,
  accentColor = GAME_COLORS.energy.cyan,
  position = 'above',
  autoDismissMs = 3000,
}: StatusTooltipProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(position === 'above' ? 10 : -10);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, GAME_SPRINGS.bouncy);
      translateY.value = withSpring(0, GAME_SPRINGS.gentle);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
      translateY.value = withTiming(position === 'above' ? 10 : -10, { duration: 150 });
    }
  }, [isVisible, position]);

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissMs, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  // Platform-specific shadow
  const shadowStyle = Platform.select({
    web: {
      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5)`,
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.container,
            shadowStyle,
            animatedStyle,
          ]}
        >
          {/* Tooltip content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: accentColor }]}>
              {title}
            </Text>
            <Text style={styles.description}>
              {description}
            </Text>
          </View>

          {/* Decorative accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/**
 * Inline tooltip variant that positions relative to a parent element
 * Use this when you need the tooltip attached to a specific element
 */
export interface InlineTooltipProps extends Omit<StatusTooltipProps, 'position'> {
  /** Anchor element to position relative to */
  children?: React.ReactNode;
}

export function InlineTooltip({
  title,
  description,
  isVisible,
  onDismiss,
  accentColor = GAME_COLORS.energy.cyan,
  autoDismissMs = 3000,
}: InlineTooltipProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, GAME_SPRINGS.gentle);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && autoDismissMs > 0) {
      const timer = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissMs, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const shadowStyle = Platform.select({
    web: {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  if (!isVisible) return null;

  return (
    <Pressable onPress={onDismiss} style={styles.inlineWrapper}>
      <Animated.View style={[styles.inlineContainer, shadowStyle, animatedStyle]}>
        <Text style={[styles.inlineTitle, { color: accentColor }]}>{title}</Text>
        <Text style={styles.inlineDescription}>{description}</Text>

        {/* Arrow pointing down */}
        <View style={[styles.arrow, { borderTopColor: GAME_COLORS.background.card }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: GAME_COLORS.background.card,
    borderRadius: borderRadius.lg,
    maxWidth: SCREEN_WIDTH - spacing.xl * 2,
    minWidth: 240,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GAME_COLORS.background.medium,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  // Inline tooltip styles
  inlineWrapper: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -100 }],
    marginBottom: 8,
    zIndex: 100,
  },
  inlineContainer: {
    backgroundColor: GAME_COLORS.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 200,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: GAME_COLORS.background.medium,
  },
  inlineTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    marginBottom: spacing.xs,
  },
  inlineDescription: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  arrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default StatusTooltip;

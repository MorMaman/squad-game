/**
 * AddCompetitionButton - Dashed Border Add Button
 * A stylized button for adding new competitions
 *
 * Design: Dashed border, plus icon, press animation
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GameHaptics } from '../../utils/haptics';

// Button Colors
const BUTTON_COLORS = {
  background: '#0A0E27',
  cardBackground: '#1A1A2E',
  lime: '#A3E635',
  limeDark: '#65A30D',
  limeGlow: 'rgba(163, 230, 53, 0.3)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#3F3F46',
  borderHover: '#52525B',
};

export interface AddCompetitionButtonProps {
  /** Button text */
  title?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom accent color */
  accentColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show pulsing animation */
  pulsing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AddCompetitionButton({
  title = 'Add New Competition',
  icon = 'add',
  onPress,
  disabled = false,
  accentColor = BUTTON_COLORS.lime,
  style,
  size = 'medium',
  pulsing = true,
}: AddCompetitionButtonProps) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const sizeConfig = {
    small: { paddingVertical: 14, iconSize: 20, fontSize: 13 },
    medium: { paddingVertical: 18, iconSize: 24, fontSize: 14 },
    large: { paddingVertical: 24, iconSize: 28, fontSize: 16 },
  }[size];

  // Pulsing border animation
  useEffect(() => {
    if (pulsing && !disabled) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      borderOpacity.value = 1;
    }
  }, [pulsing, disabled]);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.96, { duration: 100 });
      iconScale.value = withTiming(0.8, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSequence(
        withSpring(1.03, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 6, stiffness: 500 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      rotation.value = withSequence(
        withTiming(90, { duration: 150 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      );
    }
  };

  const handlePress = () => {
    if (!disabled) {
      GameHaptics.action();
      onPress();
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // Platform-specific styles
  const webHoverStyle = Platform.select({
    web: {
      cursor: disabled ? 'not-allowed' : 'pointer',
    } as ViewStyle,
    default: {},
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        animatedContainerStyle,
        webHoverStyle,
        style,
      ]}
    >
      <Animated.View style={animatedBorderStyle}>
        <View
          style={[
            styles.button,
            {
              paddingVertical: sizeConfig.paddingVertical,
              borderColor: disabled ? BUTTON_COLORS.textMuted : accentColor,
            },
            disabled && styles.disabled,
          ]}
        >
          {/* Dashed Border Overlay (simulated with View) */}
          <View style={styles.dashedBorderContainer}>
            {/* Top dashes */}
            <View style={styles.dashedBorderRow}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={`top-${i}`}
                  style={[
                    styles.dash,
                    { backgroundColor: disabled ? BUTTON_COLORS.textMuted : accentColor },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: disabled
                      ? BUTTON_COLORS.textMuted + '20'
                      : accentColor + '20',
                    borderColor: disabled
                      ? BUTTON_COLORS.textMuted
                      : accentColor,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={sizeConfig.iconSize}
                  color={disabled ? BUTTON_COLORS.textMuted : accentColor}
                />
              </View>
            </Animated.View>

            <Text
              style={[
                styles.title,
                { fontSize: sizeConfig.fontSize },
                disabled && styles.titleDisabled,
                { color: disabled ? BUTTON_COLORS.textMuted : accentColor },
              ]}
            >
              {title}
            </Text>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  dashedBorderContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  dashedBorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleDisabled: {
    color: BUTTON_COLORS.textMuted,
  },
});

export default AddCompetitionButton;

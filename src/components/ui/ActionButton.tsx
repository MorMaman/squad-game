/**
 * ActionButton - Clash Royale Style Button
 * A vibrant, 3D-styled button with press animation and haptic feedback
 * Inspired by Clash Royale's distinctive button design
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { clashRoyaleTheme } from '../../theme/clashRoyaleTheme';
import { GameHaptics } from '../../utils/haptics';

export interface ActionButtonProps {
  title: string;
  variant: 'primary' | 'success' | 'info' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Button variant configurations
const VARIANT_CONFIG = {
  primary: {
    backgroundColor: '#FFD700',
    borderBottomColor: '#DAA520',
    textColor: '#2C3E50',
    spinnerColor: '#2C3E50',
  },
  success: {
    backgroundColor: '#5CB85C',
    borderBottomColor: '#4CAE4C',
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
  },
  info: {
    backgroundColor: '#3498DB',
    borderBottomColor: '#2980B9',
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
  },
  danger: {
    backgroundColor: '#E74C3C',
    borderBottomColor: '#C0392B',
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
  },
} as const;

// Size configurations
const SIZE_CONFIG = {
  sm: {
    height: 36,
    paddingHorizontal: 16,
    fontSize: 12,
    iconSize: 14,
    borderBottomWidth: 3,
  },
  md: {
    height: 48,
    paddingHorizontal: 24,
    fontSize: 14,
    iconSize: 18,
    borderBottomWidth: 4,
  },
  lg: {
    height: 60,
    paddingHorizontal: 32,
    fontSize: 16,
    iconSize: 22,
    borderBottomWidth: 5,
  },
} as const;

export function ActionButton({
  title,
  variant,
  onPress,
  disabled = false,
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  style,
}: ActionButtonProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const variantConfig = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    if (!isDisabled) {
      // Simulate 3D button press by moving down and reducing shadow
      translateY.value = withTiming(2, {
        duration: clashRoyaleTheme.animation.duration.fast,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(0.98, {
        duration: clashRoyaleTheme.animation.duration.fast,
        easing: Easing.out(Easing.ease),
      });
      GameHaptics.buttonPress();
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      // Return to original position
      translateY.value = withTiming(0, {
        duration: clashRoyaleTheme.animation.duration.fast,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(1, {
        duration: clashRoyaleTheme.animation.duration.fast,
        easing: Easing.out(Easing.ease),
      });
    }
  };

  const handlePress = () => {
    if (!isDisabled) {
      GameHaptics.action();
      onPress();
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    // Reduce border bottom when pressed to simulate 3D depth change
    borderBottomWidth: sizeConfig.borderBottomWidth - translateY.value,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedButtonStyle,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: variantConfig.backgroundColor,
            borderBottomColor: variantConfig.borderBottomColor,
            height: sizeConfig.height,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            borderBottomWidth: sizeConfig.borderBottomWidth,
          },
          animatedBorderStyle,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variantConfig.spinnerColor}
            size={size === 'sm' ? 'small' : 'small'}
          />
        ) : (
          <View style={styles.content}>
            {icon && (
              <Ionicons
                name={icon}
                size={sizeConfig.iconSize}
                color={variantConfig.textColor}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.text,
                {
                  color: variantConfig.textColor,
                  fontSize: sizeConfig.fontSize,
                },
                isDisabled && styles.disabledText,
              ]}
            >
              {title.toUpperCase()}
            </Text>
          </View>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: clashRoyaleTheme.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // 3D effect shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: clashRoyaleTheme.typography.fontWeights.bold,
    letterSpacing: clashRoyaleTheme.typography.letterSpacing.wide,
    textTransform: 'uppercase',
    // Text shadow for better readability
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  fullWidth: {
    width: '100%',
  },
});

export default ActionButton;

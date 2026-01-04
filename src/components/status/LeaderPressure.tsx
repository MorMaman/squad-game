/**
 * LeaderPressure.tsx
 * Anti-runaway leader indicator showing pressure level
 * Neutral "High Pressure" icon (thermometer/gauge)
 * Shows on current leader when soft balancing is active
 * Three pressure levels with different colors
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../../theme/gameColors';
import { StatusTooltip } from './StatusTooltip';

export type PressureLevel = 'low' | 'medium' | 'high';

export interface LeaderPressureProps {
  /** Current pressure level */
  pressureLevel: PressureLevel;
  /** Whether the indicator is visible */
  isVisible: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the pressure label */
  showLabel?: boolean;
  /** Custom tooltip content */
  tooltipTitle?: string;
  tooltipDescription?: string;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    height: 20,
    paddingHorizontal: 6,
    fontSize: 9,
    iconSize: 12,
    gap: 4,
  },
  medium: {
    height: 26,
    paddingHorizontal: 10,
    fontSize: 11,
    iconSize: 14,
    gap: 6,
  },
  large: {
    height: 32,
    paddingHorizontal: 14,
    fontSize: 13,
    iconSize: 18,
    gap: 8,
  },
};

// Pressure level configurations
const PRESSURE_CONFIG: Record<PressureLevel, {
  color: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  pulseSpeed: number;
  glowIntensity: number;
  description: string;
}> = {
  low: {
    color: GAME_COLORS.energy.cyan,
    label: 'PRESSURE',
    icon: 'speedometer-outline',
    pulseSpeed: 2000,
    glowIntensity: 0.4,
    description: 'Light competitive pressure. Keep pushing to maintain your lead!',
  },
  medium: {
    color: GAME_COLORS.primary.orange,
    label: 'HIGH PRESSURE',
    icon: 'speedometer',
    pulseSpeed: 1500,
    glowIntensity: 0.6,
    description: 'Moderate pressure from challengers. Others are getting closer to your score.',
  },
  high: {
    color: GAME_COLORS.primary.coral,
    label: 'MAX PRESSURE',
    icon: 'thermometer',
    pulseSpeed: 1000,
    glowIntensity: 0.8,
    description: 'Intense competition! The pack is right behind you. Every point counts!',
  },
};

export function LeaderPressure({
  pressureLevel,
  isVisible,
  size = 'medium',
  showLabel = true,
  tooltipTitle,
  tooltipDescription,
}: LeaderPressureProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];
  const pressureConfig = PRESSURE_CONFIG[pressureLevel];

  // Animation values
  const glowPulse = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  // Initialize animations based on pressure level
  useEffect(() => {
    if (isVisible) {
      // Pulsing glow - faster and more intense for higher pressure
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: pressureConfig.pulseSpeed / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: pressureConfig.pulseSpeed / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      // Subtle icon wobble for high pressure
      if (pressureLevel === 'high') {
        iconRotation.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 150, easing: Easing.inOut(Easing.ease) }),
            withTiming(-5, { duration: 150, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      }
    } else {
      glowPulse.value = withTiming(0, { duration: 300 });
      iconRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, pressureLevel, pressureConfig.pulseSpeed]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    const baseGlow = pressureConfig.glowIntensity;
    const glowOpacity = interpolate(glowPulse.value, [0, 1], [baseGlow * 0.5, baseGlow]);
    const glowRadius = interpolate(glowPulse.value, [0, 1], [6, 14]);
    const scaleAmount = pressureLevel === 'high' ? 0.02 : 0.01;
    const scale = interpolate(glowPulse.value, [0, 1], [1, 1 + scaleAmount]);

    return {
      transform: [{ scale: pressScale.value * scale }],
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  // Press handlers
  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, GAME_SPRINGS.bouncy);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, GAME_SPRINGS.bouncy);
  };

  const handlePress = () => {
    setShowTooltip(true);
  };

  // Platform-specific shadow
  const shadowStyle = Platform.select({
    web: {
      boxShadow: `0 0 12px ${pressureConfig.color}`,
    } as any,
    default: {
      shadowColor: pressureConfig.color,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
  });

  const title = tooltipTitle || pressureConfig.label;
  const description = tooltipDescription || pressureConfig.description;

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <Animated.View
          style={[
            styles.container,
            {
              height: sizeConfig.height,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              gap: sizeConfig.gap,
              backgroundColor: `${pressureConfig.color}20`,
              borderColor: pressureConfig.color,
            },
            shadowStyle,
            animatedContainerStyle,
          ]}
        >
          {/* Thermometer/Gauge icon */}
          <Animated.View style={animatedIconStyle}>
            <Ionicons
              name={pressureConfig.icon}
              size={sizeConfig.iconSize}
              color={pressureConfig.color}
            />
          </Animated.View>

          {/* Label */}
          {showLabel && (
            <Text
              style={[
                styles.label,
                {
                  fontSize: sizeConfig.fontSize,
                  color: pressureConfig.color,
                },
              ]}
            >
              {pressureConfig.label}
            </Text>
          )}

          {/* Pressure bars indicator */}
          <View style={styles.barsContainer}>
            {['low', 'medium', 'high'].map((level, index) => {
              const isActive = (
                (pressureLevel === 'low' && index === 0) ||
                (pressureLevel === 'medium' && index <= 1) ||
                (pressureLevel === 'high')
              );
              return (
                <View
                  key={level}
                  style={[
                    styles.bar,
                    {
                      height: 4 + (index * 3),
                      backgroundColor: isActive ? pressureConfig.color : `${pressureConfig.color}40`,
                    },
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>
      </Pressable>

      {/* Tooltip */}
      <StatusTooltip
        title={title}
        description={description}
        isVisible={showTooltip}
        onDismiss={() => setShowTooltip(false)}
        accentColor={pressureConfig.color}
      />
    </>
  );
}

/**
 * Compact indicator for lists
 */
export interface PressureIndicatorProps {
  pressureLevel: PressureLevel;
  isVisible: boolean;
}

export function PressureIndicator({ pressureLevel, isVisible }: PressureIndicatorProps) {
  const config = PRESSURE_CONFIG[pressureLevel];
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: config.pulseSpeed / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: config.pulseSpeed / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isVisible, config.pulseSpeed]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowPulse.value, [0, 1], [0.6, 1]);
    return { opacity };
  });

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.indicator,
        { borderColor: config.color },
        animatedStyle,
      ]}
    >
      <Ionicons name={config.icon} size={10} color={config.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  label: {
    fontWeight: typography.weightBold,
    letterSpacing: 0.5,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
  indicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default LeaderPressure;

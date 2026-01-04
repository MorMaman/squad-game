/**
 * ParticipationInsurance.tsx
 * Small insurance icon indicator showing shield with checkmark
 * Displays next to player name when they have guaranteed minimum rewards
 * Tap to show tooltip explaining the participation insurance mechanic
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../../theme/gameColors';
import { StatusTooltip } from './StatusTooltip';

export interface ParticipationInsuranceProps {
  /** Whether player qualifies for insurance (participated in qualifying events) */
  isQualified: boolean;
  /** The minimum reward amount guaranteed */
  minimumReward: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the animated glow effect */
  showGlow?: boolean;
  /** Custom tooltip title */
  tooltipTitle?: string;
  /** Custom tooltip description */
  tooltipDescription?: string;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    container: 20,
    icon: 12,
    borderRadius: 10,
  },
  medium: {
    container: 26,
    icon: 16,
    borderRadius: 13,
  },
  large: {
    container: 32,
    icon: 20,
    borderRadius: 16,
  },
};

// Color for insurance indicator - lime green for positive/protective
const INSURANCE_COLOR = GAME_COLORS.energy.green;
const INSURANCE_COLOR_SECONDARY = '#10B981';

export function ParticipationInsurance({
  isQualified,
  minimumReward,
  size = 'small',
  showGlow = true,
  tooltipTitle = 'Participation Insurance',
  tooltipDescription,
}: ParticipationInsuranceProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];

  // Animation values
  const pulse = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Initialize pulse animation
  React.useEffect(() => {
    if (isQualified && showGlow) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isQualified, showGlow]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(pulse.value, [0, 1], [0.4, 0.8]);
    const glowRadius = interpolate(pulse.value, [0, 1], [4, 10]);

    return {
      transform: [{ scale: pressScale.value }],
      shadowOpacity: showGlow ? glowOpacity : 0.5,
      shadowRadius: showGlow ? glowRadius : 6,
    };
  });

  // Press handlers
  const handlePressIn = () => {
    pressScale.value = withSpring(0.9, GAME_SPRINGS.bouncy);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, GAME_SPRINGS.bouncy);
  };

  const handlePress = () => {
    setShowTooltip(true);
  };

  // Generate description if not provided
  const description = tooltipDescription ||
    `You're guaranteed a minimum of ${minimumReward} XP for participating. Keep showing up to maintain your insurance!`;

  // Platform-specific shadow
  const shadowStyle = Platform.select({
    web: {
      boxShadow: `0 0 8px ${INSURANCE_COLOR}`,
    } as any,
    default: {
      shadowColor: INSURANCE_COLOR,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
  });

  if (!isQualified) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Animated.View
          style={[
            styles.container,
            {
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.borderRadius,
            },
            shadowStyle,
            animatedContainerStyle,
          ]}
        >
          {/* Shield with checkmark icon */}
          <View style={styles.iconWrapper}>
            <Ionicons
              name="shield-checkmark"
              size={sizeConfig.icon}
              color={colors.textPrimary}
            />
          </View>
        </Animated.View>
      </Pressable>

      {/* Tooltip */}
      <StatusTooltip
        title={tooltipTitle}
        description={description}
        isVisible={showTooltip}
        onDismiss={() => setShowTooltip(false)}
        accentColor={INSURANCE_COLOR}
      />
    </>
  );
}

/**
 * Compact variant for use in lists/leaderboards
 * Shows just a tiny indicator with no label
 */
export interface InsuranceIndicatorProps {
  isQualified: boolean;
}

export function InsuranceIndicator({ isQualified }: InsuranceIndicatorProps) {
  if (!isQualified) return null;

  return (
    <View style={styles.indicator}>
      <Ionicons
        name="shield-checkmark"
        size={10}
        color={INSURANCE_COLOR}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: INSURANCE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: INSURANCE_COLOR_SECONDARY,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${INSURANCE_COLOR}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ParticipationInsurance;

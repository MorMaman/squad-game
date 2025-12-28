/**
 * useScreenShake - Screen shake effect hook for impactful moments
 * Use sparingly for: First place, breaking records, major level ups, big wins
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GameHaptics } from '../utils/haptics';

export type ShakeIntensity = 'light' | 'medium' | 'heavy';

interface UseScreenShakeReturn {
  shake: (intensity?: ShakeIntensity) => void;
  shakeStyle: ReturnType<typeof useAnimatedStyle>;
}

/**
 * Screen Shake Hook
 *
 * Creates a camera shake effect for impactful moments.
 * Combined with haptic feedback for maximum effect.
 *
 * @example
 * ```tsx
 * const { shake, shakeStyle } = useScreenShake();
 *
 * // In your component
 * <Animated.View style={shakeStyle}>
 *   <YourContent />
 * </Animated.View>
 *
 * // Trigger shake
 * const handleVictory = () => {
 *   shake('heavy');
 * };
 * ```
 */
export function useScreenShake(): UseScreenShakeReturn {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const shake = (intensity: ShakeIntensity = 'medium') => {
    // Magnitude based on intensity
    const magnitude = {
      light: 3,
      medium: 8,
      heavy: 15,
    }[intensity];

    // Duration based on intensity
    const duration = {
      light: 30,
      medium: 40,
      heavy: 50,
    }[intensity];

    // Horizontal shake sequence - gradually decreasing
    translateX.value = withSequence(
      withTiming(-magnitude, { duration }),
      withTiming(magnitude, { duration }),
      withTiming(-magnitude * 0.8, { duration }),
      withTiming(magnitude * 0.8, { duration }),
      withTiming(-magnitude * 0.5, { duration }),
      withTiming(magnitude * 0.5, { duration }),
      withTiming(-magnitude * 0.2, { duration }),
      withTiming(0, { duration })
    );

    // Vertical shake sequence - smaller amplitude
    translateY.value = withSequence(
      withTiming(-magnitude * 0.3, { duration }),
      withTiming(magnitude * 0.3, { duration }),
      withTiming(-magnitude * 0.2, { duration }),
      withTiming(magnitude * 0.2, { duration }),
      withTiming(-magnitude * 0.1, { duration }),
      withTiming(0, { duration })
    );

    // Trigger haptic feedback
    GameHaptics.screenShake(intensity);
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return { shake, shakeStyle };
}

export default useScreenShake;

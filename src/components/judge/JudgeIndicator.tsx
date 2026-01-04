/**
 * JudgeIndicator.tsx
 * Shows who is today's judge with gavel icon and animated glow effect
 * Uses Battle Game UI color scheme (LIME, CYAN, PURPLE)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../Avatar';
import { GAME_COLORS } from '../../theme/gameColors';

// Battle Game UI Colors
const JUDGE_COLORS = {
  LIME: '#A3E635',
  CYAN: '#00D4FF',
  PURPLE: '#9B59FF',
  DARK_BG: '#0A0E27',
  CARD_BG: '#16213E',
  GLOW_LIME: 'rgba(163, 230, 53, 0.6)',
  GLOW_CYAN: 'rgba(0, 212, 255, 0.6)',
  GLOW_PURPLE: 'rgba(155, 89, 255, 0.6)',
};

export interface JudgeIndicatorProps {
  /** User ID of the judge */
  userId: string;
  /** Display name of the judge */
  userName: string;
  /** Avatar URL of the judge */
  avatarUrl?: string | null;
  /** Whether the judge indicator should show active glow */
  isActive?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Callback when indicator is pressed */
  onPress?: () => void;
}

export function JudgeIndicator({
  userId,
  userName,
  avatarUrl,
  isActive = true,
  compact = false,
  onPress,
}: JudgeIndicatorProps) {
  // Animation values
  const glowPulse = useSharedValue(0);
  const gavelRotation = useSharedValue(0);
  const gavelScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Glow pulsing animation
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Gavel animation - subtle swing and bounce
      gavelRotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );

      gavelScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(1.15, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      glowPulse.value = withTiming(0, { duration: 300 });
      gavelRotation.value = withTiming(0, { duration: 300 });
      gavelScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  const glowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [10, 25]);
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.4, 0.8]);

    return {
      shadowColor: JUDGE_COLORS.LIME,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const gavelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${gavelRotation.value}deg` },
        { scale: gavelScale.value },
      ],
    };
  });

  const borderPulseStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(glowPulse.value, [0, 1], [0.5, 1]);
    return {
      opacity: borderOpacity,
    };
  });

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, isActive && glowStyle]}>
        <View style={styles.compactInner}>
          <Animated.View style={gavelStyle}>
            <MaterialCommunityIcons
              name="gavel"
              size={16}
              color={JUDGE_COLORS.LIME}
            />
          </Animated.View>
          <Avatar
            uri={avatarUrl}
            name={userName}
            size="small"
            style={styles.compactAvatar}
          />
          <Text style={styles.compactName} numberOfLines={1}>
            {userName}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, isActive && glowStyle]}>
      <LinearGradient
        colors={[JUDGE_COLORS.CARD_BG, '#1A1A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated border */}
        <Animated.View
          style={[
            styles.borderRing,
            { borderColor: JUDGE_COLORS.LIME },
            borderPulseStyle,
          ]}
        />

        {/* Header with gavel icon */}
        <View style={styles.header}>
          <Animated.View style={[styles.gavelContainer, gavelStyle]}>
            <MaterialCommunityIcons
              name="gavel"
              size={28}
              color={JUDGE_COLORS.LIME}
            />
          </Animated.View>
          <Text style={styles.labelText}>Judge Today</Text>
        </View>

        {/* Judge info */}
        <View style={styles.judgeInfo}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarGlow, isActive && styles.avatarGlowActive]} />
            <Avatar
              uri={avatarUrl}
              name={userName}
              size="large"
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
          <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {/* Web glow fallback */}
        {Platform.OS === 'web' && isActive && (
          <View style={[styles.webGlow, { backgroundColor: JUDGE_COLORS.LIME }]} />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  borderRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  gavelContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    color: JUDGE_COLORS.LIME,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  judgeInfo: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  avatarGlowActive: {
    backgroundColor: JUDGE_COLORS.GLOW_LIME,
    opacity: 0.3,
  },
  avatar: {
    borderWidth: 3,
    borderColor: JUDGE_COLORS.LIME,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 200,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  statusDotActive: {
    backgroundColor: JUDGE_COLORS.LIME,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusTextActive: {
    color: JUDGE_COLORS.LIME,
  },
  webGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.2,
    top: '50%',
    left: '50%',
    marginLeft: -75,
    marginTop: -75,
    zIndex: -1,
    ...(Platform.OS === 'web' && ({
      filter: 'blur(40px)',
    } as any)),
  },
  // Compact styles
  compactContainer: {
    borderRadius: 24,
    backgroundColor: JUDGE_COLORS.CARD_BG,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactAvatar: {
    borderWidth: 2,
    borderColor: JUDGE_COLORS.LIME,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 100,
  },
});

export default JudgeIndicator;

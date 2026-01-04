/**
 * ActivePowersBanner - Shows active powers when entering games/events
 * Displays which powers are currently active and will apply to the event
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { PowerType, POWER_INFO } from '../types/powers';

// Battle Game Colors
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  LIME: '#A3E635',
  CYAN: '#00D4FF',
  PURPLE: '#9B59FF',
  GOLD: '#FFD700',
  ORANGE: '#FF6B00',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_MUTED: '#6B7280',
};

// Power type to color mapping
const POWER_COLORS: Record<PowerType, string> = {
  double_chance: COLORS.CYAN,
  target_lock: COLORS.ORANGE,
  chaos_card: COLORS.PURPLE,
  streak_shield: COLORS.LIME,
};

// Power type to translation key mapping
const POWER_TRANSLATION_KEYS: Record<PowerType, string> = {
  double_chance: 'doubleChance',
  target_lock: 'targetLock',
  chaos_card: 'chaosCard',
  streak_shield: 'streakShield',
};

interface ActivePower {
  type: PowerType;
  expiresAt?: string;
  targetName?: string;
}

interface ActivePowersBannerProps {
  activePowers: ActivePower[];
  onPowerPress?: (power: ActivePower) => void;
  compact?: boolean;
}

function PowerPill({ power, onPress, index }: {
  power: ActivePower;
  onPress?: () => void;
  index: number;
}) {
  const { t } = useTranslation();
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const color = POWER_COLORS[power.type];
  const translationKey = POWER_TRANSLATION_KEYS[power.type];
  const powerInfo = POWER_INFO[power.type];

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.powerPillContainer}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.powerGlow,
            { backgroundColor: color },
            glowStyle
          ]}
        />

        <LinearGradient
          colors={[`${color}40`, `${color}20`]}
          style={styles.powerPill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons
            name={powerInfo.icon as any}
            size={18}
            color={color}
          />
          <Text style={[styles.powerName, { color }]}>
            {t(`powers.${translationKey}.name`)}
          </Text>
          {power.targetName && (
            <Text style={styles.targetName}>
              vs {power.targetName}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ActivePowersBanner({
  activePowers,
  onPowerPress,
  compact = false
}: ActivePowersBannerProps) {
  const { t } = useTranslation();

  if (activePowers.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={styles.compactContainer}
      >
        <View style={styles.compactBadge}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={14}
            color={COLORS.LIME}
          />
          <Text style={styles.compactText}>
            {t('powers.powersActive', { count: activePowers.length })}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={styles.container}
    >
      <LinearGradient
        colors={[`${COLORS.DEEP_PURPLE}F0`, `${COLORS.DARK_NAVY}F0`]}
        style={styles.banner}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color={COLORS.LIME}
          />
          <Text style={styles.title}>
            {t('eventPowers.activePowersTitle')}
          </Text>
        </View>

        {/* Power pills */}
        <View style={styles.powersRow}>
          {activePowers.map((power, index) => (
            <PowerPill
              key={`${power.type}-${index}`}
              power={power}
              index={index}
              onPress={() => onPowerPress?.(power)}
            />
          ))}
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          {t('eventPowers.activeForEvent')}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  banner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.LIME}30`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.LIME,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  powerPillContainer: {
    position: 'relative',
  },
  powerGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0.3,
  },
  powerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  powerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  targetName: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Compact styles
  compactContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.LIME}20`,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.LIME,
  },
});

export default ActivePowersBanner;

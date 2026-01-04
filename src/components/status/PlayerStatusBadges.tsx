/**
 * PlayerStatusBadges.tsx
 * Container component for all player status indicators
 * Combines insurance, comeback, and pressure badges in horizontal layout
 * Designed to sit next to player name/avatar
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { spacing } from '../../theme/colors';
import { GAME_SPRINGS } from '../../theme/gameColors';
import {
  ParticipationInsurance,
  InsuranceIndicator,
  type ParticipationInsuranceProps,
} from './ParticipationInsurance';
import {
  ComebackBoost,
  ComebackIndicator,
  type ComebackBoostProps,
} from './ComebackBoost';
import {
  LeaderPressure,
  PressureIndicator,
  type LeaderPressureProps,
  type PressureLevel,
} from './LeaderPressure';

// Status types for props
export interface InsuranceStatus {
  isQualified: boolean;
  minimumReward: number;
}

export interface ComebackStatus {
  isActive: boolean;
  bonusMultiplier: number;
  expiresAt: Date | number;
}

export interface PressureStatus {
  pressureLevel: PressureLevel;
  isVisible: boolean;
}

export interface PlayerStatusBadgesProps {
  /** Player ID for key uniqueness */
  playerId: string;
  /** Participation insurance status */
  insuranceStatus?: InsuranceStatus | null;
  /** Comeback boost status */
  comebackStatus?: ComebackStatus | null;
  /** Leader pressure status */
  pressureStatus?: PressureStatus | null;
  /** Size variant for all badges */
  size?: 'small' | 'medium' | 'large';
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Whether to use compact indicators */
  compact?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

export function PlayerStatusBadges({
  playerId,
  insuranceStatus,
  comebackStatus,
  pressureStatus,
  size = 'small',
  direction = 'row',
  compact = false,
  style,
}: PlayerStatusBadgesProps) {
  // Check if any status is active
  const hasInsurance = insuranceStatus?.isQualified ?? false;
  const hasComeback = comebackStatus?.isActive ?? false;
  const hasPressure = pressureStatus?.isVisible ?? false;

  // If nothing is active, render nothing
  if (!hasInsurance && !hasComeback && !hasPressure) {
    return null;
  }

  // Render compact indicators
  if (compact) {
    return (
      <View
        style={[
          styles.container,
          direction === 'column' && styles.containerColumn,
          styles.containerCompact,
          style,
        ]}
      >
        {hasInsurance && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={Layout.springify()}
          >
            <InsuranceIndicator isQualified={true} />
          </Animated.View>
        )}

        {hasComeback && comebackStatus && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={Layout.springify()}
          >
            <ComebackIndicator
              isActive={true}
              bonusMultiplier={comebackStatus.bonusMultiplier}
            />
          </Animated.View>
        )}

        {hasPressure && pressureStatus && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={Layout.springify()}
          >
            <PressureIndicator
              pressureLevel={pressureStatus.pressureLevel}
              isVisible={true}
            />
          </Animated.View>
        )}
      </View>
    );
  }

  // Render full badges
  return (
    <View
      style={[
        styles.container,
        direction === 'column' && styles.containerColumn,
        style,
      ]}
    >
      {hasInsurance && insuranceStatus && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
        >
          <ParticipationInsurance
            isQualified={insuranceStatus.isQualified}
            minimumReward={insuranceStatus.minimumReward}
            size={size}
          />
        </Animated.View>
      )}

      {hasComeback && comebackStatus && (
        <Animated.View
          entering={FadeIn.duration(200).delay(50)}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
        >
          <ComebackBoost
            isActive={comebackStatus.isActive}
            bonusMultiplier={comebackStatus.bonusMultiplier}
            expiresAt={comebackStatus.expiresAt}
            size={size}
            showLabel={size !== 'small'}
          />
        </Animated.View>
      )}

      {hasPressure && pressureStatus && (
        <Animated.View
          entering={FadeIn.duration(200).delay(100)}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
        >
          <LeaderPressure
            pressureLevel={pressureStatus.pressureLevel}
            isVisible={pressureStatus.isVisible}
            size={size}
            showLabel={size !== 'small'}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Inline variant for use directly next to player names
 * More condensed with minimal spacing
 */
export interface InlineStatusBadgesProps {
  playerId: string;
  insuranceStatus?: InsuranceStatus | null;
  comebackStatus?: ComebackStatus | null;
  pressureStatus?: PressureStatus | null;
}

export function InlineStatusBadges({
  playerId,
  insuranceStatus,
  comebackStatus,
  pressureStatus,
}: InlineStatusBadgesProps) {
  return (
    <PlayerStatusBadges
      playerId={playerId}
      insuranceStatus={insuranceStatus}
      comebackStatus={comebackStatus}
      pressureStatus={pressureStatus}
      size="small"
      compact
      style={styles.inlineContainer}
    />
  );
}

/**
 * Helper hook to combine status data from various sources
 */
export function usePlayerStatusData(player: {
  id: string;
  hasInsurance?: boolean;
  minimumReward?: number;
  hasComebackBoost?: boolean;
  comebackMultiplier?: number;
  comebackExpiresAt?: Date | number;
  isLeader?: boolean;
  pressureLevel?: PressureLevel;
}): {
  insuranceStatus: InsuranceStatus | null;
  comebackStatus: ComebackStatus | null;
  pressureStatus: PressureStatus | null;
} {
  const insuranceStatus: InsuranceStatus | null = player.hasInsurance
    ? {
        isQualified: true,
        minimumReward: player.minimumReward ?? 10,
      }
    : null;

  const comebackStatus: ComebackStatus | null = player.hasComebackBoost
    ? {
        isActive: true,
        bonusMultiplier: player.comebackMultiplier ?? 1.5,
        expiresAt: player.comebackExpiresAt ?? Date.now() + 24 * 60 * 60 * 1000,
      }
    : null;

  const pressureStatus: PressureStatus | null = player.isLeader && player.pressureLevel
    ? {
        pressureLevel: player.pressureLevel,
        isVisible: true,
      }
    : null;

  return {
    insuranceStatus,
    comebackStatus,
    pressureStatus,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  containerColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  containerCompact: {
    gap: spacing.xs,
  },
  inlineContainer: {
    gap: 4,
    marginLeft: spacing.xs,
  },
});

export default PlayerStatusBadges;

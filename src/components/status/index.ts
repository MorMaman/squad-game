/**
 * Player Status Indicators
 * Components for displaying player status badges including:
 * - Participation Insurance (guaranteed minimum rewards)
 * - Comeback Boost (XP bonus after poor performance)
 * - Leader Pressure (anti-runaway leader indicator)
 * - Reusable tooltip for explanations
 */

// Tooltip component
export { StatusTooltip, InlineTooltip } from './StatusTooltip';
export type { StatusTooltipProps, InlineTooltipProps } from './StatusTooltip';

// Participation Insurance
export {
  ParticipationInsurance,
  InsuranceIndicator,
} from './ParticipationInsurance';
export type { ParticipationInsuranceProps } from './ParticipationInsurance';

// Comeback Boost
export {
  ComebackBoost,
  ComebackIndicator,
} from './ComebackBoost';
export type { ComebackBoostProps } from './ComebackBoost';

// Leader Pressure
export {
  LeaderPressure,
  PressureIndicator,
} from './LeaderPressure';
export type { LeaderPressureProps, PressureLevel } from './LeaderPressure';

// Combined container
export {
  PlayerStatusBadges,
  InlineStatusBadges,
  usePlayerStatusData,
} from './PlayerStatusBadges';
export type {
  PlayerStatusBadgesProps,
  InsuranceStatus,
  ComebackStatus,
  PressureStatus,
} from './PlayerStatusBadges';

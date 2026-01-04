/**
 * Judge Components
 * Export all judge-related components for the Judge Role system
 */

// Judge Indicator - Shows who is today's judge
export { JudgeIndicator } from './JudgeIndicator';
export type { JudgeIndicatorProps } from './JudgeIndicator';

// Judge Bonus/Penalty - Shows bonus/penalty status
export {
  JudgeBonusPenalty,
  JudgeBonusBadge,
  OverturnedMarker,
} from './JudgeBonusPenalty';
export type {
  JudgeBonusPenaltyProps,
  JudgeBonusBadgeProps,
} from './JudgeBonusPenalty';

// Challenge Vote Button - Individual vote button
export {
  ChallengeVoteButton,
  ChallengeVoteButtons,
} from './ChallengeVoteButton';
export type {
  ChallengeVoteButtonProps,
  ChallengeVoteButtonsProps,
} from './ChallengeVoteButton';

// Challenge Window - Active challenge display
export { ChallengeWindow } from './ChallengeWindow';
export type {
  ChallengeWindowProps,
  ChallengeData,
} from './ChallengeWindow';

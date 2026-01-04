/**
 * Judge System Types
 * Daily judge role with bonuses, penalties, and challenges
 */

export interface SquadJudge {
  id: string;
  squad_id: string;
  user_id: string;
  judge_date: string; // ISO date
  created_at: string;
  bonus_earned: number | null;
  penalty_applied: number | null;
  is_overturned: boolean;

  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Challenge {
  id: string;
  squad_id: string;
  challenger_id: string;
  target_id: string; // judge user_id or power_activation_id
  challenge_type: 'judge_decision' | 'power_activation';
  related_power_id: string | null;
  related_event_id: string | null;
  votes_for: number;
  votes_against: number;
  votes_needed: number;
  started_at: string;
  expires_at: string;
  status: 'active' | 'passed' | 'failed' | 'expired';
  result_applied: boolean;

  // Joined data
  challenger?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  target_user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface ChallengeVote {
  id: string;
  challenge_id: string;
  user_id: string;
  vote: 'for' | 'against';
  voted_at: string;
}

export interface PowerActivation {
  id: string;
  squad_id: string;
  power_type: PowerType;
  activated_by: string;
  affected_users: string[];
  activated_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  was_challenged: boolean;
  challenge_result: 'passed' | 'failed' | null;

  // Joined data
  activator?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// Power types available in the game
export type PowerType =
  | 'crown_steal'
  | 'score_boost'
  | 'score_penalty'
  | 'immunity_shield'
  | 'double_xp'
  | 'revenge_card'
  | 'skip_card'
  | 'time_extend'
  | 'peek_answers'
  | 'underdog_boost'
  | 'leader_pressure';

// Power metadata for UI display
export interface PowerInfo {
  type: PowerType;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  iconLibrary: 'material' | 'ionicons' | 'fontawesome';
  color: string;
  category: 'attack' | 'defense' | 'social' | 'special';
  duration: string; // e.g., "1 event", "24 hours", "instant"
  activationConditions: string[];
  canBeChallenged: boolean;
  cooldown: string; // e.g., "1 day", "3 events"
}

// Power configuration
export const POWER_INFO: Record<PowerType, PowerInfo> = {
  crown_steal: {
    type: 'crown_steal',
    nameKey: 'powers.crownSteal.name',
    descriptionKey: 'powers.crownSteal.description',
    icon: 'crown',
    iconLibrary: 'material',
    color: '#FFD700',
    category: 'attack',
    duration: 'instant',
    activationConditions: ['Must be in top 3', 'Target must be crown holder'],
    canBeChallenged: true,
    cooldown: '3 events',
  },
  score_boost: {
    type: 'score_boost',
    nameKey: 'powers.scoreBoost.name',
    descriptionKey: 'powers.scoreBoost.description',
    icon: 'trending-up',
    iconLibrary: 'ionicons',
    color: '#A3E635',
    category: 'defense',
    duration: '1 event',
    activationConditions: ['Earned through participation'],
    canBeChallenged: false,
    cooldown: '1 day',
  },
  score_penalty: {
    type: 'score_penalty',
    nameKey: 'powers.scorePenalty.name',
    descriptionKey: 'powers.scorePenalty.description',
    icon: 'trending-down',
    iconLibrary: 'ionicons',
    color: '#EF4444',
    category: 'attack',
    duration: '1 event',
    activationConditions: ['Judge only', 'Must have valid reason'],
    canBeChallenged: true,
    cooldown: '1 day',
  },
  immunity_shield: {
    type: 'immunity_shield',
    nameKey: 'powers.immunityShield.name',
    descriptionKey: 'powers.immunityShield.description',
    icon: 'shield-checkmark',
    iconLibrary: 'ionicons',
    color: '#00D4FF',
    category: 'defense',
    duration: '1 event',
    activationConditions: ['Earned through streak'],
    canBeChallenged: false,
    cooldown: '7 days',
  },
  double_xp: {
    type: 'double_xp',
    nameKey: 'powers.doubleXp.name',
    descriptionKey: 'powers.doubleXp.description',
    icon: 'star',
    iconLibrary: 'ionicons',
    color: '#9B59FF',
    category: 'special',
    duration: '1 event',
    activationConditions: ['Available to all'],
    canBeChallenged: false,
    cooldown: '3 days',
  },
  revenge_card: {
    type: 'revenge_card',
    nameKey: 'powers.revengeCard.name',
    descriptionKey: 'powers.revengeCard.description',
    icon: 'sword-cross',
    iconLibrary: 'material',
    color: '#FF6B00',
    category: 'attack',
    duration: '1 event',
    activationConditions: ['Must have been targeted recently'],
    canBeChallenged: true,
    cooldown: '1 event',
  },
  skip_card: {
    type: 'skip_card',
    nameKey: 'powers.skipCard.name',
    descriptionKey: 'powers.skipCard.description',
    icon: 'skip-forward',
    iconLibrary: 'ionicons',
    color: '#6B7280',
    category: 'defense',
    duration: 'instant',
    activationConditions: ['Limited uses per week'],
    canBeChallenged: false,
    cooldown: '0',
  },
  time_extend: {
    type: 'time_extend',
    nameKey: 'powers.timeExtend.name',
    descriptionKey: 'powers.timeExtend.description',
    icon: 'timer',
    iconLibrary: 'ionicons',
    color: '#00D4FF',
    category: 'defense',
    duration: 'instant',
    activationConditions: ['During active event only'],
    canBeChallenged: false,
    cooldown: '1 event',
  },
  peek_answers: {
    type: 'peek_answers',
    nameKey: 'powers.peekAnswers.name',
    descriptionKey: 'powers.peekAnswers.description',
    icon: 'eye',
    iconLibrary: 'ionicons',
    color: '#9B59FF',
    category: 'special',
    duration: 'instant',
    activationConditions: ['Rare drop from rewards'],
    canBeChallenged: false,
    cooldown: '7 days',
  },
  underdog_boost: {
    type: 'underdog_boost',
    nameKey: 'powers.underdogBoost.name',
    descriptionKey: 'powers.underdogBoost.description',
    icon: 'rocket',
    iconLibrary: 'ionicons',
    color: '#FF69B4',
    category: 'special',
    duration: '1 event',
    activationConditions: ['Auto-applied to bottom 3'],
    canBeChallenged: false,
    cooldown: '0',
  },
  leader_pressure: {
    type: 'leader_pressure',
    nameKey: 'powers.leaderPressure.name',
    descriptionKey: 'powers.leaderPressure.description',
    icon: 'speedometer',
    iconLibrary: 'ionicons',
    color: '#EF4444',
    category: 'special',
    duration: 'Until overtaken',
    activationConditions: ['Auto-applied to runaway leader'],
    canBeChallenged: false,
    cooldown: '0',
  },
};

// Core principles - embedded in code and UI
export const CORE_PRINCIPLES = [
  { key: 'temporary', icon: 'timer-sand', text: 'Powers are temporary' },
  { key: 'visible', icon: 'eye', text: 'Powers are visible' },
  { key: 'earned', icon: 'trophy', text: 'Powers are earned by participation' },
  { key: 'absence', icon: 'account-cancel', text: 'Absence gives nothing' },
  { key: 'influence', icon: 'hand-peace', text: 'Influence is always stronger than punishment' },
];

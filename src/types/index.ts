// Event types
export type EventType = 'LIVE_SELFIE' | 'PRESSURE_TAP' | 'POLL';
export type EventStatus = 'scheduled' | 'open' | 'closed' | 'finalized';
export type MemberRole = 'member' | 'admin';

// Avatar icon types for player cards
export type AvatarIcon =
  | 'flame'
  | 'glasses'
  | 'flash'
  | 'trophy'
  | 'hardware-chip'
  | 'sparkles'
  | 'skull'
  | 'planet';

// Streak tier types
export type StreakTier = 'warm' | 'hot' | 'fire' | 'legendary';

// Rank change indicator
export type RankChange = 'up' | 'down' | 'same' | 'new';

// Database types
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_icon: AvatarIcon | null;
  expo_push_token: string | null;
  xp: number;
  level: number;
  created_at: string;
}

export interface Squad {
  id: string;
  name: string;
  invite_code: string;
  timezone: string;
  created_at: string;
}

export interface SquadMember {
  squad_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  // Joined data
  profile?: Profile;
}

export interface DailyEvent {
  id: string;
  squad_id: string;
  date: string;
  event_type: EventType;
  opens_at: string;
  closes_at: string;
  judge_id: string | null;
  status: EventStatus;
  poll_question?: string;
  poll_options?: string[];
  created_at: string;
}

export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  active: boolean;
}

export interface EventSubmission {
  id: string;
  event_id: string;
  user_id: string;
  type: EventType;
  payload: Record<string, unknown>;
  media_path: string | null;
  submitted_at: string;
  score: number | null;
  rank: number | null;
  created_at: string;
  // Joined data
  profile?: Profile;
}

export interface EventOutcome {
  id: string;
  event_id: string;
  finalized_by: string;
  payload: Record<string, unknown>;
  finalized_at: string;
  overturned: boolean;
}

export interface OutcomeChallenge {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  squad_id: string;
  points_weekly: number;
  points_lifetime: number;
  streak_count: number;
  streak_best: number; // Best streak ever achieved (historical record)
  strikes_14d: number;
  xp_total: number; // Total XP earned in this squad
  level: number; // Current level calculated from XP
  last_participation_date?: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
}

// Gamification types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'participation' | 'streak' | 'performance' | 'social' | 'event';
  earnedAt?: string;
  requirement?: string;
}

export interface XPReward {
  action: string;
  amount: number;
  description: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  progress: number; // 0-1 progress to next level
}

export interface CelebrationEvent {
  type: 'win' | 'levelUp' | 'badge' | 'streak';
  title: string;
  subtitle?: string;
  xpEarned?: number;
  badge?: Badge;
  newLevel?: number;
  streakDays?: number;
}

// App-specific types
export interface TodayEventState {
  event: DailyEvent | null;
  status: 'loading' | 'not_opened' | 'open' | 'closed' | 'submitted';
  timeUntilOpen?: number;
  timeUntilClose?: number;
  submissionCount?: number;
  mySubmission?: EventSubmission;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_icon?: AvatarIcon | null;
  points: number;
  streak: number;
  strikes: number;
  level?: number;
  xp?: number;
  rankChange?: RankChange;
}

export interface PlayerCardData {
  avatar?: string | null;
  avatarIcon?: AvatarIcon | null;
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPoints: number;
  badges: Badge[];
  streakDays: number;
  streakBest?: number;
  rank?: number;
  rankChange?: RankChange;
}

export interface PressureTapResult {
  target_time: number;
  tap_time: number;
  error_ms: number;
}

export interface LiveSelfiePayload {
  captured_at: string;
  countdown_used: boolean;
  micro_poll_answer?: string;
  device_info?: string;
}

// XP reward configuration
export const XP_REWARDS: Record<string, XPReward> = {
  COMPLETE_EVENT: { action: 'complete_event', amount: 25, description: 'Complete any event' },
  WIN_FIRST: { action: 'win_first', amount: 100, description: 'Win first place' },
  PLACE_TOP_3: { action: 'place_top_3', amount: 50, description: 'Place in top 3' },
  CORRECT_POLL: { action: 'correct_poll', amount: 30, description: 'Correct poll prediction' },
  DAILY_LOGIN: { action: 'daily_login', amount: 10, description: 'Daily login' },
  STREAK_7: { action: 'streak_7', amount: 50, description: '7-day streak bonus' },
  STREAK_30: { action: 'streak_30', amount: 200, description: '30-day streak bonus' },
  INVITE_FRIEND: { action: 'invite_friend', amount: 100, description: 'Invite friend who joins' },
  EARN_BADGE: { action: 'earn_badge', amount: 25, description: 'Earn a new badge' },
};

// Re-export power types
export * from './powers';

// Re-export crown types
export * from './crown';

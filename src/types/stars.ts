/**
 * Stars Currency Types
 * Defines types for the stars currency system
 */

export interface StarTransaction {
  id: string;
  user_id: string;
  squad_id: string | null;
  amount: number;
  balance_after: number;
  transaction_type: StarTransactionType;
  source: StarSource;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type StarTransactionType = 'earn' | 'spend' | 'bonus' | 'refund';

export type StarSource =
  | 'event_participation'
  | 'event_first_place'
  | 'event_top_3'
  | 'mini_game_high_score'
  | 'mini_game_completion'
  | 'daily_login'
  | 'streak_7_day'
  | 'streak_30_day'
  | 'streak_100_day'
  | 'shop_purchase'
  | 'reward_slot'
  | 'admin_grant'
  | 'referral_bonus';

/**
 * Star earning configuration
 * Defines how many stars are earned for each activity
 */
export const STAR_REWARDS = {
  // Event rewards
  EVENT_PARTICIPATION: 50,
  EVENT_FIRST_PLACE: 100,
  EVENT_TOP_3: 50,
  EVENT_FAST_SUBMISSION: 25, // Bonus for quick submission

  // Mini-game rewards
  MINI_GAME_COMPLETION: 10,
  MINI_GAME_HIGH_SCORE: 25,
  MINI_GAME_PERFECT: 50, // Perfect score

  // Daily login rewards (streak-based)
  DAILY_LOGIN_BASE: 10,
  DAILY_LOGIN_DAY_2: 15,
  DAILY_LOGIN_DAY_3: 20,
  DAILY_LOGIN_DAY_4: 25,
  DAILY_LOGIN_DAY_5: 35,
  DAILY_LOGIN_DAY_6: 40,
  DAILY_LOGIN_DAY_7: 50, // Weekly bonus

  // Streak bonuses
  STREAK_7_DAY: 100,
  STREAK_30_DAY: 500,
  STREAK_100_DAY: 2000,

  // Social rewards
  REFERRAL_BONUS: 200,
  INVITED_FRIEND_JOINED: 100,
} as const;

/**
 * Get daily login reward based on consecutive days
 * Resets after 7 days
 */
export function getDailyLoginReward(consecutiveDays: number): number {
  const day = ((consecutiveDays - 1) % 7) + 1;
  switch (day) {
    case 1: return STAR_REWARDS.DAILY_LOGIN_BASE;
    case 2: return STAR_REWARDS.DAILY_LOGIN_DAY_2;
    case 3: return STAR_REWARDS.DAILY_LOGIN_DAY_3;
    case 4: return STAR_REWARDS.DAILY_LOGIN_DAY_4;
    case 5: return STAR_REWARDS.DAILY_LOGIN_DAY_5;
    case 6: return STAR_REWARDS.DAILY_LOGIN_DAY_6;
    case 7: return STAR_REWARDS.DAILY_LOGIN_DAY_7;
    default: return STAR_REWARDS.DAILY_LOGIN_BASE;
  }
}

/**
 * Format star amount with proper formatting
 */
export function formatStars(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

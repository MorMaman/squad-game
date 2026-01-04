/**
 * Reward Slots Types
 * Defines types for the chest-like reward slot system
 */

export type RewardSlotState =
  | 'empty'      // No reward
  | 'filling'    // Progress being made
  | 'ready'      // Ready to claim (timer finished or instant)
  | 'unlocking'  // Timer countdown active
  | 'claimed';   // Already claimed

export type RewardType = 'stars' | 'wild_card' | 'xp' | 'item';

export type SlotRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RewardSlot {
  id: string;
  user_id: string;
  slot_index: number;
  state: RewardSlotState;
  progress: number;
  reward_type: RewardType | null;
  reward_amount: number | null;
  reward_item_id: string | null;
  reward_card_type: string | null;
  rarity: SlotRarity;
  unlocks_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimRewardResult {
  success: boolean;
  reward_type: RewardType | null;
  reward_amount: number | null;
  reward_card_type: string | null;
  rarity: SlotRarity | null;
  error_message: string | null;
}

/**
 * Slot visual configuration by rarity
 */
export const SLOT_RARITY_CONFIG: Record<SlotRarity, {
  nameKey: string;
  color: string;
  gradient: [string, string];
  glowColor: string;
  unlockTime: number; // in milliseconds
}> = {
  common: {
    nameKey: 'rewards.rarity.common',
    color: '#9CA3AF',
    gradient: ['#6B7280', '#4B5563'],
    glowColor: 'rgba(156, 163, 175, 0.5)',
    unlockTime: 2 * 60 * 60 * 1000, // 2 hours
  },
  rare: {
    nameKey: 'rewards.rarity.rare',
    color: '#3B82F6',
    gradient: ['#2563EB', '#1D4ED8'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    unlockTime: 4 * 60 * 60 * 1000, // 4 hours
  },
  epic: {
    nameKey: 'rewards.rarity.epic',
    color: '#A855F7',
    gradient: ['#9333EA', '#7C3AED'],
    glowColor: 'rgba(168, 85, 247, 0.5)',
    unlockTime: 8 * 60 * 60 * 1000, // 8 hours
  },
  legendary: {
    nameKey: 'rewards.rarity.legendary',
    color: '#F59E0B',
    gradient: ['#D97706', '#B45309'],
    glowColor: 'rgba(245, 158, 11, 0.5)',
    unlockTime: 12 * 60 * 60 * 1000, // 12 hours
  },
};

/**
 * Get unlock time remaining for a slot
 */
export function getUnlockTimeRemaining(slot: RewardSlot): number {
  if (slot.state !== 'unlocking' || !slot.unlocks_at) {
    return 0;
  }

  const unlockTime = new Date(slot.unlocks_at).getTime();
  const now = Date.now();

  return Math.max(0, unlockTime - now);
}

/**
 * Check if a slot is ready to claim
 */
export function isSlotReadyToClaim(slot: RewardSlot): boolean {
  if (slot.state === 'ready') return true;

  if (slot.state === 'unlocking') {
    return getUnlockTimeRemaining(slot) === 0;
  }

  return false;
}

/**
 * Format unlock time remaining
 */
export function formatUnlockTime(milliseconds: number): string {
  if (milliseconds <= 0) return '0:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get reward icon based on type
 */
export function getRewardIcon(type: RewardType): string {
  switch (type) {
    case 'stars': return 'star';
    case 'wild_card': return 'card';
    case 'xp': return 'flash';
    case 'item': return 'gift';
    default: return 'help-circle';
  }
}

/**
 * Progress needed to fill a slot (activity points)
 */
export const SLOT_FILL_REQUIREMENTS = {
  ACTIVITY_POINTS_PER_SLOT: 100,
  EVENT_PARTICIPATION: 30,
  EVENT_WIN: 50,
  MINI_GAME_PLAY: 10,
  MINI_GAME_HIGH_SCORE: 20,
  DAILY_LOGIN: 15,
} as const;

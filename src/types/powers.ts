// Underdog Power System Types

export type PowerType = 'double_chance' | 'target_lock' | 'chaos_card' | 'streak_shield';

export type PowerCategory = 'attack' | 'defense' | 'social' | 'special';

export interface UserPower {
  id: string;
  user_id: string;
  squad_id: string;
  power_type: PowerType;
  granted_at: string;
  expires_at: string;
  used_at: string | null;
  metadata: {
    target_user_id?: string;
    rule?: string;
  } | null;
}

export interface ActiveTarget {
  id: string;
  targeter_id: string;
  target_id: string;
  squad_id: string;
  expires_at: string;
}

export interface PowerDefinition {
  id: PowerType;
  name: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  category: PowerCategory;
  activationConditions: string[];
  duration: string;
  limits: string;
  howToCancel: string;
  expirationRules: string;
  whoCanActivate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
}

export interface PowerHistoryEntry {
  id: string;
  power_type: PowerType;
  event_id: string;
  event_name: string;
  activated_by: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  affected_users: Array<{
    id: string;
    display_name: string;
    avatar_url?: string;
  }>;
  activated_at: string;
  expired_at: string;
  duration_minutes: number;
  outcome?: string;
}

// Comprehensive power definitions for the rulebook
export const POWER_DEFINITIONS: Record<PowerType, PowerDefinition> = {
  double_chance: {
    id: 'double_chance',
    name: 'Double Chance',
    shortDescription: 'Get two attempts in the next event.',
    fullDescription: 'When activated, you receive two attempts at the next event instead of one. Only your best result is counted toward the final score. This power is perfect for high-stakes moments when you need insurance against a bad attempt.',
    icon: 'content-copy',
    category: 'defense',
    activationConditions: [
      'Must be activated before an event starts',
      'Cannot be used on already-completed events',
      'Must have earned the power through participation'
    ],
    duration: 'Single use - expires after one event',
    limits: 'One Double Chance per event per player',
    howToCancel: 'Cannot be cancelled once an event begins. Before event starts, tap the power badge to deactivate.',
    expirationRules: 'Expires 24 hours after being granted if not used. Also expires if no events occur within that window.',
    whoCanActivate: 'Any player who finished in bottom 3 of the previous week',
    rarity: 'common',
    unlockCondition: 'Finish in bottom 3 of weekly leaderboard'
  },
  target_lock: {
    id: 'target_lock',
    name: 'Target Lock',
    shortDescription: 'Mark one player as your target.',
    fullDescription: 'Choose one player to "lock on" to. That player will see a visible indicator that they are being targeted. If you beat their score in the next event, you steal bonus XP from them. Creates psychological pressure and rivalry dynamics.',
    icon: 'target',
    category: 'attack',
    activationConditions: [
      'Must select a target before the event starts',
      'Target must be in the same squad',
      'Cannot target yourself or the same person twice in a row'
    ],
    duration: 'Lasts for one event cycle',
    limits: 'Can only target one player at a time. Once locked, cannot change target until event ends.',
    howToCancel: 'Target can be changed before event starts. Once event begins, target is locked.',
    expirationRules: 'Expires when the event ends. If you beat your target, you gain +50 bonus XP. If they beat you, they gain +25 XP.',
    whoCanActivate: 'Any player with at least 3 consecutive daily participations',
    rarity: 'rare',
    unlockCondition: 'Participate in 3 consecutive days'
  },
  chaos_card: {
    id: 'chaos_card',
    name: 'Chaos Card',
    shortDescription: 'Activate a surprise rule modifier.',
    fullDescription: 'Draw a random rule modifier that affects the next event for ALL players in your squad. Chaos cards can flip the game on its head - reversing scores, adding time pressure, or changing win conditions. High risk, high reward.',
    icon: 'shuffle-variant',
    category: 'special',
    activationConditions: [
      'Must be activated during event countdown (10 minutes before)',
      'Requires confirmation from at least 2 squad members',
      'Cannot be stacked with other Chaos Cards'
    ],
    duration: 'Affects entire event duration',
    limits: 'Only one Chaos Card can be active per event. Squad vote required.',
    howToCancel: 'Can be challenged by 3+ squad members within 2 minutes of activation. If challenged, a vote occurs.',
    expirationRules: 'Effect ends when event concludes. Some chaos effects may persist into results phase.',
    whoCanActivate: 'Crown holder or player with longest active streak',
    rarity: 'epic',
    unlockCondition: 'Hold the crown OR maintain 7+ day streak'
  },
  streak_shield: {
    id: 'streak_shield',
    name: 'Streak Shield',
    shortDescription: 'Protect your streak if you miss an event.',
    fullDescription: 'Life happens. The Streak Shield automatically activates to save your participation streak if you miss an event. Your streak counter stays intact, but you receive no points for that event. Use wisely - shields are earned, not given.',
    icon: 'shield-check',
    category: 'defense',
    activationConditions: [
      'Automatically activates when you miss an event',
      'Must have an active streak of 5+ days',
      'Cannot be manually activated'
    ],
    duration: 'Instant - protects one missed event',
    limits: 'Maximum one shield per week. Cannot stack multiple shields.',
    howToCancel: 'Cannot be cancelled. Once triggered, it is consumed.',
    expirationRules: 'Shield expires unused after 7 days. If not needed within that window, you lose it.',
    whoCanActivate: 'Automatically granted at 5-day streak milestone',
    rarity: 'legendary',
    unlockCondition: 'Reach a 5-day participation streak'
  }
};

// Simplified power info for backwards compatibility
export const POWER_INFO: Record<PowerType, { name: string; description: string; icon: string }> = {
  double_chance: {
    name: 'Double Chance',
    description: 'Get two attempts in the next event. Only your best result counts!',
    icon: 'copy-outline',
  },
  target_lock: {
    name: 'Target Lock',
    description: "Mark one player as your target. They'll know they're being hunted!",
    icon: 'locate-outline',
  },
  chaos_card: {
    name: 'Chaos Card',
    description: 'Activate a surprise rule modifier for the next event!',
    icon: 'shuffle-outline',
  },
  streak_shield: {
    name: 'Streak Shield',
    description: 'Protect your streak once if you miss an event.',
    icon: 'shield-outline',
  },
};

// Category metadata for filtering and display
export const POWER_CATEGORIES: Record<PowerCategory, { name: string; description: string; color: string; icon: string }> = {
  attack: {
    name: 'Attack',
    description: 'Powers that target or affect other players',
    color: '#FF4757',
    icon: 'sword-cross'
  },
  defense: {
    name: 'Defense',
    description: 'Powers that protect you or improve your chances',
    color: '#00D4FF',
    icon: 'shield'
  },
  social: {
    name: 'Social',
    description: 'Powers that affect group dynamics',
    color: '#9B59FF',
    icon: 'account-group'
  },
  special: {
    name: 'Special',
    description: 'Unique powers with squad-wide effects',
    color: '#FFD700',
    icon: 'star-four-points'
  }
};

// Core rulebook principles
export const CORE_RULES = [
  {
    id: 'temporary',
    title: 'Powers are Temporary',
    description: 'No power lasts forever. Every power has a clear duration and expiration. Earn them, use them, or lose them.',
    icon: 'clock-outline'
  },
  {
    id: 'visible',
    title: 'Powers are Visible',
    description: 'There are no secret powers. When you activate a power, your squad sees it. When you are targeted, you know it. Transparency creates fair play.',
    icon: 'eye-outline'
  },
  {
    id: 'earned',
    title: 'Powers are Earned by Participation',
    description: 'Show up consistently and you unlock powers. Miss events and you miss out. The game rewards engagement, not lurking.',
    icon: 'trophy-outline'
  },
  {
    id: 'absence',
    title: 'Absence Gives Nothing',
    description: 'You cannot earn powers or protect your position by sitting out. Inactivity slowly erases your standing.',
    icon: 'walk'
  },
  {
    id: 'influence',
    title: 'Influence is Always Stronger Than Punishment',
    description: 'Powers that help you succeed will always outweigh powers that hurt others. Positive play is rewarded more than negative play.',
    icon: 'heart-outline'
  }
];

// Helper function to get powers by category
export function getPowersByCategory(category: PowerCategory): PowerDefinition[] {
  return Object.values(POWER_DEFINITIONS).filter(power => power.category === category);
}

// Helper function to get all power categories with their powers
export function getAllPowersGroupedByCategory(): Map<PowerCategory, PowerDefinition[]> {
  const grouped = new Map<PowerCategory, PowerDefinition[]>();
  const categories: PowerCategory[] = ['attack', 'defense', 'social', 'special'];

  categories.forEach(category => {
    grouped.set(category, getPowersByCategory(category));
  });

  return grouped;
}

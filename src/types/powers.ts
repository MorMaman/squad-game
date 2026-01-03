// Underdog Power System Types

export type PowerType = 'double_chance' | 'target_lock' | 'chaos_card' | 'streak_shield';

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

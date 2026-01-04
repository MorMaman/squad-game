/**
 * Player Status Types
 * Insurance, Comeback, and Leader Pressure indicators
 */

export interface ParticipationInsurance {
  id: string;
  user_id: string;
  squad_id: string;
  event_id: string;
  qualified: boolean;
  minimum_reward: number;
}

export interface ComebackStatus {
  id: string;
  user_id: string;
  squad_id: string;
  triggered_at: string;
  expires_at: string;
  bonus_multiplier: number; // e.g., 1.5 for 50% bonus
  is_active: boolean;
}

export interface LeaderPressureStatus {
  id: string;
  squad_id: string;
  user_id: string; // Current leader
  activated_at: string;
  pressure_level: PressureLevel;
}

export type PressureLevel = 'low' | 'medium' | 'high';

// UI configuration for pressure levels
export const PRESSURE_LEVEL_CONFIG: Record<PressureLevel, {
  color: string;
  icon: string;
  label: string;
  description: string;
}> = {
  low: {
    color: '#FFD700', // Gold
    icon: 'speedometer-medium',
    label: 'Mild Pressure',
    description: 'Slight score adjustment for balance',
  },
  medium: {
    color: '#FF6B00', // Orange
    icon: 'speedometer',
    label: 'High Pressure',
    description: 'Moderate score adjustment active',
  },
  high: {
    color: '#EF4444', // Red
    icon: 'speedometer-slow',
    label: 'Max Pressure',
    description: 'Significant score adjustment to prevent runaway',
  },
};

// Combined player status for UI
export interface PlayerStatus {
  userId: string;
  insurance: ParticipationInsurance | null;
  comeback: ComebackStatus | null;
  pressure: LeaderPressureStatus | null;
}

// Comeback boost configuration
export const COMEBACK_CONFIG = {
  duration_hours: 24,
  bonus_multiplier: 1.5, // 50% bonus XP
  trigger_threshold: 0.3, // Bottom 30% of squad
  min_events_for_trigger: 3, // Must have participated in 3+ events
};

// Insurance configuration
export const INSURANCE_CONFIG = {
  min_participation_rate: 0.8, // 80% participation rate
  minimum_reward_percentage: 0.25, // 25% of average reward
};

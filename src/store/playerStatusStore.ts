/**
 * Player Status Store
 * Manages insurance, comeback boost, and leader pressure indicators
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  ParticipationInsurance,
  ComebackStatus,
  LeaderPressureStatus,
  PlayerStatus,
  COMEBACK_CONFIG,
  INSURANCE_CONFIG,
} from '../types/playerStatus';

interface PlayerStatusState {
  // Status for all squad members
  squadStatuses: Record<string, PlayerStatus>;
  isLoading: boolean;

  // Current user's status
  myInsurance: ParticipationInsurance | null;
  myComebackStatus: ComebackStatus | null;
  myPressureStatus: LeaderPressureStatus | null;

  // Leader pressure
  currentLeaderPressure: LeaderPressureStatus | null;

  // Actions
  fetchSquadStatuses: (squadId: string) => Promise<void>;
  fetchMyStatus: (squadId: string) => Promise<void>;
  fetchLeaderPressure: (squadId: string) => Promise<void>;

  // Status checks
  checkComebackEligibility: (squadId: string, userId: string) => Promise<boolean>;
  checkInsuranceEligibility: (squadId: string, userId: string, eventId: string) => Promise<boolean>;

  // Apply statuses
  applyComebackBoost: (squadId: string, userId: string) => Promise<ComebackStatus | null>;
  applyInsurance: (squadId: string, userId: string, eventId: string, minReward: number) => Promise<boolean>;
  applyLeaderPressure: (squadId: string, leaderId: string, level: 'low' | 'medium' | 'high') => Promise<boolean>;
  removeLeaderPressure: (squadId: string) => Promise<boolean>;

  // Get player status
  getPlayerStatus: (userId: string) => PlayerStatus | null;
}

export const usePlayerStatusStore = create<PlayerStatusState>((set, get) => ({
  squadStatuses: {},
  isLoading: false,
  myInsurance: null,
  myComebackStatus: null,
  myPressureStatus: null,
  currentLeaderPressure: null,

  fetchSquadStatuses: async (squadId: string) => {
    set({ isLoading: true });
    try {
      // Fetch all squad members
      const { data: members } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId);

      if (!members) return;

      const statuses: Record<string, PlayerStatus> = {};

      // Fetch insurance for current event
      const { data: insuranceData } = await supabase
        .from('user_participation_insurance')
        .select('*')
        .eq('squad_id', squadId);

      // Fetch active comeback statuses
      const now = new Date().toISOString();
      const { data: comebackData } = await supabase
        .from('user_comeback_status')
        .select('*')
        .eq('squad_id', squadId)
        .gt('expires_at', now);

      // Fetch leader pressure
      const { data: pressureData } = await supabase
        .from('leader_pressure_status')
        .select('*')
        .eq('squad_id', squadId)
        .single();

      // Build status map
      for (const member of members) {
        const insurance = insuranceData?.find(i => i.user_id === member.user_id) || null;
        const comeback = comebackData?.find(c => c.user_id === member.user_id) || null;
        const pressure = pressureData?.user_id === member.user_id ? pressureData : null;

        statuses[member.user_id] = {
          userId: member.user_id,
          insurance,
          comeback: comeback ? { ...comeback, is_active: true } : null,
          pressure,
        };
      }

      set({ squadStatuses: statuses, currentLeaderPressure: pressureData });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyStatus: async (squadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      // Fetch my insurance
      const { data: insurance } = await supabase
        .from('user_participation_insurance')
        .select('*')
        .eq('squad_id', squadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch my comeback status
      const { data: comeback } = await supabase
        .from('user_comeback_status')
        .select('*')
        .eq('squad_id', squadId)
        .eq('user_id', user.id)
        .gt('expires_at', now)
        .single();

      // Fetch leader pressure (if I'm the leader)
      const { data: pressure } = await supabase
        .from('leader_pressure_status')
        .select('*')
        .eq('squad_id', squadId)
        .eq('user_id', user.id)
        .single();

      set({
        myInsurance: insurance || null,
        myComebackStatus: comeback ? { ...comeback, is_active: true } : null,
        myPressureStatus: pressure || null,
      });
    } catch (err) {
      console.error('Error fetching my status:', err);
    }
  },

  fetchLeaderPressure: async (squadId: string) => {
    try {
      const { data, error } = await supabase
        .from('leader_pressure_status')
        .select('*')
        .eq('squad_id', squadId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching leader pressure:', error);
        return;
      }

      set({ currentLeaderPressure: data || null });
    } catch (err) {
      console.error('Error in fetchLeaderPressure:', err);
    }
  },

  checkComebackEligibility: async (squadId: string, userId: string) => {
    try {
      // Check if user was in bottom 30% in recent events
      const { data: recentStats } = await supabase
        .from('user_event_stats')
        .select('rank, total_participants')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(COMEBACK_CONFIG.min_events_for_trigger);

      if (!recentStats || recentStats.length < COMEBACK_CONFIG.min_events_for_trigger) {
        return false;
      }

      // Check if consistently in bottom threshold
      const bottomThreshold = COMEBACK_CONFIG.trigger_threshold;
      const wasConsistentlyBottom = recentStats.every(stat => {
        const percentile = stat.rank / stat.total_participants;
        return percentile > (1 - bottomThreshold);
      });

      return wasConsistentlyBottom;
    } catch (err) {
      console.error('Error checking comeback eligibility:', err);
      return false;
    }
  },

  checkInsuranceEligibility: async (squadId: string, userId: string, eventId: string) => {
    try {
      // Check participation rate
      const { data: stats } = await supabase
        .from('user_stats')
        .select('events_participated, events_total')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();

      if (!stats) return false;

      const participationRate = stats.events_participated / (stats.events_total || 1);
      return participationRate >= INSURANCE_CONFIG.min_participation_rate;
    } catch (err) {
      console.error('Error checking insurance eligibility:', err);
      return false;
    }
  },

  applyComebackBoost: async (squadId: string, userId: string) => {
    try {
      const expiresAt = new Date(
        Date.now() + COMEBACK_CONFIG.duration_hours * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from('user_comeback_status')
        .upsert({
          user_id: userId,
          squad_id: squadId,
          triggered_at: new Date().toISOString(),
          expires_at: expiresAt,
          bonus_multiplier: COMEBACK_CONFIG.bonus_multiplier,
        })
        .select()
        .single();

      if (error) {
        console.error('Error applying comeback boost:', error);
        return null;
      }

      // Refresh statuses
      await get().fetchSquadStatuses(squadId);

      return { ...data, is_active: true };
    } catch (err) {
      console.error('Error in applyComebackBoost:', err);
      return null;
    }
  },

  applyInsurance: async (squadId: string, userId: string, eventId: string, minReward: number) => {
    try {
      const { error } = await supabase
        .from('user_participation_insurance')
        .upsert({
          user_id: userId,
          squad_id: squadId,
          event_id: eventId,
          qualified: true,
          minimum_reward: minReward,
        });

      if (error) {
        console.error('Error applying insurance:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in applyInsurance:', err);
      return false;
    }
  },

  applyLeaderPressure: async (squadId: string, leaderId: string, level: 'low' | 'medium' | 'high') => {
    try {
      // First remove any existing pressure
      await supabase
        .from('leader_pressure_status')
        .delete()
        .eq('squad_id', squadId);

      // Apply new pressure
      const { error } = await supabase
        .from('leader_pressure_status')
        .insert({
          squad_id: squadId,
          user_id: leaderId,
          activated_at: new Date().toISOString(),
          pressure_level: level,
        });

      if (error) {
        console.error('Error applying leader pressure:', error);
        return false;
      }

      // Refresh
      await get().fetchLeaderPressure(squadId);

      return true;
    } catch (err) {
      console.error('Error in applyLeaderPressure:', err);
      return false;
    }
  },

  removeLeaderPressure: async (squadId: string) => {
    try {
      const { error } = await supabase
        .from('leader_pressure_status')
        .delete()
        .eq('squad_id', squadId);

      if (error) {
        console.error('Error removing leader pressure:', error);
        return false;
      }

      set({ currentLeaderPressure: null });
      return true;
    } catch (err) {
      console.error('Error in removeLeaderPressure:', err);
      return false;
    }
  },

  getPlayerStatus: (userId: string) => {
    return get().squadStatuses[userId] || null;
  },
}));

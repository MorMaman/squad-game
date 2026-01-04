/**
 * Judge Store
 * Manages daily judge assignments, challenges, and power activations
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  SquadJudge,
  Challenge,
  ChallengeVote,
  PowerActivation,
  PowerType,
} from '../types/judge';

interface JudgeState {
  // Current judge
  currentJudge: SquadJudge | null;
  isLoadingJudge: boolean;

  // Challenges
  activeChallenge: Challenge | null;
  challengeVotes: ChallengeVote[];
  userVote: ChallengeVote | null;
  isLoadingChallenge: boolean;

  // Power activations
  activePowers: PowerActivation[];
  powerHistory: PowerActivation[];
  isLoadingPowers: boolean;

  // Actions
  fetchCurrentJudge: (squadId: string) => Promise<void>;
  fetchActiveChallenge: (squadId: string) => Promise<void>;
  fetchActivePowers: (squadId: string) => Promise<void>;
  fetchPowerHistory: (squadId: string, limit?: number) => Promise<void>;

  // Challenge actions
  createChallenge: (
    squadId: string,
    targetId: string,
    challengeType: 'judge_decision' | 'power_activation',
    relatedPowerId?: string,
    relatedEventId?: string
  ) => Promise<Challenge | null>;
  voteOnChallenge: (challengeId: string, vote: 'for' | 'against') => Promise<boolean>;

  // Power actions
  activatePower: (
    squadId: string,
    powerType: PowerType,
    affectedUsers: string[],
    expiresAt?: string
  ) => Promise<PowerActivation | null>;
  cancelPower: (activationId: string, reason: string) => Promise<boolean>;

  // Judge actions
  applyJudgeBonus: (judgeId: string, bonusAmount: number) => Promise<boolean>;
  applyJudgePenalty: (judgeId: string, penaltyAmount: number) => Promise<boolean>;
}

export const useJudgeStore = create<JudgeState>((set, get) => ({
  currentJudge: null,
  isLoadingJudge: false,
  activeChallenge: null,
  challengeVotes: [],
  userVote: null,
  isLoadingChallenge: false,
  activePowers: [],
  powerHistory: [],
  isLoadingPowers: false,

  fetchCurrentJudge: async (squadId: string) => {
    set({ isLoadingJudge: true });
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('squad_judges')
        .select(`
          *,
          user:profiles!user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('squad_id', squadId)
        .eq('judge_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current judge:', error);
        return;
      }

      set({ currentJudge: data || null });
    } finally {
      set({ isLoadingJudge: false });
    }
  },

  fetchActiveChallenge: async (squadId: string) => {
    set({ isLoadingChallenge: true });
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:profiles!challenger_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('squad_id', squadId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active challenge:', error);
        return;
      }

      if (data) {
        // Fetch votes for this challenge
        const { data: votes } = await supabase
          .from('challenge_votes')
          .select('*')
          .eq('challenge_id', data.id);

        // Check if current user has voted
        const { data: { user } } = await supabase.auth.getUser();
        const userVote = votes?.find(v => v.user_id === user?.id) || null;

        set({
          activeChallenge: data,
          challengeVotes: votes || [],
          userVote,
        });
      } else {
        set({ activeChallenge: null, challengeVotes: [], userVote: null });
      }
    } finally {
      set({ isLoadingChallenge: false });
    }
  },

  fetchActivePowers: async (squadId: string) => {
    set({ isLoadingPowers: true });
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('power_activations')
        .select(`
          *,
          activator:profiles!activated_by (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('squad_id', squadId)
        .is('cancelled_at', null)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('activated_at', { ascending: false });

      if (error) {
        console.error('Error fetching active powers:', error);
        return;
      }

      set({ activePowers: data || [] });
    } finally {
      set({ isLoadingPowers: false });
    }
  },

  fetchPowerHistory: async (squadId: string, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('power_activations')
        .select(`
          *,
          activator:profiles!activated_by (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('squad_id', squadId)
        .order('activated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching power history:', error);
        return;
      }

      set({ powerHistory: data || [] });
    } catch (err) {
      console.error('Error in fetchPowerHistory:', err);
    }
  },

  createChallenge: async (squadId, targetId, challengeType, relatedPowerId, relatedEventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Calculate expiration (e.g., 1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Get squad member count for votes needed (majority)
      const { count } = await supabase
        .from('squad_members')
        .select('*', { count: 'exact', head: true })
        .eq('squad_id', squadId);

      const votesNeeded = Math.ceil((count || 3) / 2);

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          squad_id: squadId,
          challenger_id: user.id,
          target_id: targetId,
          challenge_type: challengeType,
          related_power_id: relatedPowerId,
          related_event_id: relatedEventId,
          votes_for: 1, // Challenger's vote
          votes_against: 0,
          votes_needed: votesNeeded,
          expires_at: expiresAt,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating challenge:', error);
        return null;
      }

      // Auto-vote for the challenger
      await supabase
        .from('challenge_votes')
        .insert({
          challenge_id: data.id,
          user_id: user.id,
          vote: 'for',
        });

      // Refresh active challenge
      await get().fetchActiveChallenge(squadId);

      return data;
    } catch (err) {
      console.error('Error in createChallenge:', err);
      return null;
    }
  },

  voteOnChallenge: async (challengeId: string, vote: 'for' | 'against') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Insert vote
      const { error: voteError } = await supabase
        .from('challenge_votes')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          vote,
        });

      if (voteError) {
        console.error('Error voting on challenge:', voteError);
        return false;
      }

      // Update vote counts
      const column = vote === 'for' ? 'votes_for' : 'votes_against';
      const { error: updateError } = await supabase
        .rpc('increment_challenge_vote', {
          p_challenge_id: challengeId,
          p_column: column,
        });

      if (updateError) {
        console.error('Error updating vote count:', updateError);
      }

      // Check if challenge should be resolved
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        if (challenge.votes_for >= challenge.votes_needed) {
          // Challenge passed
          await supabase
            .from('challenges')
            .update({ status: 'passed', result_applied: true })
            .eq('id', challengeId);
        } else if (challenge.votes_against >= challenge.votes_needed) {
          // Challenge failed
          await supabase
            .from('challenges')
            .update({ status: 'failed' })
            .eq('id', challengeId);
        }

        // Refresh
        const { activeChallenge } = get();
        if (activeChallenge?.squad_id) {
          await get().fetchActiveChallenge(activeChallenge.squad_id);
        }
      }

      return true;
    } catch (err) {
      console.error('Error in voteOnChallenge:', err);
      return false;
    }
  },

  activatePower: async (squadId, powerType, affectedUsers, expiresAt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('power_activations')
        .insert({
          squad_id: squadId,
          power_type: powerType,
          activated_by: user.id,
          affected_users: affectedUsers,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Error activating power:', error);
        return null;
      }

      // Refresh active powers
      await get().fetchActivePowers(squadId);

      return data;
    } catch (err) {
      console.error('Error in activatePower:', err);
      return null;
    }
  },

  cancelPower: async (activationId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('power_activations')
        .update({
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancel_reason: reason,
        })
        .eq('id', activationId);

      if (error) {
        console.error('Error cancelling power:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in cancelPower:', err);
      return false;
    }
  },

  applyJudgeBonus: async (judgeId: string, bonusAmount: number) => {
    try {
      const { error } = await supabase
        .from('squad_judges')
        .update({ bonus_earned: bonusAmount })
        .eq('id', judgeId);

      if (error) {
        console.error('Error applying judge bonus:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in applyJudgeBonus:', err);
      return false;
    }
  },

  applyJudgePenalty: async (judgeId: string, penaltyAmount: number) => {
    try {
      const { error } = await supabase
        .from('squad_judges')
        .update({
          penalty_applied: penaltyAmount,
          is_overturned: true,
        })
        .eq('id', judgeId);

      if (error) {
        console.error('Error applying judge penalty:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in applyJudgePenalty:', err);
      return false;
    }
  },
}));

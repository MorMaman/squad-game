/**
 * Reward Slots Store
 * Manages the chest-like reward slot system state
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  RewardSlot,
  ClaimRewardResult,
  isSlotReadyToClaim,
  SLOT_FILL_REQUIREMENTS,
} from '../types/rewardSlots';

interface RewardSlotsState {
  slots: RewardSlot[];
  isLoading: boolean;

  // Actions
  fetchSlots: () => Promise<void>;
  initializeSlots: () => Promise<void>;
  addProgress: (progress: number) => Promise<{ slotIndex?: number; becameReady?: boolean }>;
  claimReward: (slotIndex: number, squadId: string) => Promise<ClaimRewardResult>;
  getReadySlots: () => RewardSlot[];
  getUnlockingSlots: () => RewardSlot[];
  getFillingSlot: () => RewardSlot | null;
  clearSlots: () => void;
}

export const useRewardSlotsStore = create<RewardSlotsState>((set, get) => ({
  slots: [],
  isLoading: false,

  fetchSlots: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_reward_slots')
        .select('*')
        .eq('user_id', user.id)
        .order('slot_index', { ascending: true });

      if (error) {
        console.error('Error fetching reward slots:', error);
        return;
      }

      // Initialize slots if none exist
      if (!data || data.length === 0) {
        await get().initializeSlots();
        return;
      }

      set({ slots: (data as RewardSlot[]) || [] });
    } catch (error) {
      console.error('Error fetching reward slots:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  initializeSlots: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('initialize_user_reward_slots', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error initializing reward slots:', error);
        return;
      }

      // Fetch the newly created slots
      await get().fetchSlots();
    } catch (error) {
      console.error('Error initializing reward slots:', error);
    }
  },

  addProgress: async (progress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase.rpc('add_slot_progress', {
        p_user_id: user.id,
        p_progress: progress,
      });

      if (error) {
        console.error('Error adding slot progress:', error);
        return {};
      }

      // Refresh slots
      await get().fetchSlots();

      const result = data?.[0];
      if (result) {
        return {
          slotIndex: result.slot_index,
          becameReady: result.became_ready,
        };
      }

      return {};
    } catch (error) {
      console.error('Error adding slot progress:', error);
      return {};
    }
  },

  claimReward: async (slotIndex: number, squadId: string): Promise<ClaimRewardResult> => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          reward_type: null,
          reward_amount: null,
          reward_card_type: null,
          rarity: null,
          error_message: 'Not authenticated',
        };
      }

      const { data, error } = await supabase.rpc('claim_reward_slot', {
        p_user_id: user.id,
        p_squad_id: squadId,
        p_slot_index: slotIndex,
      });

      if (error) {
        console.error('Error claiming reward:', error);
        return {
          success: false,
          reward_type: null,
          reward_amount: null,
          reward_card_type: null,
          rarity: null,
          error_message: error.message,
        };
      }

      // Refresh slots
      await get().fetchSlots();

      const result = data?.[0];
      if (result) {
        return result as ClaimRewardResult;
      }

      return {
        success: false,
        reward_type: null,
        reward_amount: null,
        reward_card_type: null,
        rarity: null,
        error_message: 'Unknown error',
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return {
        success: false,
        reward_type: null,
        reward_amount: null,
        reward_card_type: null,
        rarity: null,
        error_message: (error as Error).message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  getReadySlots: () => {
    return get().slots.filter(isSlotReadyToClaim);
  },

  getUnlockingSlots: () => {
    return get().slots.filter((slot) => slot.state === 'unlocking');
  },

  getFillingSlot: () => {
    return get().slots.find((slot) => slot.state === 'filling') || null;
  },

  clearSlots: () => {
    set({
      slots: [],
      isLoading: false,
    });
  },
}));

/**
 * Helper to calculate progress to add based on activity
 */
export function calculateProgressForActivity(
  activity: keyof typeof SLOT_FILL_REQUIREMENTS
): number {
  return SLOT_FILL_REQUIREMENTS[activity] || 0;
}

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserPower, ActiveTarget } from '../types/powers';

interface PowerState {
  activePowers: UserPower[];
  activeTargets: ActiveTarget[];
  isLoading: boolean;

  // Actions
  fetchActivePowers: (squadId: string) => Promise<void>;
  fetchActiveTargets: (squadId: string) => Promise<void>;
  usePower: (powerId: string, metadata?: { target_user_id?: string; rule?: string }) => Promise<{ error: Error | null }>;
  getMyActivePower: (squadId: string) => UserPower | null;
  isUserTargeted: (userId: string, squadId: string) => boolean;
  hasDoubleChance: (userId: string, squadId: string) => boolean;
  clearPowers: () => void;
}

export const usePowerStore = create<PowerState>((set, get) => ({
  activePowers: [],
  activeTargets: [],
  isLoading: false,

  fetchActivePowers: async (squadId: string) => {
    set({ isLoading: true });
    try {
      const now = new Date().toISOString();

      // Fetch active (non-expired, non-used) powers for this squad
      const { data, error } = await supabase
        .from('user_powers')
        .select('*')
        .eq('squad_id', squadId)
        .is('used_at', null)
        .gt('expires_at', now);

      if (error) {
        console.error('Error fetching active powers:', error);
        return;
      }

      set({ activePowers: (data as UserPower[]) || [] });
    } catch (error) {
      console.error('Error fetching active powers:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveTargets: async (squadId: string) => {
    try {
      const now = new Date().toISOString();

      // Fetch active (non-expired) targets for this squad
      const { data, error } = await supabase
        .from('active_targets')
        .select('*')
        .eq('squad_id', squadId)
        .gt('expires_at', now);

      if (error) {
        console.error('Error fetching active targets:', error);
        return;
      }

      set({ activeTargets: (data as ActiveTarget[]) || [] });
    } catch (error) {
      console.error('Error fetching active targets:', error);
    }
  },

  usePower: async (powerId: string, metadata?: { target_user_id?: string; rule?: string }) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      // Find the power to verify ownership and get details
      const power = get().activePowers.find((p) => p.id === powerId);
      if (!power) {
        return { error: new Error('Power not found or already used') };
      }

      if (power.user_id !== user.id) {
        return { error: new Error('You do not own this power') };
      }

      // Check if power has expired
      if (new Date(power.expires_at) < new Date()) {
        return { error: new Error('This power has expired') };
      }

      // Update the power as used
      const { error: updateError } = await supabase
        .from('user_powers')
        .update({
          used_at: new Date().toISOString(),
          metadata: metadata || null,
        })
        .eq('id', powerId)
        .eq('user_id', user.id);

      if (updateError) {
        return { error: updateError as Error };
      }

      // If target_lock power, create an active_target entry
      if (power.power_type === 'target_lock' && metadata?.target_user_id) {
        // Target lock expires at end of next event (24 hours from now as fallback)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: targetError } = await supabase
          .from('active_targets')
          .insert({
            targeter_id: user.id,
            target_id: metadata.target_user_id,
            squad_id: power.squad_id,
            power_id: powerId,
            expires_at: expiresAt.toISOString(),
          });

        if (targetError) {
          console.error('Error creating active target:', targetError);
          // Don't return error since power was already used
        }

        // Refresh active targets
        await get().fetchActiveTargets(power.squad_id);
      }

      // Refresh active powers
      await get().fetchActivePowers(power.squad_id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  getMyActivePower: (squadId: string) => {
    const state = get();
    // Get current user synchronously from stored powers
    // This assumes fetchActivePowers was called with the current user's context
    const myPower = state.activePowers.find((p) => p.squad_id === squadId);

    // To get current user's power specifically, we need to check against auth
    // Since this is a sync function, we return the first power for the squad
    // The caller should filter by user_id if needed
    return myPower || null;
  },

  isUserTargeted: (userId: string, squadId: string) => {
    const { activeTargets } = get();
    const now = new Date();

    return activeTargets.some(
      (target) =>
        target.target_id === userId &&
        target.squad_id === squadId &&
        new Date(target.expires_at) > now
    );
  },

  hasDoubleChance: (userId: string, squadId: string) => {
    const { activePowers } = get();
    const now = new Date();

    return activePowers.some(
      (power) =>
        power.user_id === userId &&
        power.squad_id === squadId &&
        power.power_type === 'double_chance' &&
        power.used_at === null &&
        new Date(power.expires_at) > now
    );
  },

  clearPowers: () => {
    set({ activePowers: [], activeTargets: [] });
  },
}));

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Squad, SquadMember } from '../types';

interface SquadState {
  currentSquad: Squad | null;
  squads: Squad[];
  members: SquadMember[];
  isLoading: boolean;

  // Actions
  fetchSquads: () => Promise<void>;
  fetchMembers: (squadId: string) => Promise<void>;
  setCurrentSquad: (squad: Squad | null) => void;
  createSquad: (name: string, timezone: string) => Promise<{ squad: Squad | null; error: Error | null }>;
  joinSquad: (inviteCode: string) => Promise<{ error: Error | null }>;
  leaveSquad: (squadId: string) => Promise<{ error: Error | null }>;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useSquadStore = create<SquadState>((set, get) => ({
  currentSquad: null,
  squads: [],
  members: [],
  isLoading: false,

  fetchSquads: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('squad_members')
        .select(`
          squad_id,
          role,
          joined_at,
          squads (*)
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        const squads = data.map((item) => item.squads as unknown as Squad);
        set({ squads });

        // Set first squad as current if none selected
        if (!get().currentSquad && squads.length > 0) {
          set({ currentSquad: squads[0] });
        }
      }
    } catch (error) {
      console.error('Error fetching squads:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMembers: async (squadId: string) => {
    try {
      const { data, error } = await supabase
        .from('squad_members')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('squad_id', squadId);

      if (!error && data) {
        set({ members: data as SquadMember[] });
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  },

  setCurrentSquad: (squad: Squad | null) => {
    set({ currentSquad: squad });
    if (squad) {
      get().fetchMembers(squad.id);
    }
  },

  createSquad: async (name: string, timezone: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { squad: null, error: new Error('Not authenticated') };

      const inviteCode = generateInviteCode();

      // Create the squad
      const { data: squad, error: squadError } = await supabase
        .from('squads')
        .insert({
          name,
          invite_code: inviteCode,
          timezone,
          created_by: user.id,
        })
        .select()
        .single();

      if (squadError) {
        return { squad: null, error: squadError as Error };
      }

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        return { squad: null, error: memberError as Error };
      }

      // Initialize user stats for this squad
      await supabase.from('user_stats').insert({
        user_id: user.id,
        squad_id: squad.id,
        points_weekly: 0,
        points_total: 0,
        streak_count: 0,
        strikes_14d: 0,
      });

      await get().fetchSquads();
      set({ currentSquad: squad as Squad });

      return { squad: squad as Squad, error: null };
    } catch (error) {
      return { squad: null, error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  joinSquad: async (inviteCode: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      // Find squad by invite code
      const { data: squad, error: findError } = await supabase
        .from('squads')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (findError || !squad) {
        return { error: new Error('Invalid invite code') };
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', squad.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return { error: new Error('Already a member of this squad') };
      }

      // Join the squad
      const { error: joinError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) {
        return { error: joinError as Error };
      }

      // Initialize user stats
      await supabase.from('user_stats').insert({
        user_id: user.id,
        squad_id: squad.id,
        points_weekly: 0,
        points_total: 0,
        streak_count: 0,
        strikes_14d: 0,
      });

      await get().fetchSquads();
      set({ currentSquad: squad as Squad });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  leaveSquad: async (squadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', user.id);

      if (!error) {
        await get().fetchSquads();
        if (get().currentSquad?.id === squadId) {
          const remaining = get().squads.filter((s) => s.id !== squadId);
          set({ currentSquad: remaining[0] || null });
        }
      }

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  },
}));

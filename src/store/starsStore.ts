/**
 * Stars Currency Store
 * Manages the stars currency system state
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { StarTransaction, StarSource, STAR_REWARDS } from '../types/stars';

interface StarsState {
  stars: number;
  starsLifetime: number;
  recentTransactions: StarTransaction[];
  isLoading: boolean;
  lastLoginDate: string | null;
  consecutiveLoginDays: number;

  // Actions
  fetchStars: (squadId: string) => Promise<void>;
  earnStars: (
    squadId: string,
    amount: number,
    source: StarSource,
    referenceId?: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: Error | null; newBalance?: number }>;
  spendStars: (
    squadId: string,
    amount: number,
    source: string,
    referenceId?: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: Error | null; success: boolean; newBalance?: number }>;
  fetchTransactions: (limit?: number) => Promise<void>;
  checkDailyLogin: (squadId: string) => Promise<{ alreadyClaimed: boolean; reward?: number }>;
  clearStars: () => void;
}

export const useStarsStore = create<StarsState>((set, get) => ({
  stars: 0,
  starsLifetime: 0,
  recentTransactions: [],
  isLoading: false,
  lastLoginDate: null,
  consecutiveLoginDays: 0,

  fetchStars: async (squadId: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_stats')
        .select('stars, stars_lifetime')
        .eq('user_id', user.id)
        .eq('squad_id', squadId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stars:', error);
        return;
      }

      set({
        stars: data?.stars ?? 0,
        starsLifetime: data?.stars_lifetime ?? 0,
      });
    } catch (error) {
      console.error('Error fetching stars:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  earnStars: async (squadId, amount, source, referenceId, metadata = {}) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const { data, error } = await supabase.rpc('award_stars', {
        p_user_id: user.id,
        p_squad_id: squadId,
        p_amount: amount,
        p_source: source,
        p_reference_id: referenceId || null,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Error earning stars:', error);
        return { error: new Error(error.message) };
      }

      const result = data?.[0];
      if (result) {
        set((state) => ({
          stars: result.new_balance,
          starsLifetime: state.starsLifetime + amount,
        }));
        return { error: null, newBalance: result.new_balance };
      }

      return { error: new Error('Unknown error') };
    } catch (error) {
      console.error('Error earning stars:', error);
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  spendStars: async (squadId, amount, source, referenceId, metadata = {}) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated'), success: false };

      const { data, error } = await supabase.rpc('spend_stars', {
        p_user_id: user.id,
        p_squad_id: squadId,
        p_amount: amount,
        p_source: source,
        p_reference_id: referenceId || null,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Error spending stars:', error);
        return { error: new Error(error.message), success: false };
      }

      const result = data?.[0];
      if (result) {
        if (result.success) {
          set({ stars: result.new_balance });
        }
        return {
          error: result.success ? null : new Error(result.error_message || 'Insufficient stars'),
          success: result.success,
          newBalance: result.new_balance,
        };
      }

      return { error: new Error('Unknown error'), success: false };
    } catch (error) {
      console.error('Error spending stars:', error);
      return { error: error as Error, success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (limit = 20) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('star_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      set({ recentTransactions: (data as StarTransaction[]) || [] });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  checkDailyLogin: async (squadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { alreadyClaimed: true };

      const today = new Date().toISOString().split('T')[0];
      const state = get();

      // Check if already claimed today
      if (state.lastLoginDate === today) {
        return { alreadyClaimed: true };
      }

      // Check last transaction for daily_login
      const { data: lastLogin } = await supabase
        .from('star_transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('source', 'daily_login')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin.created_at).toISOString().split('T')[0];
        if (lastLoginDate === today) {
          set({ lastLoginDate: today });
          return { alreadyClaimed: true };
        }

        // Calculate consecutive days
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const isConsecutive = lastLoginDate === yesterdayStr;
        const newConsecutive = isConsecutive ? state.consecutiveLoginDays + 1 : 1;

        set({ consecutiveLoginDays: newConsecutive });
      }

      // Calculate reward based on streak
      const day = ((get().consecutiveLoginDays - 1) % 7) + 1;
      let reward: number = STAR_REWARDS.DAILY_LOGIN_BASE;
      if (day === 2) reward = 15;
      if (day === 3) reward = 20;
      if (day === 4) reward = 25;
      if (day === 5) reward = 35;
      if (day === 6) reward = 40;
      if (day === 7) reward = 50;

      // Award the stars
      const result = await get().earnStars(squadId, reward, 'daily_login');

      if (!result.error) {
        set({ lastLoginDate: today });
        return { alreadyClaimed: false, reward };
      }

      return { alreadyClaimed: true };
    } catch (error) {
      console.error('Error checking daily login:', error);
      return { alreadyClaimed: true };
    }
  },

  clearStars: () => {
    set({
      stars: 0,
      starsLifetime: 0,
      recentTransactions: [],
      isLoading: false,
    });
  },
}));

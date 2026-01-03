import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CrownHolder, Headline, ActiveRivalry, MAX_HEADLINE_LENGTH } from '../types/crown';

interface CrownState {
  currentCrown: CrownHolder | null;
  activeHeadline: Headline | null;
  activeRivalry: ActiveRivalry | null;
  isLoading: boolean;

  // Actions
  fetchCrownData: (squadId: string) => Promise<void>;
  setHeadline: (crownId: string, content: string) => Promise<{ error: Error | null }>;
  declareRivalry: (crownId: string, rival1Id: string, rival2Id: string) => Promise<{ error: Error | null }>;

  // Helpers
  isUserCrowned: (userId: string, squadId: string) => boolean;
  isUserInRivalry: (userId: string, squadId: string) => boolean;
  getMyHeadline: (squadId: string) => Headline | null;
  clearCrownData: () => void;
}

export const useCrownStore = create<CrownState>((set, get) => ({
  currentCrown: null,
  activeHeadline: null,
  activeRivalry: null,
  isLoading: false,

  fetchCrownData: async (squadId: string) => {
    set({ isLoading: true });
    try {
      const now = new Date().toISOString();

      // Fetch active crown holder for this squad
      const { data: crownData, error: crownError } = await supabase
        .from('crown_holders')
        .select('*')
        .eq('squad_id', squadId)
        .gt('expires_at', now)
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (crownError) {
        console.error('Error fetching crown holder:', crownError);
        set({ currentCrown: null });
      } else {
        set({ currentCrown: crownData as CrownHolder | null });
      }

      // Fetch active headline for this squad
      const { data: headlineData, error: headlineError } = await supabase
        .from('headlines')
        .select('*')
        .eq('squad_id', squadId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (headlineError) {
        console.error('Error fetching headline:', headlineError);
        set({ activeHeadline: null });
      } else {
        set({ activeHeadline: headlineData as Headline | null });
      }

      // Fetch active rivalry for this squad
      const { data: rivalryData, error: rivalryError } = await supabase
        .from('active_rivalries')
        .select('*')
        .eq('squad_id', squadId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rivalryError) {
        console.error('Error fetching rivalry:', rivalryError);
        set({ activeRivalry: null });
      } else {
        set({ activeRivalry: rivalryData as ActiveRivalry | null });
      }
    } catch (error) {
      console.error('Error fetching crown data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setHeadline: async (crownId: string, content: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      // Validate content length
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        return { error: new Error('Headline cannot be empty') };
      }
      if (trimmedContent.length > MAX_HEADLINE_LENGTH) {
        return { error: new Error(`Headline cannot exceed ${MAX_HEADLINE_LENGTH} characters`) };
      }

      // Verify user is the crown holder
      const { currentCrown } = get();
      if (!currentCrown || currentCrown.id !== crownId) {
        return { error: new Error('Crown not found') };
      }
      if (currentCrown.user_id !== user.id) {
        return { error: new Error('Only the crown holder can set a headline') };
      }

      // Check if crown has expired
      if (new Date(currentCrown.expires_at) < new Date()) {
        return { error: new Error('Crown has expired') };
      }

      // Headline expires when crown expires
      const expiresAt = currentCrown.expires_at;

      // Insert new headline
      const { data, error: insertError } = await supabase
        .from('headlines')
        .insert({
          user_id: user.id,
          squad_id: currentCrown.squad_id,
          crown_id: crownId,
          content: trimmedContent,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError as Error };
      }

      set({ activeHeadline: data as Headline });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  declareRivalry: async (crownId: string, rival1Id: string, rival2Id: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      // Verify user is the crown holder
      const { currentCrown } = get();
      if (!currentCrown || currentCrown.id !== crownId) {
        return { error: new Error('Crown not found') };
      }
      if (currentCrown.user_id !== user.id) {
        return { error: new Error('Only the crown holder can declare rivalries') };
      }

      // Check if crown has expired
      if (new Date(currentCrown.expires_at) < new Date()) {
        return { error: new Error('Crown has expired') };
      }

      // Validate rivals are different
      if (rival1Id === rival2Id) {
        return { error: new Error('Cannot declare rivalry between the same player') };
      }

      // Rivalry expires when crown expires
      const expiresAt = currentCrown.expires_at;

      // Insert new rivalry
      const { data, error: insertError } = await supabase
        .from('active_rivalries')
        .insert({
          declarer_id: user.id,
          rival1_id: rival1Id,
          rival2_id: rival2Id,
          squad_id: currentCrown.squad_id,
          crown_id: crownId,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError as Error };
      }

      set({ activeRivalry: data as ActiveRivalry });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  isUserCrowned: (userId: string, squadId: string) => {
    const { currentCrown } = get();
    if (!currentCrown) return false;

    const now = new Date();
    return (
      currentCrown.user_id === userId &&
      currentCrown.squad_id === squadId &&
      new Date(currentCrown.expires_at) > now
    );
  },

  isUserInRivalry: (userId: string, squadId: string) => {
    const { activeRivalry } = get();
    if (!activeRivalry) return false;

    const now = new Date();
    return (
      activeRivalry.squad_id === squadId &&
      (activeRivalry.rival1_id === userId || activeRivalry.rival2_id === userId) &&
      new Date(activeRivalry.expires_at) > now
    );
  },

  getMyHeadline: (squadId: string) => {
    const { activeHeadline } = get();
    if (!activeHeadline) return null;

    const now = new Date();
    if (
      activeHeadline.squad_id === squadId &&
      new Date(activeHeadline.expires_at) > now
    ) {
      return activeHeadline;
    }
    return null;
  },

  clearCrownData: () => {
    set({
      currentCrown: null,
      activeHeadline: null,
      activeRivalry: null,
    });
  },
}));

/**
 * Wild Card Store
 * Manages the wild card system state
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserWildCard, WildCardType, UseWildCardResult, isWildCardActive } from '../types/wildCards';

interface WildCardState {
  wildCards: UserWildCard[];
  isLoading: boolean;

  // Actions
  fetchWildCards: () => Promise<void>;
  useWildCard: (
    cardId: string,
    targetUserId?: string,
    metadata?: Record<string, unknown>
  ) => Promise<UseWildCardResult>;
  grantWildCard: (
    cardType: WildCardType,
    sourceItemId?: string,
    expiresAt?: string,
    uses?: number,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: Error | null; cardId?: string }>;
  getActiveCards: () => UserWildCard[];
  getCardsByType: (type: WildCardType) => UserWildCard[];
  hasCard: (type: WildCardType) => boolean;
  getActiveCardOfType: (type: WildCardType) => UserWildCard | null;
  clearWildCards: () => void;
}

export const useWildCardStore = create<WildCardState>((set, get) => ({
  wildCards: [],
  isLoading: false,

  fetchWildCards: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_wild_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('acquired_at', { ascending: false });

      if (error) {
        console.error('Error fetching wild cards:', error);
        return;
      }

      set({ wildCards: (data as UserWildCard[]) || [] });
    } catch (error) {
      console.error('Error fetching wild cards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  useWildCard: async (cardId, targetUserId, metadata = {}) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          card_type: null,
          remaining_uses: null,
          error_message: 'Not authenticated',
        };
      }

      const { data, error } = await supabase.rpc('use_wild_card', {
        p_user_id: user.id,
        p_card_id: cardId,
        p_target_user_id: targetUserId || null,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Error using wild card:', error);
        return {
          success: false,
          card_type: null,
          remaining_uses: null,
          error_message: error.message,
        };
      }

      const result = data?.[0];
      if (result) {
        // Refresh wild cards
        await get().fetchWildCards();
        return result as UseWildCardResult;
      }

      return {
        success: false,
        card_type: null,
        remaining_uses: null,
        error_message: 'Unknown error',
      };
    } catch (error) {
      console.error('Error using wild card:', error);
      return {
        success: false,
        card_type: null,
        remaining_uses: null,
        error_message: (error as Error).message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  grantWildCard: async (cardType, sourceItemId, expiresAt, uses = 1, metadata = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const { data, error } = await supabase.rpc('grant_wild_card', {
        p_user_id: user.id,
        p_card_type: cardType,
        p_source_item_id: sourceItemId || null,
        p_expires_at: expiresAt || null,
        p_uses: uses,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Error granting wild card:', error);
        return { error: new Error(error.message) };
      }

      // Refresh wild cards
      await get().fetchWildCards();
      return { error: null, cardId: data };
    } catch (error) {
      console.error('Error granting wild card:', error);
      return { error: error as Error };
    }
  },

  getActiveCards: () => {
    return get().wildCards.filter(isWildCardActive);
  },

  getCardsByType: (type: WildCardType) => {
    return get().wildCards.filter(
      (card) => card.card_type === type && isWildCardActive(card)
    );
  },

  hasCard: (type: WildCardType) => {
    return get().wildCards.some(
      (card) => card.card_type === type && isWildCardActive(card)
    );
  },

  getActiveCardOfType: (type: WildCardType) => {
    return get().wildCards.find(
      (card) => card.card_type === type && isWildCardActive(card)
    ) || null;
  },

  clearWildCards: () => {
    set({
      wildCards: [],
      isLoading: false,
    });
  },
}));

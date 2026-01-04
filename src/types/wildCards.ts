/**
 * Wild Cards Types
 * Defines types for the wild card system
 */

export type WildCardType =
  | 'skip_card'      // Skip event without losing streak
  | 'double_xp'      // 2x XP for next N events
  | 'steal_crown'    // Challenge crown holder
  | 'revenge_card'   // Double points vs specific player
  | 'time_extend'    // Extra time in events
  | 'peek_answers';  // See poll majority before voting

export interface UserWildCard {
  id: string;
  user_id: string;
  card_type: WildCardType;
  acquired_at: string;
  used_at: string | null;
  expires_at: string | null;
  uses_remaining: number | null;
  source_item_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
}

export interface UseWildCardResult {
  success: boolean;
  card_type: string | null;
  remaining_uses: number | null;
  error_message: string | null;
}

/**
 * Wild card display information
 */
export const WILD_CARD_INFO: Record<WildCardType, {
  nameKey: string;
  descKey: string;
  icon: string;
  color: string;
  gradient: [string, string];
  price: number;
  requiresTarget: boolean;
}> = {
  skip_card: {
    nameKey: 'shop.wildCards.skipCard',
    descKey: 'shop.wildCards.skipCardDesc',
    icon: 'skip-forward',
    color: '#22C55E',
    gradient: ['#16A34A', '#15803D'],
    price: 500,
    requiresTarget: false,
  },
  double_xp: {
    nameKey: 'shop.wildCards.doubleXP',
    descKey: 'shop.wildCards.doubleXPDesc',
    icon: 'flash',
    color: '#FACC15',
    gradient: ['#EAB308', '#CA8A04'],
    price: 300,
    requiresTarget: false,
  },
  steal_crown: {
    nameKey: 'shop.wildCards.stealCrown',
    descKey: 'shop.wildCards.stealCrownDesc',
    icon: 'ribbon',
    color: '#A855F7',
    gradient: ['#9333EA', '#7C3AED'],
    price: 1000,
    requiresTarget: false,
  },
  revenge_card: {
    nameKey: 'shop.wildCards.revengeCard',
    descKey: 'shop.wildCards.revengeCardDesc',
    icon: 'locate',
    color: '#EF4444',
    gradient: ['#DC2626', '#B91C1C'],
    price: 400,
    requiresTarget: true,
  },
  time_extend: {
    nameKey: 'shop.wildCards.timeExtend',
    descKey: 'shop.wildCards.timeExtendDesc',
    icon: 'time',
    color: '#3B82F6',
    gradient: ['#2563EB', '#1D4ED8'],
    price: 250,
    requiresTarget: false,
  },
  peek_answers: {
    nameKey: 'shop.wildCards.peekAnswers',
    descKey: 'shop.wildCards.peekAnswersDesc',
    icon: 'eye',
    color: '#06B6D4',
    gradient: ['#0891B2', '#0E7490'],
    price: 350,
    requiresTarget: false,
  },
};

/**
 * Check if a wild card is active (not used and not expired)
 */
export function isWildCardActive(card: UserWildCard): boolean {
  if (card.used_at) return false;

  if (card.expires_at) {
    const expiresAt = new Date(card.expires_at);
    if (expiresAt < new Date()) return false;
  }

  if (card.uses_remaining !== null && card.uses_remaining <= 0) {
    return false;
  }

  return true;
}

/**
 * Get remaining time until wild card expires
 */
export function getWildCardTimeRemaining(card: UserWildCard): number | null {
  if (!card.expires_at) return null;

  const expiresAt = new Date(card.expires_at).getTime();
  const now = Date.now();

  return Math.max(0, expiresAt - now);
}

/**
 * Sort wild cards by type and expiration
 */
export function sortWildCards(cards: UserWildCard[]): UserWildCard[] {
  return [...cards].sort((a, b) => {
    // Active cards first
    const aActive = isWildCardActive(a);
    const bActive = isWildCardActive(b);
    if (aActive !== bActive) return aActive ? -1 : 1;

    // Then by expiration (expiring soon first)
    if (a.expires_at && b.expires_at) {
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
    }
    if (a.expires_at) return -1;
    if (b.expires_at) return 1;

    // Then by acquisition date (newest first)
    return new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime();
  });
}

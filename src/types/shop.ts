/**
 * Shop System Types
 * Defines types for the shop and inventory system
 */

export type ShopCategory =
  | 'avatar_frame'
  | 'theme'
  | 'wild_card'
  | 'power_boost'
  | 'headline_pack';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  name: string;
  name_key: string;
  description: string | null;
  description_key: string | null;
  category: ShopCategory;
  price_stars: number;
  price_iap_id: string | null;
  icon: string;
  rarity: ItemRarity;
  is_consumable: boolean;
  uses_per_purchase: number | null;
  is_limited: boolean;
  limited_quantity: number | null;
  available_from: string | null;
  available_until: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  equipped: boolean;
  // Joined data
  item?: ShopItem;
}

export interface PurchaseResult {
  success: boolean;
  inventory_id: string | null;
  new_star_balance: number | null;
  error_message: string | null;
}

/**
 * Rarity colors for UI
 */
export const RARITY_COLORS: Record<ItemRarity, { primary: string; gradient: [string, string] }> = {
  common: {
    primary: '#9CA3AF',
    gradient: ['#6B7280', '#4B5563'],
  },
  rare: {
    primary: '#3B82F6',
    gradient: ['#2563EB', '#1D4ED8'],
  },
  epic: {
    primary: '#A855F7',
    gradient: ['#9333EA', '#7C3AED'],
  },
  legendary: {
    primary: '#F59E0B',
    gradient: ['#D97706', '#B45309'],
  },
};

/**
 * Category display info for UI
 */
export const CATEGORY_INFO: Record<ShopCategory, { nameKey: string; icon: string }> = {
  avatar_frame: {
    nameKey: 'shop.categories.avatarFrames',
    icon: 'person-circle',
  },
  theme: {
    nameKey: 'shop.categories.themes',
    icon: 'color-palette',
  },
  wild_card: {
    nameKey: 'shop.categories.wildCards',
    icon: 'card',
  },
  power_boost: {
    nameKey: 'shop.categories.powerBoosts',
    icon: 'flash',
  },
  headline_pack: {
    nameKey: 'shop.categories.headlines',
    icon: 'megaphone',
  },
};

/**
 * Check if an item is available for purchase
 */
export function isItemAvailable(item: ShopItem): boolean {
  if (!item.is_active) return false;

  const now = new Date();

  if (item.available_from && new Date(item.available_from) > now) {
    return false;
  }

  if (item.available_until && new Date(item.available_until) < now) {
    return false;
  }

  return true;
}

/**
 * Get time remaining for limited item
 */
export function getTimeRemaining(item: ShopItem): number | null {
  if (!item.available_until) return null;

  const endTime = new Date(item.available_until).getTime();
  const now = Date.now();

  return Math.max(0, endTime - now);
}

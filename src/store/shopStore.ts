/**
 * Shop Store
 * Manages the shop and inventory system state
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ShopItem, InventoryItem, ShopCategory, PurchaseResult } from '../types/shop';

interface ShopState {
  items: ShopItem[];
  inventory: InventoryItem[];
  featuredItems: ShopItem[];
  selectedCategory: ShopCategory | 'all';
  isLoading: boolean;

  // Actions
  fetchShopItems: (category?: ShopCategory) => Promise<void>;
  fetchInventory: () => Promise<void>;
  purchaseItem: (itemId: string, squadId: string) => Promise<PurchaseResult>;
  equipItem: (inventoryId: string) => Promise<{ error: Error | null }>;
  unequipItem: (inventoryId: string) => Promise<{ error: Error | null }>;
  getEquippedItems: () => InventoryItem[];
  getEquippedByCategory: (category: ShopCategory) => InventoryItem | null;
  setSelectedCategory: (category: ShopCategory | 'all') => void;
  hasItem: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
  clearShop: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  items: [],
  inventory: [],
  featuredItems: [],
  selectedCategory: 'all',
  isLoading: false,

  fetchShopItems: async (category?: ShopCategory) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching shop items:', error);
        return;
      }

      const items = (data as ShopItem[]) || [];

      // Filter featured items (legendary or limited)
      const featured = items.filter(
        (item) => item.rarity === 'legendary' || item.is_limited
      );

      set({ items, featuredItems: featured });
    } catch (error) {
      console.error('Error fetching shop items:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInventory: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          item:shop_items(*)
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) {
        console.error('Error fetching inventory:', error);
        return;
      }

      set({ inventory: (data as InventoryItem[]) || [] });
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  purchaseItem: async (itemId: string, squadId: string): Promise<PurchaseResult> => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          inventory_id: null,
          new_star_balance: null,
          error_message: 'Not authenticated',
        };
      }

      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_squad_id: squadId,
        p_item_id: itemId,
      });

      if (error) {
        console.error('Error purchasing item:', error);
        return {
          success: false,
          inventory_id: null,
          new_star_balance: null,
          error_message: error.message,
        };
      }

      const result = data?.[0];
      if (result) {
        // Refresh inventory if purchase succeeded
        if (result.success) {
          await get().fetchInventory();
        }
        return result as PurchaseResult;
      }

      return {
        success: false,
        inventory_id: null,
        new_star_balance: null,
        error_message: 'Unknown error',
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      return {
        success: false,
        inventory_id: null,
        new_star_balance: null,
        error_message: (error as Error).message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  equipItem: async (inventoryId: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const { data, error } = await supabase.rpc('equip_item', {
        p_user_id: user.id,
        p_inventory_id: inventoryId,
      });

      if (error) {
        console.error('Error equipping item:', error);
        return { error: new Error(error.message) };
      }

      const result = data?.[0];
      if (result && !result.success) {
        return { error: new Error(result.error_message || 'Failed to equip') };
      }

      // Refresh inventory
      await get().fetchInventory();
      return { error: null };
    } catch (error) {
      console.error('Error equipping item:', error);
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  unequipItem: async (inventoryId: string) => {
    try {
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: false })
        .eq('id', inventoryId);

      if (error) {
        console.error('Error unequipping item:', error);
        return { error: new Error(error.message) };
      }

      // Refresh inventory
      await get().fetchInventory();
      return { error: null };
    } catch (error) {
      console.error('Error unequipping item:', error);
      return { error: error as Error };
    }
  },

  getEquippedItems: () => {
    return get().inventory.filter((item) => item.equipped);
  },

  getEquippedByCategory: (category: ShopCategory) => {
    return get().inventory.find(
      (item) => item.equipped && item.item?.category === category
    ) || null;
  },

  setSelectedCategory: (category: ShopCategory | 'all') => {
    set({ selectedCategory: category });
  },

  hasItem: (itemId: string) => {
    return get().inventory.some(
      (item) => item.item_id === itemId && item.quantity > 0
    );
  },

  getItemQuantity: (itemId: string) => {
    const item = get().inventory.find((item) => item.item_id === itemId);
    return item?.quantity ?? 0;
  },

  clearShop: () => {
    set({
      items: [],
      inventory: [],
      featuredItems: [],
      selectedCategory: 'all',
      isLoading: false,
    });
  },
}));

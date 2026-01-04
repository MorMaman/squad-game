-- Shop System Migration
-- Creates shop_items and user_inventory tables

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_key TEXT NOT NULL, -- i18n translation key
    description TEXT,
    description_key TEXT, -- i18n translation key
    category TEXT NOT NULL CHECK (category IN (
        'avatar_frame',
        'theme',
        'wild_card',
        'power_boost',
        'headline_pack'
    )),
    price_stars INTEGER NOT NULL CHECK (price_stars >= 0),
    price_iap_id TEXT, -- Future IAP product ID (App Store / Play Store)
    icon TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_consumable BOOLEAN NOT NULL DEFAULT false,
    uses_per_purchase INTEGER DEFAULT 1, -- For consumables, how many uses per purchase
    is_limited BOOLEAN NOT NULL DEFAULT false,
    limited_quantity INTEGER,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    equipped BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity, is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_available ON shop_items(is_active, available_from, available_until);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_equipped ON user_inventory(user_id, equipped) WHERE equipped = true;

-- Enable RLS
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_items
CREATE POLICY "Anyone can view active shop items" ON shop_items
    FOR SELECT USING (
        is_active = true
        AND (available_from IS NULL OR available_from <= NOW())
        AND (available_until IS NULL OR available_until > NOW())
    );

-- RLS Policies for user_inventory
CREATE POLICY "Users can view their inventory" ON user_inventory
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their inventory" ON user_inventory
    FOR UPDATE USING (user_id = auth.uid());

-- Function to purchase an item
CREATE OR REPLACE FUNCTION purchase_shop_item(
    p_user_id UUID,
    p_squad_id UUID,
    p_item_id UUID
)
RETURNS TABLE(success BOOLEAN, inventory_id UUID, new_star_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item shop_items%ROWTYPE;
    v_current_stars INTEGER;
    v_spend_result RECORD;
    v_inventory_id UUID;
    v_existing_quantity INTEGER;
BEGIN
    -- Get item details
    SELECT * INTO v_item
    FROM shop_items
    WHERE id = p_item_id
        AND is_active = true
        AND (available_from IS NULL OR available_from <= NOW())
        AND (available_until IS NULL OR available_until > NOW());

    IF v_item IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::INTEGER, 'Item not available'::TEXT;
        RETURN;
    END IF;

    -- Check limited quantity
    IF v_item.is_limited AND v_item.limited_quantity IS NOT NULL THEN
        DECLARE
            v_sold_count INTEGER;
        BEGIN
            SELECT COALESCE(SUM(quantity), 0) INTO v_sold_count
            FROM user_inventory
            WHERE item_id = p_item_id;

            IF v_sold_count >= v_item.limited_quantity THEN
                RETURN QUERY SELECT false, NULL::UUID, NULL::INTEGER, 'Item sold out'::TEXT;
                RETURN;
            END IF;
        END;
    END IF;

    -- Check if user already owns this non-consumable item
    IF NOT v_item.is_consumable THEN
        SELECT quantity INTO v_existing_quantity
        FROM user_inventory
        WHERE user_id = p_user_id AND item_id = p_item_id;

        IF v_existing_quantity IS NOT NULL AND v_existing_quantity > 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::INTEGER, 'Item already owned'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Try to spend stars
    SELECT * INTO v_spend_result
    FROM spend_stars(
        p_user_id,
        p_squad_id,
        v_item.price_stars,
        'shop_purchase',
        p_item_id,
        jsonb_build_object('item_name', v_item.name, 'category', v_item.category)
    );

    IF NOT v_spend_result.success THEN
        RETURN QUERY SELECT false, NULL::UUID, v_spend_result.new_balance, v_spend_result.error_message;
        RETURN;
    END IF;

    -- Add to inventory (upsert for consumables)
    INSERT INTO user_inventory (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, COALESCE(v_item.uses_per_purchase, 1))
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET
        quantity = user_inventory.quantity + COALESCE(v_item.uses_per_purchase, 1),
        acquired_at = NOW()
    RETURNING id INTO v_inventory_id;

    RETURN QUERY SELECT true, v_inventory_id, v_spend_result.new_balance, NULL::TEXT;
END;
$$;

-- Function to equip an item (unequips other items in same category)
CREATE OR REPLACE FUNCTION equip_item(
    p_user_id UUID,
    p_inventory_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inventory user_inventory%ROWTYPE;
    v_item shop_items%ROWTYPE;
BEGIN
    -- Get inventory item
    SELECT * INTO v_inventory
    FROM user_inventory
    WHERE id = p_inventory_id AND user_id = p_user_id;

    IF v_inventory IS NULL THEN
        RETURN QUERY SELECT false, 'Item not found in inventory'::TEXT;
        RETURN;
    END IF;

    -- Get item details
    SELECT * INTO v_item
    FROM shop_items
    WHERE id = v_inventory.item_id;

    IF v_item.is_consumable THEN
        RETURN QUERY SELECT false, 'Cannot equip consumable items'::TEXT;
        RETURN;
    END IF;

    -- Unequip other items in same category
    UPDATE user_inventory ui
    SET equipped = false
    FROM shop_items si
    WHERE ui.item_id = si.id
        AND ui.user_id = p_user_id
        AND si.category = v_item.category
        AND ui.equipped = true;

    -- Equip the new item
    UPDATE user_inventory
    SET equipped = true
    WHERE id = p_inventory_id;

    RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION purchase_shop_item TO authenticated;
GRANT EXECUTE ON FUNCTION equip_item TO authenticated;

-- Insert default shop items
INSERT INTO shop_items (name, name_key, description, description_key, category, price_stars, icon, rarity, is_consumable, sort_order) VALUES
-- Avatar Frames
('Golden Frame', 'shop.items.goldenFrame', 'A prestigious golden border for your avatar', 'shop.items.goldenFrameDesc', 'avatar_frame', 500, 'star', 'rare', false, 1),
('Diamond Frame', 'shop.items.diamondFrame', 'A dazzling diamond-studded frame', 'shop.items.diamondFrameDesc', 'avatar_frame', 1500, 'diamond', 'epic', false, 2),
('Legendary Frame', 'shop.items.legendaryFrame', 'The most exclusive frame for true champions', 'shop.items.legendaryFrameDesc', 'avatar_frame', 5000, 'flame', 'legendary', false, 3),
('Fire Frame', 'shop.items.fireFrame', 'A fiery animated border', 'shop.items.fireFrameDesc', 'avatar_frame', 2000, 'bonfire', 'epic', false, 4),

-- Themes
('Neon Theme', 'shop.items.neonTheme', 'Vibrant neon colors for your interface', 'shop.items.neonThemeDesc', 'theme', 800, 'color-palette', 'rare', false, 1),
('Royal Theme', 'shop.items.royalTheme', 'Purple and gold royal aesthetics', 'shop.items.royalThemeDesc', 'theme', 1200, 'crown', 'epic', false, 2),
('Dark Mode Pro', 'shop.items.darkModePro', 'Enhanced dark theme with OLED blacks', 'shop.items.darkModeProDesc', 'theme', 600, 'moon', 'common', false, 3),

-- Power Boosts
('Extra Double Chance', 'shop.items.extraDoubleChance', 'Get an additional Double Chance power', 'shop.items.extraDoubleChanceDesc', 'power_boost', 300, 'copy', 'common', true, 1),
('Extra Streak Shield', 'shop.items.extraStreakShield', 'Protect your streak one more time', 'shop.items.extraStreakShieldDesc', 'power_boost', 400, 'shield', 'rare', true, 2),
('Extra Chaos Card', 'shop.items.extraChaosCard', 'Add more chaos to your games', 'shop.items.extraChaosCardDesc', 'power_boost', 350, 'shuffle', 'rare', true, 3);

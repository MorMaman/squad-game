-- Wild Cards System Migration
-- Creates user_wild_cards table for special one-time use cards

-- User wild cards table
CREATE TABLE IF NOT EXISTS user_wild_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_type TEXT NOT NULL CHECK (card_type IN (
        'skip_card',       -- Skip event without losing streak
        'double_xp',       -- 2x XP for next N events
        'steal_crown',     -- Challenge crown holder
        'revenge_card',    -- Double points vs specific player
        'time_extend',     -- Extra time in events
        'peek_answers'     -- See poll majority before voting
    )),
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Some cards may expire
    uses_remaining INTEGER DEFAULT 1, -- For multi-use cards like double_xp
    source_item_id UUID REFERENCES shop_items(id),
    target_user_id UUID REFERENCES auth.users(id), -- For revenge_card
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wild_cards_user ON user_wild_cards(user_id, used_at);
CREATE INDEX IF NOT EXISTS idx_user_wild_cards_active ON user_wild_cards(user_id)
    WHERE used_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());
CREATE INDEX IF NOT EXISTS idx_user_wild_cards_type ON user_wild_cards(user_id, card_type)
    WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE user_wild_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their wild cards" ON user_wild_cards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can use their wild cards" ON user_wild_cards
    FOR UPDATE USING (user_id = auth.uid() AND used_at IS NULL);

-- Function to grant a wild card
CREATE OR REPLACE FUNCTION grant_wild_card(
    p_user_id UUID,
    p_card_type TEXT,
    p_source_item_id UUID DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_uses INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_card_id UUID;
BEGIN
    INSERT INTO user_wild_cards (
        user_id, card_type, source_item_id,
        expires_at, uses_remaining, metadata
    )
    VALUES (
        p_user_id, p_card_type, p_source_item_id,
        p_expires_at, p_uses, p_metadata
    )
    RETURNING id INTO v_card_id;

    RETURN v_card_id;
END;
$$;

-- Function to use a wild card
CREATE OR REPLACE FUNCTION use_wild_card(
    p_user_id UUID,
    p_card_id UUID,
    p_target_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, card_type TEXT, remaining_uses INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_card user_wild_cards%ROWTYPE;
BEGIN
    -- Get the card
    SELECT * INTO v_card
    FROM user_wild_cards
    WHERE id = p_card_id
        AND user_id = p_user_id
        AND used_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE;

    IF v_card IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, 'Card not found or already used'::TEXT;
        RETURN;
    END IF;

    -- Check if card has uses remaining
    IF v_card.uses_remaining IS NOT NULL AND v_card.uses_remaining <= 0 THEN
        RETURN QUERY SELECT false, v_card.card_type, 0, 'No uses remaining'::TEXT;
        RETURN;
    END IF;

    -- Update the card
    IF v_card.uses_remaining IS NOT NULL AND v_card.uses_remaining > 1 THEN
        -- Multi-use card, decrement uses
        UPDATE user_wild_cards
        SET
            uses_remaining = uses_remaining - 1,
            target_user_id = COALESCE(p_target_user_id, target_user_id),
            metadata = v_card.metadata || p_metadata
        WHERE id = p_card_id;

        RETURN QUERY SELECT true, v_card.card_type, v_card.uses_remaining - 1, NULL::TEXT;
    ELSE
        -- Single use or last use, mark as used
        UPDATE user_wild_cards
        SET
            used_at = NOW(),
            uses_remaining = 0,
            target_user_id = COALESCE(p_target_user_id, target_user_id),
            metadata = v_card.metadata || p_metadata
        WHERE id = p_card_id;

        RETURN QUERY SELECT true, v_card.card_type, 0, NULL::TEXT;
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION grant_wild_card TO authenticated;
GRANT EXECUTE ON FUNCTION use_wild_card TO authenticated;

-- Add wild cards to shop_items
INSERT INTO shop_items (name, name_key, description, description_key, category, price_stars, icon, rarity, is_consumable, uses_per_purchase, sort_order, metadata) VALUES
-- Wild Cards
('Skip Card', 'shop.wildCards.skipCard', 'Skip one event without losing your streak', 'shop.wildCards.skipCardDesc', 'wild_card', 500, 'skip-forward', 'rare', true, 1, 1, '{"card_type": "skip_card"}'::jsonb),
('Double XP', 'shop.wildCards.doubleXP', '2x XP for your next 3 events', 'shop.wildCards.doubleXPDesc', 'wild_card', 300, 'flash', 'common', true, 1, 2, '{"card_type": "double_xp", "uses": 3}'::jsonb),
('Steal Crown', 'shop.wildCards.stealCrown', 'Challenge the crown holder to a head-to-head duel', 'shop.wildCards.stealCrownDesc', 'wild_card', 1000, 'ribbon', 'legendary', true, 1, 3, '{"card_type": "steal_crown"}'::jsonb),
('Revenge Card', 'shop.wildCards.revengeCard', 'Double points when competing against a specific player', 'shop.wildCards.revengeCardDesc', 'wild_card', 400, 'locate', 'rare', true, 1, 4, '{"card_type": "revenge_card"}'::jsonb),
('Time Extend', 'shop.wildCards.timeExtend', '+30 seconds in timed events', 'shop.wildCards.timeExtendDesc', 'wild_card', 250, 'time', 'common', true, 1, 5, '{"card_type": "time_extend"}'::jsonb),
('Peek Answers', 'shop.wildCards.peekAnswers', 'See poll majority before making your vote', 'shop.wildCards.peekAnswersDesc', 'wild_card', 350, 'eye', 'rare', true, 1, 6, '{"card_type": "peek_answers"}'::jsonb);

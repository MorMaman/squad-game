-- Reward Slots System Migration
-- Creates chest-like reward slots that fill up based on activity

-- User reward slots table
CREATE TABLE IF NOT EXISTS user_reward_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 4),
    state TEXT NOT NULL DEFAULT 'empty' CHECK (state IN (
        'empty',      -- No reward
        'filling',    -- Progress being made
        'ready',      -- Ready to claim (timer finished or instant)
        'unlocking',  -- Timer countdown active
        'claimed'     -- Already claimed
    )),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    reward_type TEXT CHECK (reward_type IN ('stars', 'wild_card', 'xp', 'item')),
    reward_amount INTEGER,
    reward_item_id UUID REFERENCES shop_items(id),
    reward_card_type TEXT, -- For wild_card rewards
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    unlocks_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_slot UNIQUE (user_id, slot_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_reward_slots_user ON user_reward_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_slots_state ON user_reward_slots(user_id, state);
CREATE INDEX IF NOT EXISTS idx_user_reward_slots_unlocking ON user_reward_slots(unlocks_at)
    WHERE state = 'unlocking';

-- Enable RLS
ALTER TABLE user_reward_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their reward slots" ON user_reward_slots
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their reward slots" ON user_reward_slots
    FOR UPDATE USING (user_id = auth.uid());

-- Function to initialize reward slots for a user
CREATE OR REPLACE FUNCTION initialize_user_reward_slots(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_reward_slots (user_id, slot_index, state)
    VALUES
        (p_user_id, 0, 'empty'),
        (p_user_id, 1, 'empty'),
        (p_user_id, 2, 'empty'),
        (p_user_id, 3, 'empty')
    ON CONFLICT (user_id, slot_index) DO NOTHING;
END;
$$;

-- Function to add progress to a reward slot
CREATE OR REPLACE FUNCTION add_slot_progress(
    p_user_id UUID,
    p_progress INTEGER
)
RETURNS TABLE(slot_index INTEGER, new_state TEXT, became_ready BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot user_reward_slots%ROWTYPE;
    v_new_progress INTEGER;
    v_became_ready BOOLEAN := false;
    v_reward_type TEXT;
    v_reward_amount INTEGER;
    v_rarity TEXT;
BEGIN
    -- Find the first filling or empty slot
    SELECT * INTO v_slot
    FROM user_reward_slots
    WHERE user_id = p_user_id
        AND state IN ('empty', 'filling')
    ORDER BY slot_index
    LIMIT 1
    FOR UPDATE;

    IF v_slot IS NULL THEN
        -- All slots are full or unlocking
        RETURN;
    END IF;

    v_new_progress := LEAST(100, COALESCE(v_slot.progress, 0) + p_progress);

    IF v_new_progress >= 100 THEN
        -- Generate random reward
        v_rarity := (ARRAY['common', 'common', 'common', 'rare', 'rare', 'epic'])[floor(random() * 6 + 1)];

        -- Determine reward type and amount based on rarity
        CASE v_rarity
            WHEN 'common' THEN
                v_reward_type := (ARRAY['stars', 'stars', 'xp'])[floor(random() * 3 + 1)];
                v_reward_amount := CASE v_reward_type
                    WHEN 'stars' THEN floor(random() * 50 + 25)  -- 25-75 stars
                    WHEN 'xp' THEN floor(random() * 30 + 15)     -- 15-45 XP
                END;
            WHEN 'rare' THEN
                v_reward_type := (ARRAY['stars', 'xp', 'wild_card'])[floor(random() * 3 + 1)];
                v_reward_amount := CASE v_reward_type
                    WHEN 'stars' THEN floor(random() * 100 + 75)  -- 75-175 stars
                    WHEN 'xp' THEN floor(random() * 50 + 30)       -- 30-80 XP
                    ELSE 1
                END;
            WHEN 'epic' THEN
                v_reward_type := (ARRAY['stars', 'wild_card'])[floor(random() * 2 + 1)];
                v_reward_amount := CASE v_reward_type
                    WHEN 'stars' THEN floor(random() * 200 + 150)  -- 150-350 stars
                    ELSE 1
                END;
        END CASE;

        -- Slot is ready for unlocking (4 hour timer)
        UPDATE user_reward_slots
        SET
            state = 'unlocking',
            progress = 100,
            reward_type = v_reward_type,
            reward_amount = v_reward_amount,
            reward_card_type = CASE
                WHEN v_reward_type = 'wild_card' THEN
                    (ARRAY['skip_card', 'double_xp', 'time_extend', 'peek_answers'])[floor(random() * 4 + 1)]
                ELSE NULL
            END,
            rarity = v_rarity,
            unlocks_at = NOW() + INTERVAL '4 hours',
            updated_at = NOW()
        WHERE id = v_slot.id;

        v_became_ready := true;
        RETURN QUERY SELECT v_slot.slot_index, 'unlocking'::TEXT, true;
    ELSE
        -- Update progress
        UPDATE user_reward_slots
        SET
            state = 'filling',
            progress = v_new_progress,
            updated_at = NOW()
        WHERE id = v_slot.id;

        RETURN QUERY SELECT v_slot.slot_index, 'filling'::TEXT, false;
    END IF;
END;
$$;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION claim_reward_slot(
    p_user_id UUID,
    p_squad_id UUID,
    p_slot_index INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    reward_type TEXT,
    reward_amount INTEGER,
    reward_card_type TEXT,
    rarity TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot user_reward_slots%ROWTYPE;
BEGIN
    -- Get the slot
    SELECT * INTO v_slot
    FROM user_reward_slots
    WHERE user_id = p_user_id
        AND slot_index = p_slot_index
    FOR UPDATE;

    IF v_slot IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, 'Slot not found'::TEXT;
        RETURN;
    END IF;

    -- Check if ready to claim (unlocking timer passed or instant)
    IF v_slot.state = 'unlocking' AND v_slot.unlocks_at > NOW() THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, 'Slot still unlocking'::TEXT;
        RETURN;
    END IF;

    IF v_slot.state NOT IN ('ready', 'unlocking') THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::TEXT, NULL::TEXT, 'Slot not ready'::TEXT;
        RETURN;
    END IF;

    -- Award the reward
    CASE v_slot.reward_type
        WHEN 'stars' THEN
            PERFORM award_stars(p_user_id, p_squad_id, v_slot.reward_amount, 'reward_slot', v_slot.id);
        WHEN 'xp' THEN
            UPDATE user_stats
            SET xp_total = xp_total + v_slot.reward_amount
            WHERE user_id = p_user_id AND squad_id = p_squad_id;
        WHEN 'wild_card' THEN
            PERFORM grant_wild_card(p_user_id, v_slot.reward_card_type, NULL, NULL, 1);
    END CASE;

    -- Reset the slot
    UPDATE user_reward_slots
    SET
        state = 'empty',
        progress = 0,
        reward_type = NULL,
        reward_amount = NULL,
        reward_card_type = NULL,
        rarity = 'common',
        unlocks_at = NULL,
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_slot.id;

    RETURN QUERY SELECT true, v_slot.reward_type, v_slot.reward_amount, v_slot.reward_card_type, v_slot.rarity, NULL::TEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_reward_slots TO authenticated;
GRANT EXECUTE ON FUNCTION add_slot_progress TO authenticated;
GRANT EXECUTE ON FUNCTION claim_reward_slot TO authenticated;

-- Trigger to initialize slots when a user joins a squad
CREATE OR REPLACE FUNCTION on_squad_member_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_reward_slots(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_init_reward_slots ON squad_members;
CREATE TRIGGER trigger_init_reward_slots
    AFTER INSERT ON squad_members
    FOR EACH ROW
    EXECUTE FUNCTION on_squad_member_insert();

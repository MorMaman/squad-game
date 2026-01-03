-- ============================================
-- UNDERDOG POWER SYSTEM
-- Migration: 20260103_underdog_powers
-- ============================================

-- ============================================
-- POWER TYPE ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE power_type AS ENUM ('double_chance', 'target_lock', 'chaos_card', 'streak_shield');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USER POWERS TABLE
-- Stores powers granted to users (typically last place finishers)
-- ============================================

CREATE TABLE IF NOT EXISTS user_powers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    power_type power_type NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,  -- NULL until the power is used
    metadata JSONB DEFAULT '{}',  -- For target_lock: target_user_id, chaos_card: rule_name, etc.

    -- Ensure power hasn't been used if we're checking expiration
    CONSTRAINT valid_usage CHECK (used_at IS NULL OR used_at <= expires_at)
);

-- Indexes for user_powers
CREATE INDEX IF NOT EXISTS idx_user_powers_user_squad_expires
    ON user_powers(user_id, squad_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_powers_squad_type_expires
    ON user_powers(squad_id, power_type, expires_at);

-- Index for finding unused, unexpired powers quickly
CREATE INDEX IF NOT EXISTS idx_user_powers_active
    ON user_powers(user_id, squad_id)
    WHERE used_at IS NULL;

-- ============================================
-- ACTIVE TARGETS TABLE
-- Tracks target_lock power usage (who is targeting whom)
-- ============================================

CREATE TABLE IF NOT EXISTS active_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    targeter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    power_id UUID NOT NULL REFERENCES user_powers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Prevent self-targeting
    CONSTRAINT no_self_target CHECK (targeter_id != target_id),

    -- One active target per power
    CONSTRAINT unique_power_target UNIQUE (power_id)
);

-- Indexes for active_targets
CREATE INDEX IF NOT EXISTS idx_active_targets_squad
    ON active_targets(squad_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_active_targets_target
    ON active_targets(target_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_active_targets_targeter
    ON active_targets(targeter_id, squad_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_targets ENABLE ROW LEVEL SECURITY;

-- User Powers Policies

-- Users can view powers in squads they belong to
CREATE POLICY "Users can view powers in their squads" ON user_powers
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- Users can only use (update) their own powers
CREATE POLICY "Users can use their own powers" ON user_powers
    FOR UPDATE USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- System/functions can insert powers (via SECURITY DEFINER functions)
-- No direct user insert policy - powers are granted through functions

-- Active Targets Policies

-- Users can view active targets in their squads
CREATE POLICY "Users can view active targets in their squads" ON active_targets
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- Users can create targets using their own powers
CREATE POLICY "Users can create targets with their powers" ON active_targets
    FOR INSERT WITH CHECK (
        targeter_id = auth.uid()
        AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        AND power_id IN (
            SELECT id FROM user_powers
            WHERE user_id = auth.uid()
            AND power_type = 'target_lock'
            AND used_at IS NULL
            AND expires_at > NOW()
        )
    );

-- ============================================
-- FUNCTION: Award Underdog Power
-- Called after an event is finalized to award a random power to last place
-- ============================================

CREATE OR REPLACE FUNCTION award_underdog_power(p_event_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_last_place_user_id UUID;
    v_squad_id UUID;
    v_power_type power_type;
    v_power_types power_type[] := ARRAY['double_chance', 'target_lock', 'chaos_card', 'streak_shield']::power_type[];
    v_random_index INTEGER;
BEGIN
    -- Get the squad_id for this event
    SELECT squad_id INTO v_squad_id
    FROM daily_events
    WHERE id = p_event_id;

    IF v_squad_id IS NULL THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;

    -- Find the last place participant (highest rank = worst position)
    -- Only consider participants who actually submitted
    SELECT es.user_id INTO v_last_place_user_id
    FROM event_submissions es
    WHERE es.event_id = p_event_id
    AND es.rank IS NOT NULL
    ORDER BY es.rank DESC
    LIMIT 1;

    IF v_last_place_user_id IS NULL THEN
        -- No submissions with ranks found
        RETURN NULL;
    END IF;

    -- Randomly select a power type
    v_random_index := floor(random() * array_length(v_power_types, 1)) + 1;
    v_power_type := v_power_types[v_random_index];

    -- Create the power with 24-hour expiration
    INSERT INTO user_powers (
        user_id,
        squad_id,
        power_type,
        granted_at,
        expires_at,
        metadata
    ) VALUES (
        v_last_place_user_id,
        v_squad_id,
        v_power_type,
        NOW(),
        NOW() + INTERVAL '24 hours',
        jsonb_build_object(
            'source_event_id', p_event_id,
            'awarded_reason', 'last_place_finish'
        )
    );

    RETURN v_power_type::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get a user's active (unused, unexpired) powers in a squad
CREATE OR REPLACE FUNCTION get_active_powers(p_user_id UUID, p_squad_id UUID)
RETURNS TABLE (
    id UUID,
    power_type power_type,
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.power_type,
        up.granted_at,
        up.expires_at,
        up.metadata
    FROM user_powers up
    WHERE up.user_id = p_user_id
    AND up.squad_id = p_squad_id
    AND up.used_at IS NULL
    AND up.expires_at > NOW()
    ORDER BY up.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use a power (mark it as used)
CREATE OR REPLACE FUNCTION use_power(p_power_id UUID, p_metadata JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_power user_powers%ROWTYPE;
BEGIN
    -- Get and lock the power row
    SELECT * INTO v_power
    FROM user_powers
    WHERE id = p_power_id
    FOR UPDATE;

    -- Validate the power exists and belongs to current user
    IF v_power.id IS NULL THEN
        RAISE EXCEPTION 'Power not found: %', p_power_id;
    END IF;

    IF v_power.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Power does not belong to current user';
    END IF;

    -- Check if already used
    IF v_power.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Power has already been used';
    END IF;

    -- Check if expired
    IF v_power.expires_at < NOW() THEN
        RAISE EXCEPTION 'Power has expired';
    END IF;

    -- Mark as used and update metadata if provided
    UPDATE user_powers
    SET
        used_at = NOW(),
        metadata = COALESCE(p_metadata, metadata) || jsonb_build_object('used_timestamp', NOW())
    WHERE id = p_power_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is currently targeted in a squad
CREATE OR REPLACE FUNCTION is_user_targeted(p_user_id UUID, p_squad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM active_targets
        WHERE target_id = p_user_id
        AND squad_id = p_squad_id
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_powers IS 'Stores underdog powers granted to users, typically for finishing last place';
COMMENT ON TABLE active_targets IS 'Tracks target_lock power usage - who is targeting whom';
COMMENT ON FUNCTION award_underdog_power IS 'Awards a random power to the last place finisher of an event';
COMMENT ON FUNCTION get_active_powers IS 'Returns all active (unused, unexpired) powers for a user in a squad';
COMMENT ON FUNCTION use_power IS 'Marks a power as used, with validation';
COMMENT ON FUNCTION is_user_targeted IS 'Checks if a user is currently targeted by a target_lock power';

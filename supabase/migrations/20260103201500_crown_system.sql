-- Crown System Migration
-- First place rewards: crowns, headlines, and rivalries

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CROWN HOLDERS TABLE
-- Tracks who currently has the crown (first place winner)
-- ============================================

CREATE TABLE crown_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    source_event_id UUID REFERENCES daily_events(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- One crown per event
    CONSTRAINT unique_crown_per_event UNIQUE (squad_id, source_event_id)
);

-- Index for active crown lookups
CREATE INDEX idx_crown_holders_squad_expires ON crown_holders(squad_id, expires_at);
CREATE INDEX idx_crown_holders_user_id ON crown_holders(user_id);

-- ============================================
-- HEADLINES TABLE
-- First place can set a headline visible to the squad
-- ============================================

CREATE TABLE headlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    crown_id UUID NOT NULL REFERENCES crown_holders(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Enforce max 50 character limit
    CONSTRAINT headline_max_length CHECK (char_length(content) <= 50),

    -- Ensure content is not empty
    CONSTRAINT headline_not_empty CHECK (char_length(trim(content)) > 0),

    -- Only one headline per crown
    CONSTRAINT unique_headline_per_crown UNIQUE (crown_id)
);

-- Index for active headline lookups
CREATE INDEX idx_headlines_squad_expires ON headlines(squad_id, expires_at);
CREATE INDEX idx_headlines_crown_id ON headlines(crown_id);

-- ============================================
-- ACTIVE RIVALRIES TABLE
-- First place can declare rivalries between two other members
-- ============================================

CREATE TABLE active_rivalries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declarer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rival1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rival2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    crown_id UUID NOT NULL REFERENCES crown_holders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Rivalry rules:
    -- 1. Rivals must be different people
    -- 2. Declarer cannot be one of the rivals
    CONSTRAINT rivalry_different_rivals CHECK (rival1_id != rival2_id),
    CONSTRAINT declarer_not_rival1 CHECK (declarer_id != rival1_id),
    CONSTRAINT declarer_not_rival2 CHECK (declarer_id != rival2_id),

    -- One rivalry declaration per crown
    CONSTRAINT unique_rivalry_per_crown UNIQUE (crown_id)
);

-- Index for active rivalry lookups
CREATE INDEX idx_active_rivalries_squad_expires ON active_rivalries(squad_id, expires_at);
CREATE INDEX idx_active_rivalries_crown_id ON active_rivalries(crown_id);
CREATE INDEX idx_active_rivalries_rivals ON active_rivalries(rival1_id, rival2_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE crown_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_rivalries ENABLE ROW LEVEL SECURITY;

-- Crown Holders policies
CREATE POLICY "Users can view crowns in their squads" ON crown_holders
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- Headlines policies
CREATE POLICY "Users can view headlines in their squads" ON headlines
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Crown holders can create headlines" ON headlines
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND crown_id IN (
            SELECT id FROM crown_holders
            WHERE user_id = auth.uid()
            AND expires_at > NOW()
        )
    );

CREATE POLICY "Crown holders can update their headlines" ON headlines
    FOR UPDATE USING (
        user_id = auth.uid()
        AND crown_id IN (
            SELECT id FROM crown_holders
            WHERE user_id = auth.uid()
            AND expires_at > NOW()
        )
    );

-- Active Rivalries policies
CREATE POLICY "Users can view rivalries in their squads" ON active_rivalries
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Crown holders can declare rivalries" ON active_rivalries
    FOR INSERT WITH CHECK (
        declarer_id = auth.uid()
        AND crown_id IN (
            SELECT id FROM crown_holders
            WHERE user_id = auth.uid()
            AND expires_at > NOW()
        )
        -- Ensure both rivals are in the same squad
        AND rival1_id IN (SELECT user_id FROM squad_members WHERE squad_id = active_rivalries.squad_id)
        AND rival2_id IN (SELECT user_id FROM squad_members WHERE squad_id = active_rivalries.squad_id)
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to award crown to first place finisher
CREATE OR REPLACE FUNCTION award_crown(p_event_id UUID)
RETURNS UUID AS $$
DECLARE
    v_first_place_user_id UUID;
    v_squad_id UUID;
    v_crown_id UUID;
BEGIN
    -- Get the squad_id for this event
    SELECT squad_id INTO v_squad_id
    FROM daily_events
    WHERE id = p_event_id;

    IF v_squad_id IS NULL THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;

    -- Find the first place participant (rank = 1)
    SELECT es.user_id INTO v_first_place_user_id
    FROM event_submissions es
    WHERE es.event_id = p_event_id
    AND es.rank = 1
    LIMIT 1;

    IF v_first_place_user_id IS NULL THEN
        -- No first place found (no submissions or ranks not assigned)
        RETURN NULL;
    END IF;

    -- Check if a crown already exists for this event
    SELECT id INTO v_crown_id
    FROM crown_holders
    WHERE squad_id = v_squad_id
    AND source_event_id = p_event_id;

    IF v_crown_id IS NOT NULL THEN
        -- Crown already awarded for this event
        RETURN v_crown_id;
    END IF;

    -- Create the crown with 24-hour expiration
    INSERT INTO crown_holders (
        user_id,
        squad_id,
        source_event_id,
        granted_at,
        expires_at
    ) VALUES (
        v_first_place_user_id,
        v_squad_id,
        p_event_id,
        NOW(),
        NOW() + INTERVAL '24 hours'
    )
    RETURNING id INTO v_crown_id;

    RETURN v_crown_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active crown holder for a squad
CREATE OR REPLACE FUNCTION get_active_crown_holder(p_squad_id UUID)
RETURNS TABLE (
    crown_id UUID,
    user_id UUID,
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    source_event_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ch.id,
        ch.user_id,
        ch.granted_at,
        ch.expires_at,
        ch.source_event_id
    FROM crown_holders ch
    WHERE ch.squad_id = p_squad_id
    AND ch.expires_at > NOW()
    ORDER BY ch.granted_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active headline for a squad
CREATE OR REPLACE FUNCTION get_active_headline(p_squad_id UUID)
RETURNS TABLE (
    headline_id UUID,
    user_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id,
        h.user_id,
        h.content,
        h.created_at,
        h.expires_at
    FROM headlines h
    WHERE h.squad_id = p_squad_id
    AND h.expires_at > NOW()
    ORDER BY h.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active rivalry for a squad
CREATE OR REPLACE FUNCTION get_active_rivalry(p_squad_id UUID)
RETURNS TABLE (
    rivalry_id UUID,
    declarer_id UUID,
    rival1_id UUID,
    rival2_id UUID,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.declarer_id,
        ar.rival1_id,
        ar.rival2_id,
        ar.created_at,
        ar.expires_at
    FROM active_rivalries ar
    WHERE ar.squad_id = p_squad_id
    AND ar.expires_at > NOW()
    ORDER BY ar.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is crown holder in a squad
CREATE OR REPLACE FUNCTION is_crown_holder(p_user_id UUID, p_squad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM crown_holders
        WHERE user_id = p_user_id
        AND squad_id = p_squad_id
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users are rivals in a squad
CREATE OR REPLACE FUNCTION are_rivals(p_user1_id UUID, p_user2_id UUID, p_squad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM active_rivalries
        WHERE squad_id = p_squad_id
        AND expires_at > NOW()
        AND (
            (rival1_id = p_user1_id AND rival2_id = p_user2_id)
            OR (rival1_id = p_user2_id AND rival2_id = p_user1_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a headline (validates crown ownership)
CREATE OR REPLACE FUNCTION create_headline(
    p_crown_id UUID,
    p_content TEXT
)
RETURNS UUID AS $$
DECLARE
    v_crown crown_holders%ROWTYPE;
    v_headline_id UUID;
BEGIN
    -- Get and validate the crown
    SELECT * INTO v_crown
    FROM crown_holders
    WHERE id = p_crown_id;

    IF v_crown.id IS NULL THEN
        RAISE EXCEPTION 'Crown not found: %', p_crown_id;
    END IF;

    IF v_crown.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Crown does not belong to current user';
    END IF;

    IF v_crown.expires_at < NOW() THEN
        RAISE EXCEPTION 'Crown has expired';
    END IF;

    -- Validate content length
    IF char_length(p_content) > 50 THEN
        RAISE EXCEPTION 'Headline exceeds 50 character limit';
    END IF;

    IF char_length(trim(p_content)) = 0 THEN
        RAISE EXCEPTION 'Headline cannot be empty';
    END IF;

    -- Create or update headline (upsert)
    INSERT INTO headlines (
        user_id,
        squad_id,
        crown_id,
        content,
        expires_at
    ) VALUES (
        v_crown.user_id,
        v_crown.squad_id,
        p_crown_id,
        p_content,
        v_crown.expires_at
    )
    ON CONFLICT (crown_id) DO UPDATE SET
        content = EXCLUDED.content
    RETURNING id INTO v_headline_id;

    RETURN v_headline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to declare a rivalry (validates crown ownership and squad membership)
CREATE OR REPLACE FUNCTION declare_rivalry(
    p_crown_id UUID,
    p_rival1_id UUID,
    p_rival2_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_crown crown_holders%ROWTYPE;
    v_rivalry_id UUID;
BEGIN
    -- Get and validate the crown
    SELECT * INTO v_crown
    FROM crown_holders
    WHERE id = p_crown_id;

    IF v_crown.id IS NULL THEN
        RAISE EXCEPTION 'Crown not found: %', p_crown_id;
    END IF;

    IF v_crown.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Crown does not belong to current user';
    END IF;

    IF v_crown.expires_at < NOW() THEN
        RAISE EXCEPTION 'Crown has expired';
    END IF;

    -- Validate rivalry constraints
    IF p_rival1_id = p_rival2_id THEN
        RAISE EXCEPTION 'Rivals must be different people';
    END IF;

    IF v_crown.user_id = p_rival1_id OR v_crown.user_id = p_rival2_id THEN
        RAISE EXCEPTION 'Crown holder cannot be a rival';
    END IF;

    -- Verify both rivals are in the squad
    IF NOT EXISTS (
        SELECT 1 FROM squad_members
        WHERE squad_id = v_crown.squad_id AND user_id = p_rival1_id
    ) THEN
        RAISE EXCEPTION 'Rival 1 is not a member of this squad';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM squad_members
        WHERE squad_id = v_crown.squad_id AND user_id = p_rival2_id
    ) THEN
        RAISE EXCEPTION 'Rival 2 is not a member of this squad';
    END IF;

    -- Create or update rivalry (upsert)
    INSERT INTO active_rivalries (
        declarer_id,
        rival1_id,
        rival2_id,
        squad_id,
        crown_id,
        expires_at
    ) VALUES (
        v_crown.user_id,
        p_rival1_id,
        p_rival2_id,
        v_crown.squad_id,
        p_crown_id,
        v_crown.expires_at
    )
    ON CONFLICT (crown_id) DO UPDATE SET
        rival1_id = EXCLUDED.rival1_id,
        rival2_id = EXCLUDED.rival2_id
    RETURNING id INTO v_rivalry_id;

    RETURN v_rivalry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

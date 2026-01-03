-- Squad Game Database Schema
-- Daily friend-group game events with leaderboards and anti-cheat resolution

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE event_type AS ENUM ('LIVE_SELFIE', 'PRESSURE_TAP', 'POLL');
CREATE TYPE event_status AS ENUM ('scheduled', 'open', 'closed', 'finalized');
CREATE TYPE member_role AS ENUM ('member', 'admin');
CREATE TYPE power_type AS ENUM ('double_chance', 'target_lock', 'chaos_card', 'streak_shield');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(30) NOT NULL,
    avatar_url TEXT,
    expo_push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SQUADS TABLE
-- ============================================

CREATE TABLE squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(30) NOT NULL,
    invite_code VARCHAR(6) UNIQUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SQUAD MEMBERS TABLE
-- ============================================

CREATE TABLE squad_members (
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (squad_id, user_id)
);

-- ============================================
-- POLL BANK TABLE
-- ============================================

CREATE TABLE poll_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DAILY EVENTS TABLE
-- ============================================

CREATE TABLE daily_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    event_type event_type NOT NULL,
    opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    judge_id UUID REFERENCES profiles(id),
    status event_status DEFAULT 'scheduled',
    poll_question TEXT,
    poll_options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(squad_id, date)
);

-- ============================================
-- EVENT SUBMISSIONS TABLE
-- ============================================

CREATE TABLE event_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES daily_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type event_type NOT NULL,
    payload JSONB DEFAULT '{}',
    media_path TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score NUMERIC,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ============================================
-- EVENT OUTCOMES TABLE
-- ============================================

CREATE TABLE event_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID UNIQUE REFERENCES daily_events(id) ON DELETE CASCADE,
    finalized_by UUID REFERENCES profiles(id),
    payload JSONB DEFAULT '{}',
    finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overturned BOOLEAN DEFAULT false
);

-- ============================================
-- OUTCOME CHALLENGES TABLE
-- ============================================

CREATE TABLE outcome_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES daily_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ============================================
-- USER STATS TABLE
-- ============================================

CREATE TABLE user_stats (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    points_weekly INTEGER DEFAULT 0,
    points_lifetime INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    strikes_14d INTEGER DEFAULT 0,
    last_participation_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, squad_id)
);

-- ============================================
-- USER POWERS TABLE (Underdog Power System)
-- Stores powers granted to users (typically last place finishers)
-- ============================================

CREATE TABLE user_powers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    power_type power_type NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,  -- NULL until the power is used
    metadata JSONB DEFAULT '{}',  -- For target_lock: target_user_id, chaos_card: rule_name, etc.

    -- Ensure power hasn't been used after expiration
    CONSTRAINT valid_usage CHECK (used_at IS NULL OR used_at <= expires_at)
);

-- ============================================
-- ACTIVE TARGETS TABLE (Underdog Power System)
-- Tracks target_lock power usage (who is targeting whom)
-- ============================================

CREATE TABLE active_targets (
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

-- ============================================
-- CROWN HOLDERS TABLE (Crown System)
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

-- ============================================
-- HEADLINES TABLE (Crown System)
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

-- ============================================
-- ACTIVE RIVALRIES TABLE (Crown System)
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_expo_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;
CREATE INDEX idx_squads_invite_code ON squads(invite_code);
CREATE INDEX idx_squad_members_user_id ON squad_members(user_id);
CREATE INDEX idx_squad_members_squad_id ON squad_members(squad_id);
CREATE INDEX idx_daily_events_squad_date ON daily_events(squad_id, date);
CREATE INDEX idx_daily_events_status ON daily_events(status);
CREATE INDEX idx_daily_events_opens_at ON daily_events(opens_at);
CREATE INDEX idx_event_submissions_event_id ON event_submissions(event_id);
CREATE INDEX idx_event_submissions_user_id ON event_submissions(user_id);
CREATE INDEX idx_user_stats_squad_id ON user_stats(squad_id);
CREATE INDEX idx_user_stats_points_weekly ON user_stats(points_weekly DESC);
CREATE INDEX idx_user_stats_streak ON user_stats(streak_count DESC);

-- User Powers Indexes
CREATE INDEX idx_user_powers_user_squad_expires ON user_powers(user_id, squad_id, expires_at);
CREATE INDEX idx_user_powers_squad_type_expires ON user_powers(squad_id, power_type, expires_at);
CREATE INDEX idx_user_powers_active ON user_powers(user_id, squad_id) WHERE used_at IS NULL;

-- Active Targets Indexes
CREATE INDEX idx_active_targets_squad ON active_targets(squad_id, expires_at);
CREATE INDEX idx_active_targets_target ON active_targets(target_id, expires_at);
CREATE INDEX idx_active_targets_targeter ON active_targets(targeter_id, squad_id);

-- Crown System Indexes
CREATE INDEX idx_crown_holders_squad_expires ON crown_holders(squad_id, expires_at);
CREATE INDEX idx_crown_holders_user_id ON crown_holders(user_id);
CREATE INDEX idx_headlines_squad_expires ON headlines(squad_id, expires_at);
CREATE INDEX idx_headlines_crown_id ON headlines(crown_id);
CREATE INDEX idx_active_rivalries_squad_expires ON active_rivalries(squad_id, expires_at);
CREATE INDEX idx_active_rivalries_crown_id ON active_rivalries(crown_id);
CREATE INDEX idx_active_rivalries_rivals ON active_rivalries(rival1_id, rival2_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats on submission
CREATE OR REPLACE FUNCTION update_user_stats_on_submission(
    p_user_id UUID,
    p_squad_id UUID,
    p_points INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
    v_streak INTEGER;
BEGIN
    -- Get current stats
    SELECT last_participation_date, streak_count INTO v_last_date, v_streak
    FROM user_stats
    WHERE user_id = p_user_id AND squad_id = p_squad_id;

    -- Calculate new streak
    IF v_last_date IS NULL OR v_last_date < v_today - 1 THEN
        v_streak := 1;
    ELSIF v_last_date = v_today - 1 THEN
        v_streak := COALESCE(v_streak, 0) + 1;
    END IF;

    -- Update stats
    INSERT INTO user_stats (user_id, squad_id, points_weekly, points_lifetime, streak_count, last_participation_date)
    VALUES (p_user_id, p_squad_id, p_points, p_points, v_streak, v_today)
    ON CONFLICT (user_id, squad_id) DO UPDATE SET
        points_weekly = user_stats.points_weekly + p_points,
        points_lifetime = user_stats.points_lifetime + p_points,
        streak_count = v_streak,
        last_participation_date = v_today,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply missed event penalty
CREATE OR REPLACE FUNCTION apply_missed_event_penalty(
    p_user_id UUID,
    p_squad_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_stats
    SET
        points_weekly = GREATEST(0, points_weekly - 15),
        points_lifetime = GREATEST(0, points_lifetime - 15),
        streak_count = 0,
        strikes_14d = strikes_14d + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND squad_id = p_squad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly points (called by cron)
CREATE OR REPLACE FUNCTION reset_weekly_points()
RETURNS VOID AS $$
BEGIN
    UPDATE user_stats SET points_weekly = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decay old strikes (called by cron)
CREATE OR REPLACE FUNCTION decay_old_strikes()
RETURNS VOID AS $$
BEGIN
    -- Reduce strikes for users who haven't missed recently
    UPDATE user_stats
    SET strikes_14d = GREATEST(0, strikes_14d - 1), updated_at = NOW()
    WHERE strikes_14d > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate PRESSURE_TAP ranks after event closes
CREATE OR REPLACE FUNCTION calculate_pressure_tap_ranks(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score ASC) as rank
        FROM event_submissions
        WHERE event_id = p_event_id AND score IS NOT NULL
    )
    UPDATE event_submissions s
    SET rank = r.rank
    FROM ranked r
    WHERE s.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to select judge for a squad (excludes those who missed last 2 days)
CREATE OR REPLACE FUNCTION select_judge_for_squad(p_squad_id UUID)
RETURNS UUID AS $$
DECLARE
    v_judge_id UUID;
BEGIN
    -- Select a random member who hasn't missed the last 2 days
    SELECT sm.user_id INTO v_judge_id
    FROM squad_members sm
    LEFT JOIN user_stats us ON us.user_id = sm.user_id AND us.squad_id = sm.squad_id
    WHERE sm.squad_id = p_squad_id
    AND (us.strikes_14d IS NULL OR us.strikes_14d < 3)
    ORDER BY RANDOM()
    LIMIT 1;

    -- Fallback to any member if all have strikes
    IF v_judge_id IS NULL THEN
        SELECT user_id INTO v_judge_id
        FROM squad_members
        WHERE squad_id = p_squad_id
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;

    RETURN v_judge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UNDERDOG POWER FUNCTIONS
-- ============================================

-- Function to award a random power to last place finisher
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
-- CROWN SYSTEM FUNCTIONS
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

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_rivalries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Squads policies
CREATE POLICY "Users can view squads they belong to" ON squads
    FOR SELECT USING (
        id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create squads" ON squads
    FOR INSERT WITH CHECK (true);

-- Squad members policies
CREATE POLICY "Users can view members of their squads" ON squad_members
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can join squads" ON squad_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave squads" ON squad_members
    FOR DELETE USING (user_id = auth.uid());

-- Poll bank policies
CREATE POLICY "Anyone can read active polls" ON poll_bank
    FOR SELECT USING (active = true);

-- Daily events policies
CREATE POLICY "Users can view events for their squads" ON daily_events
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- Event submissions policies
CREATE POLICY "Users can view own submissions anytime" ON event_submissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view submissions after event closes" ON event_submissions
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM daily_events
            WHERE status IN ('closed', 'finalized')
            AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can submit to open events" ON event_submissions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND event_id IN (
            SELECT id FROM daily_events
            WHERE status = 'open'
            AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

-- Event outcomes policies
CREATE POLICY "Users can view outcomes for their squad events" ON event_outcomes
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM daily_events
            WHERE squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Judges can create outcomes" ON event_outcomes
    FOR INSERT WITH CHECK (
        finalized_by = auth.uid()
        AND event_id IN (
            SELECT id FROM daily_events
            WHERE judge_id = auth.uid()
            AND status = 'closed'
        )
    );

-- Outcome challenges policies
CREATE POLICY "Users can view challenges for their squad events" ON outcome_challenges
    FOR SELECT USING (
        event_id IN (
            SELECT de.id FROM daily_events de
            WHERE de.squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can challenge outcomes" ON outcome_challenges
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND event_id IN (
            SELECT de.id FROM daily_events de
            WHERE de.squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

-- User stats policies
CREATE POLICY "Users can view stats for their squads" ON user_stats
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Powers policies
CREATE POLICY "Users can view powers in their squads" ON user_powers
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can use their own powers" ON user_powers
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Active Targets policies
CREATE POLICY "Users can view active targets in their squads" ON active_targets
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

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
-- STORAGE BUCKET
-- ============================================

-- Run this in Supabase Dashboard -> Storage -> Create new bucket
-- Name: event-media
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png

-- Storage policies (run in SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', false);

-- CREATE POLICY "Users can upload to their submission paths"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'event-media'
--     AND auth.uid()::text = (storage.foldername(name))[2]
-- );

-- CREATE POLICY "Users can view media for closed events"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'event-media'
--     AND (storage.foldername(name))[1] IN (
--         SELECT id::text FROM daily_events
--         WHERE status IN ('closed', 'finalized')
--         AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
--     )
-- );

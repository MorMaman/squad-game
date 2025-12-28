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

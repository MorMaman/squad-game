-- ============================================
-- JUDGE AND POWERS SYSTEM
-- Migration: 20260104_judge_powers_system
--
-- This migration adds comprehensive tracking for:
-- 1. Daily judge assignments and their outcomes
-- 2. Challenges against judge decisions and power activations
-- 3. Challenge voting system
-- 4. Power activation history and cancellation tracking
-- 5. Participation insurance for minimum rewards
-- 6. Comeback boost eligibility for struggling players
-- 7. Leader pressure balancing mechanics
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

-- Challenge type enum
DO $$ BEGIN
    CREATE TYPE challenge_type AS ENUM ('judge_decision', 'power_activation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Challenge status enum
DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('active', 'passed', 'failed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Challenge vote enum
DO $$ BEGIN
    CREATE TYPE challenge_vote AS ENUM ('for', 'against');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pressure level enum for anti-runaway balancing
DO $$ BEGIN
    CREATE TYPE pressure_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1. SQUAD JUDGES TABLE
-- Track daily judge assignments and their performance
-- ============================================

CREATE TABLE IF NOT EXISTS squad_judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    judge_date DATE NOT NULL,
    event_id UUID REFERENCES daily_events(id) ON DELETE SET NULL,

    -- Judge performance tracking
    bonus_earned INTEGER DEFAULT 0,           -- Stars earned if no successful challenges
    penalty_applied INTEGER DEFAULT 0,        -- Penalty if decision was overturned
    is_overturned BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One judge per squad per day
    CONSTRAINT unique_squad_judge_per_day UNIQUE (squad_id, judge_date)
);

-- Indexes for squad_judges
CREATE INDEX IF NOT EXISTS idx_squad_judges_squad_date
    ON squad_judges(squad_id, judge_date DESC);
CREATE INDEX IF NOT EXISTS idx_squad_judges_user
    ON squad_judges(user_id, judge_date DESC);
CREATE INDEX IF NOT EXISTS idx_squad_judges_event
    ON squad_judges(event_id);
CREATE INDEX IF NOT EXISTS idx_squad_judges_overturned
    ON squad_judges(squad_id, is_overturned) WHERE is_overturned = true;

-- ============================================
-- 2. CHALLENGES TABLE
-- Track active and past challenges against decisions/powers
-- ============================================

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What is being challenged
    challenge_type challenge_type NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Judge or power user
    related_power_id UUID REFERENCES user_powers(id) ON DELETE SET NULL,
    related_event_id UUID REFERENCES daily_events(id) ON DELETE SET NULL,

    -- Challenge reason/description
    reason TEXT,

    -- Voting mechanics
    votes_for INTEGER NOT NULL DEFAULT 0,
    votes_against INTEGER NOT NULL DEFAULT 0,
    votes_needed INTEGER NOT NULL DEFAULT 2,   -- Majority threshold for challenge to pass
    total_eligible_voters INTEGER NOT NULL DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,

    -- Status and result
    status challenge_status NOT NULL DEFAULT 'active',
    result_applied BOOLEAN NOT NULL DEFAULT false,

    -- Metadata for audit trail
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate active challenges on same target
    CONSTRAINT unique_active_challenge UNIQUE (squad_id, challenge_type, related_event_id, related_power_id)
);

-- Indexes for challenges
CREATE INDEX IF NOT EXISTS idx_challenges_squad_status
    ON challenges(squad_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger
    ON challenges(challenger_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_target_user
    ON challenges(target_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active
    ON challenges(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_challenges_event
    ON challenges(related_event_id);
CREATE INDEX IF NOT EXISTS idx_challenges_power
    ON challenges(related_power_id);

-- ============================================
-- 3. CHALLENGE VOTES TABLE
-- Individual votes on challenges
-- ============================================

CREATE TABLE IF NOT EXISTS challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote challenge_vote NOT NULL,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Optional reason for vote
    reason TEXT,

    -- One vote per user per challenge
    CONSTRAINT unique_vote_per_user UNIQUE (challenge_id, user_id)
);

-- Indexes for challenge_votes
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge
    ON challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_user
    ON challenge_votes(user_id, voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_result
    ON challenge_votes(challenge_id, vote);

-- ============================================
-- 4. POWER ACTIVATIONS TABLE
-- Complete log of all power usage for history and auditing
-- ============================================

CREATE TABLE IF NOT EXISTS power_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    power_id UUID REFERENCES user_powers(id) ON DELETE SET NULL,
    power_type power_type NOT NULL,

    -- Who activated and who was affected
    activated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affected_users UUID[] DEFAULT '{}',  -- Array of user IDs affected by the power

    -- Related event (for context)
    event_id UUID REFERENCES daily_events(id) ON DELETE SET NULL,

    -- Timing
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Cancellation tracking
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancel_reason TEXT,

    -- Challenge outcome tracking
    was_challenged BOOLEAN NOT NULL DEFAULT false,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    challenge_result challenge_status,

    -- Metadata for power-specific details
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for power_activations
CREATE INDEX IF NOT EXISTS idx_power_activations_squad
    ON power_activations(squad_id, activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_activations_user
    ON power_activations(activated_by, activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_activations_type
    ON power_activations(power_type, activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_activations_event
    ON power_activations(event_id);
CREATE INDEX IF NOT EXISTS idx_power_activations_challenged
    ON power_activations(was_challenged) WHERE was_challenged = true;
CREATE INDEX IF NOT EXISTS idx_power_activations_active
    ON power_activations(squad_id, expires_at)
    WHERE cancelled_at IS NULL AND expires_at > NOW();

-- GIN index for affected_users array queries
CREATE INDEX IF NOT EXISTS idx_power_activations_affected_users
    ON power_activations USING GIN (affected_users);

-- ============================================
-- 5. USER PARTICIPATION INSURANCE TABLE
-- Track insurance eligibility for minimum reward guarantees
-- ============================================

CREATE TABLE IF NOT EXISTS user_participation_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES daily_events(id) ON DELETE CASCADE,

    -- Insurance status
    qualified BOOLEAN NOT NULL DEFAULT false,  -- Did they qualify for insurance payout?
    minimum_reward INTEGER NOT NULL DEFAULT 0, -- Guaranteed minimum stars/points
    actual_reward INTEGER DEFAULT 0,           -- What they actually earned
    insurance_payout INTEGER DEFAULT 0,        -- Difference if actual < minimum

    -- Qualification criteria tracking
    participated BOOLEAN NOT NULL DEFAULT false,
    streak_requirement_met BOOLEAN DEFAULT false,
    streak_count INTEGER DEFAULT 0,

    -- Timing
    checked_at TIMESTAMPTZ,
    paid_out_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One insurance record per user per event
    CONSTRAINT unique_insurance_per_event UNIQUE (user_id, event_id)
);

-- Indexes for user_participation_insurance
CREATE INDEX IF NOT EXISTS idx_participation_insurance_user_squad
    ON user_participation_insurance(user_id, squad_id);
CREATE INDEX IF NOT EXISTS idx_participation_insurance_event
    ON user_participation_insurance(event_id);
CREATE INDEX IF NOT EXISTS idx_participation_insurance_qualified
    ON user_participation_insurance(user_id, qualified) WHERE qualified = true;
CREATE INDEX IF NOT EXISTS idx_participation_insurance_pending
    ON user_participation_insurance(checked_at) WHERE paid_out_at IS NULL AND qualified = true;

-- ============================================
-- 6. USER COMEBACK STATUS TABLE
-- Track comeback boost eligibility for struggling players
-- ============================================

CREATE TABLE IF NOT EXISTS user_comeback_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,

    -- Comeback status
    is_active BOOLEAN NOT NULL DEFAULT false,
    triggered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Boost details
    bonus_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,  -- e.g., 1.5 for 50% bonus
    events_remaining INTEGER DEFAULT 0,                   -- Number of events boost applies to

    -- Trigger criteria tracking
    consecutive_losses INTEGER DEFAULT 0,
    current_rank INTEGER,
    rank_percentile NUMERIC(5,2),  -- e.g., 90.0 means bottom 10%

    -- History
    times_triggered INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One comeback status per user per squad
    CONSTRAINT unique_comeback_per_squad UNIQUE (user_id, squad_id)
);

-- Indexes for user_comeback_status
CREATE INDEX IF NOT EXISTS idx_comeback_status_user
    ON user_comeback_status(user_id);
CREATE INDEX IF NOT EXISTS idx_comeback_status_squad
    ON user_comeback_status(squad_id);
CREATE INDEX IF NOT EXISTS idx_comeback_status_active
    ON user_comeback_status(squad_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_comeback_status_expires
    ON user_comeback_status(expires_at) WHERE is_active = true;

-- ============================================
-- 7. LEADER PRESSURE STATUS TABLE
-- Track anti-runaway balancing for leading players
-- ============================================

CREATE TABLE IF NOT EXISTS leader_pressure_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Pressure status
    is_active BOOLEAN NOT NULL DEFAULT false,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    pressure_level pressure_level NOT NULL DEFAULT 'low',

    -- Lead tracking
    current_lead_points INTEGER DEFAULT 0,      -- Point difference from 2nd place
    lead_percentage NUMERIC(5,2) DEFAULT 0,     -- Lead as percentage of 2nd place score
    consecutive_wins INTEGER DEFAULT 0,

    -- Pressure effects (stored for reference)
    point_reduction_percent NUMERIC(5,2) DEFAULT 0,  -- Reduced points for 1st place
    target_bonus_percent NUMERIC(5,2) DEFAULT 0,     -- Bonus for beating the leader

    -- History
    times_activated INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One pressure status per user per squad
    CONSTRAINT unique_pressure_per_squad UNIQUE (user_id, squad_id)
);

-- Indexes for leader_pressure_status
CREATE INDEX IF NOT EXISTS idx_leader_pressure_squad
    ON leader_pressure_status(squad_id);
CREATE INDEX IF NOT EXISTS idx_leader_pressure_user
    ON leader_pressure_status(user_id);
CREATE INDEX IF NOT EXISTS idx_leader_pressure_active
    ON leader_pressure_status(squad_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leader_pressure_level
    ON leader_pressure_status(squad_id, pressure_level) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE squad_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_participation_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_comeback_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_pressure_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SQUAD JUDGES POLICIES
-- ============================================

CREATE POLICY "Users can view judges in their squads" ON squad_judges
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert judges" ON squad_judges
    FOR INSERT WITH CHECK (
        -- Only allow through functions or if user is squad admin
        squad_id IN (
            SELECT squad_id FROM squad_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can update judge status" ON squad_judges
    FOR UPDATE USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- ============================================
-- CHALLENGES POLICIES
-- ============================================

CREATE POLICY "Users can view challenges in their squads" ON challenges
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Squad members can create challenges" ON challenges
    FOR INSERT WITH CHECK (
        challenger_id = auth.uid()
        AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        -- Cannot challenge yourself
        AND target_user_id != auth.uid()
    );

-- No direct update policy - updates through functions only

-- ============================================
-- CHALLENGE VOTES POLICIES
-- ============================================

CREATE POLICY "Users can view votes on challenges in their squads" ON challenge_votes
    FOR SELECT USING (
        challenge_id IN (
            SELECT id FROM challenges
            WHERE squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Squad members can vote on active challenges" ON challenge_votes
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND challenge_id IN (
            SELECT id FROM challenges
            WHERE status = 'active'
            AND expires_at > NOW()
            AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
            -- Cannot vote on your own challenge or if you're the target
            AND challenger_id != auth.uid()
            AND (target_user_id IS NULL OR target_user_id != auth.uid())
        )
    );

-- ============================================
-- POWER ACTIVATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view power activations in their squads" ON power_activations
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can log their own power activations" ON power_activations
    FOR INSERT WITH CHECK (
        activated_by = auth.uid()
        AND squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- ============================================
-- PARTICIPATION INSURANCE POLICIES
-- ============================================

CREATE POLICY "Users can view their own insurance records" ON user_participation_insurance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view insurance for squad events" ON user_participation_insurance
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- ============================================
-- COMEBACK STATUS POLICIES
-- ============================================

CREATE POLICY "Users can view their own comeback status" ON user_comeback_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view comeback status in their squads" ON user_comeback_status
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- ============================================
-- LEADER PRESSURE POLICIES
-- ============================================

CREATE POLICY "Users can view leader pressure in their squads" ON leader_pressure_status
    FOR SELECT USING (
        squad_id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create a challenge
CREATE OR REPLACE FUNCTION create_challenge(
    p_squad_id UUID,
    p_challenge_type challenge_type,
    p_target_user_id UUID DEFAULT NULL,
    p_related_event_id UUID DEFAULT NULL,
    p_related_power_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_duration_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    v_challenge_id UUID;
    v_eligible_voters INTEGER;
    v_votes_needed INTEGER;
BEGIN
    -- Verify challenger is in the squad
    IF NOT EXISTS (
        SELECT 1 FROM squad_members
        WHERE squad_id = p_squad_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are not a member of this squad';
    END IF;

    -- Cannot challenge yourself
    IF p_target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot challenge yourself';
    END IF;

    -- Count eligible voters (squad members minus challenger and target)
    SELECT COUNT(*) INTO v_eligible_voters
    FROM squad_members
    WHERE squad_id = p_squad_id
    AND user_id NOT IN (auth.uid(), COALESCE(p_target_user_id, '00000000-0000-0000-0000-000000000000'::UUID));

    -- Need majority to pass (at least half + 1)
    v_votes_needed := CEIL(v_eligible_voters::NUMERIC / 2);

    -- Create the challenge
    INSERT INTO challenges (
        squad_id,
        challenger_id,
        challenge_type,
        target_user_id,
        related_event_id,
        related_power_id,
        reason,
        votes_needed,
        total_eligible_voters,
        expires_at
    ) VALUES (
        p_squad_id,
        auth.uid(),
        p_challenge_type,
        p_target_user_id,
        p_related_event_id,
        p_related_power_id,
        p_reason,
        v_votes_needed,
        v_eligible_voters,
        NOW() + (p_duration_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_challenge_id;

    RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cast a vote on a challenge
CREATE OR REPLACE FUNCTION cast_challenge_vote(
    p_challenge_id UUID,
    p_vote challenge_vote,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    new_votes_for INTEGER,
    new_votes_against INTEGER,
    challenge_resolved BOOLEAN,
    final_status challenge_status
) AS $$
DECLARE
    v_challenge challenges%ROWTYPE;
    v_votes_for INTEGER;
    v_votes_against INTEGER;
    v_resolved BOOLEAN := false;
    v_final_status challenge_status;
BEGIN
    -- Get and lock the challenge
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id
    FOR UPDATE;

    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Challenge not found';
    END IF;

    -- Verify challenge is still active
    IF v_challenge.status != 'active' THEN
        RAISE EXCEPTION 'Challenge is no longer active';
    END IF;

    IF v_challenge.expires_at < NOW() THEN
        RAISE EXCEPTION 'Challenge has expired';
    END IF;

    -- Verify voter is eligible
    IF NOT EXISTS (
        SELECT 1 FROM squad_members
        WHERE squad_id = v_challenge.squad_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are not a member of this squad';
    END IF;

    IF v_challenge.challenger_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot vote on your own challenge';
    END IF;

    IF v_challenge.target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot vote on a challenge targeting you';
    END IF;

    -- Insert the vote
    INSERT INTO challenge_votes (challenge_id, user_id, vote, reason)
    VALUES (p_challenge_id, auth.uid(), p_vote, p_reason);

    -- Update vote counts
    SELECT
        COALESCE(SUM(CASE WHEN vote = 'for' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN vote = 'against' THEN 1 ELSE 0 END), 0)
    INTO v_votes_for, v_votes_against
    FROM challenge_votes
    WHERE challenge_id = p_challenge_id;

    -- Update the challenge with new counts
    UPDATE challenges
    SET
        votes_for = v_votes_for,
        votes_against = v_votes_against,
        updated_at = NOW()
    WHERE id = p_challenge_id;

    -- Check if challenge should be resolved
    IF v_votes_for >= v_challenge.votes_needed THEN
        -- Challenge passed
        v_resolved := true;
        v_final_status := 'passed';

        UPDATE challenges
        SET
            status = 'passed',
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_challenge_id;

    ELSIF v_votes_against >= v_challenge.votes_needed THEN
        -- Challenge failed
        v_resolved := true;
        v_final_status := 'failed';

        UPDATE challenges
        SET
            status = 'failed',
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_challenge_id;
    ELSE
        v_final_status := 'active';
    END IF;

    RETURN QUERY SELECT true, v_votes_for, v_votes_against, v_resolved, v_final_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old challenges (called by cron)
CREATE OR REPLACE FUNCTION expire_old_challenges()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE challenges
    SET
        status = 'expired',
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE status = 'active'
    AND expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign daily judge
CREATE OR REPLACE FUNCTION assign_daily_judge(
    p_squad_id UUID,
    p_judge_date DATE DEFAULT CURRENT_DATE,
    p_event_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_judge_id UUID;
    v_record_id UUID;
BEGIN
    -- Check if judge already assigned for this date
    SELECT user_id INTO v_judge_id
    FROM squad_judges
    WHERE squad_id = p_squad_id AND judge_date = p_judge_date;

    IF v_judge_id IS NOT NULL THEN
        RETURN v_judge_id;
    END IF;

    -- Select judge using existing function
    v_judge_id := select_judge_for_squad(p_squad_id);

    IF v_judge_id IS NULL THEN
        RAISE EXCEPTION 'No eligible judge found for squad';
    END IF;

    -- Create judge record
    INSERT INTO squad_judges (squad_id, user_id, judge_date, event_id)
    VALUES (p_squad_id, v_judge_id, p_judge_date, p_event_id)
    RETURNING id INTO v_record_id;

    RETURN v_judge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log power activation
CREATE OR REPLACE FUNCTION log_power_activation(
    p_power_id UUID,
    p_affected_users UUID[] DEFAULT '{}',
    p_event_id UUID DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_power user_powers%ROWTYPE;
    v_activation_id UUID;
BEGIN
    -- Get the power
    SELECT * INTO v_power
    FROM user_powers
    WHERE id = p_power_id;

    IF v_power.id IS NULL THEN
        RAISE EXCEPTION 'Power not found';
    END IF;

    IF v_power.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Power does not belong to current user';
    END IF;

    -- Log the activation
    INSERT INTO power_activations (
        squad_id,
        power_id,
        power_type,
        activated_by,
        affected_users,
        event_id,
        expires_at,
        metadata
    ) VALUES (
        v_power.squad_id,
        p_power_id,
        v_power.power_type,
        auth.uid(),
        p_affected_users,
        p_event_id,
        COALESCE(p_expires_at, v_power.expires_at),
        p_metadata
    )
    RETURNING id INTO v_activation_id;

    RETURN v_activation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check/update comeback status
CREATE OR REPLACE FUNCTION check_comeback_eligibility(
    p_user_id UUID,
    p_squad_id UUID
)
RETURNS TABLE(
    is_eligible BOOLEAN,
    bonus_multiplier NUMERIC,
    events_remaining INTEGER
) AS $$
DECLARE
    v_consecutive_losses INTEGER;
    v_current_rank INTEGER;
    v_total_members INTEGER;
    v_rank_percentile NUMERIC;
    v_multiplier NUMERIC := 1.0;
    v_events INTEGER := 0;
    v_is_eligible BOOLEAN := false;
BEGIN
    -- Get user's recent performance
    SELECT COUNT(*) INTO v_consecutive_losses
    FROM (
        SELECT es.rank
        FROM event_submissions es
        JOIN daily_events de ON de.id = es.event_id
        WHERE es.user_id = p_user_id
        AND de.squad_id = p_squad_id
        AND de.status = 'finalized'
        ORDER BY de.date DESC
        LIMIT 3
    ) recent
    WHERE rank > 2; -- Not in top 2

    -- Get current leaderboard position
    SELECT
        RANK() OVER (ORDER BY points_weekly DESC),
        COUNT(*) OVER ()
    INTO v_current_rank, v_total_members
    FROM user_stats
    WHERE squad_id = p_squad_id AND user_id = p_user_id;

    v_rank_percentile := (v_current_rank::NUMERIC / NULLIF(v_total_members, 0)) * 100;

    -- Determine eligibility and bonus
    IF v_consecutive_losses >= 3 OR v_rank_percentile >= 80 THEN
        v_is_eligible := true;

        IF v_consecutive_losses >= 5 OR v_rank_percentile >= 90 THEN
            v_multiplier := 1.5;  -- 50% bonus for severely struggling
            v_events := 3;
        ELSE
            v_multiplier := 1.25; -- 25% bonus for moderately struggling
            v_events := 2;
        END IF;
    END IF;

    -- Update or insert comeback status
    INSERT INTO user_comeback_status (
        user_id, squad_id, is_active, triggered_at, expires_at,
        bonus_multiplier, events_remaining, consecutive_losses,
        current_rank, rank_percentile, times_triggered, last_triggered_at
    ) VALUES (
        p_user_id, p_squad_id, v_is_eligible,
        CASE WHEN v_is_eligible THEN NOW() ELSE NULL END,
        CASE WHEN v_is_eligible THEN NOW() + INTERVAL '7 days' ELSE NULL END,
        v_multiplier, v_events, v_consecutive_losses,
        v_current_rank, v_rank_percentile,
        CASE WHEN v_is_eligible THEN 1 ELSE 0 END,
        CASE WHEN v_is_eligible THEN NOW() ELSE NULL END
    )
    ON CONFLICT (user_id, squad_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        triggered_at = CASE WHEN EXCLUDED.is_active AND NOT user_comeback_status.is_active
                       THEN NOW() ELSE user_comeback_status.triggered_at END,
        expires_at = EXCLUDED.expires_at,
        bonus_multiplier = EXCLUDED.bonus_multiplier,
        events_remaining = EXCLUDED.events_remaining,
        consecutive_losses = EXCLUDED.consecutive_losses,
        current_rank = EXCLUDED.current_rank,
        rank_percentile = EXCLUDED.rank_percentile,
        times_triggered = CASE WHEN EXCLUDED.is_active AND NOT user_comeback_status.is_active
                         THEN user_comeback_status.times_triggered + 1
                         ELSE user_comeback_status.times_triggered END,
        last_triggered_at = CASE WHEN EXCLUDED.is_active AND NOT user_comeback_status.is_active
                           THEN NOW() ELSE user_comeback_status.last_triggered_at END,
        updated_at = NOW();

    RETURN QUERY SELECT v_is_eligible, v_multiplier, v_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check/update leader pressure
CREATE OR REPLACE FUNCTION check_leader_pressure(
    p_squad_id UUID
)
RETURNS TABLE(
    leader_id UUID,
    pressure_active BOOLEAN,
    pressure_lvl pressure_level,
    point_reduction NUMERIC
) AS $$
DECLARE
    v_leader_id UUID;
    v_leader_points INTEGER;
    v_second_points INTEGER;
    v_lead_diff INTEGER;
    v_lead_pct NUMERIC;
    v_consecutive_wins INTEGER;
    v_pressure pressure_level := 'low';
    v_is_active BOOLEAN := false;
    v_reduction NUMERIC := 0;
BEGIN
    -- Get top 2 players
    SELECT user_id, points_weekly INTO v_leader_id, v_leader_points
    FROM user_stats
    WHERE squad_id = p_squad_id
    ORDER BY points_weekly DESC
    LIMIT 1;

    SELECT points_weekly INTO v_second_points
    FROM user_stats
    WHERE squad_id = p_squad_id
    ORDER BY points_weekly DESC
    OFFSET 1 LIMIT 1;

    IF v_leader_id IS NULL OR v_second_points IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, false, 'low'::pressure_level, 0::NUMERIC;
        RETURN;
    END IF;

    v_lead_diff := v_leader_points - COALESCE(v_second_points, 0);
    v_lead_pct := CASE WHEN v_second_points > 0
                  THEN (v_lead_diff::NUMERIC / v_second_points) * 100
                  ELSE 100 END;

    -- Count consecutive first place finishes
    SELECT COUNT(*) INTO v_consecutive_wins
    FROM (
        SELECT es.user_id
        FROM event_submissions es
        JOIN daily_events de ON de.id = es.event_id
        WHERE de.squad_id = p_squad_id
        AND de.status = 'finalized'
        AND es.rank = 1
        ORDER BY de.date DESC
        LIMIT 5
    ) recent
    WHERE user_id = v_leader_id;

    -- Determine pressure level
    IF v_lead_pct >= 50 OR v_consecutive_wins >= 5 THEN
        v_pressure := 'high';
        v_is_active := true;
        v_reduction := 15;
    ELSIF v_lead_pct >= 25 OR v_consecutive_wins >= 3 THEN
        v_pressure := 'medium';
        v_is_active := true;
        v_reduction := 10;
    ELSIF v_lead_pct >= 15 OR v_consecutive_wins >= 2 THEN
        v_pressure := 'low';
        v_is_active := true;
        v_reduction := 5;
    END IF;

    -- Update leader pressure status
    INSERT INTO leader_pressure_status (
        squad_id, user_id, is_active, activated_at, pressure_level,
        current_lead_points, lead_percentage, consecutive_wins,
        point_reduction_percent, target_bonus_percent, times_activated
    ) VALUES (
        p_squad_id, v_leader_id, v_is_active,
        CASE WHEN v_is_active THEN NOW() ELSE NULL END,
        v_pressure, v_lead_diff, v_lead_pct, v_consecutive_wins,
        v_reduction, v_reduction / 2, -- Half the reduction as bonus for others
        CASE WHEN v_is_active THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, squad_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        activated_at = CASE WHEN EXCLUDED.is_active AND NOT leader_pressure_status.is_active
                       THEN NOW() ELSE leader_pressure_status.activated_at END,
        deactivated_at = CASE WHEN NOT EXCLUDED.is_active AND leader_pressure_status.is_active
                         THEN NOW() ELSE NULL END,
        pressure_level = EXCLUDED.pressure_level,
        current_lead_points = EXCLUDED.current_lead_points,
        lead_percentage = EXCLUDED.lead_percentage,
        consecutive_wins = EXCLUDED.consecutive_wins,
        point_reduction_percent = EXCLUDED.point_reduction_percent,
        target_bonus_percent = EXCLUDED.target_bonus_percent,
        times_activated = CASE WHEN EXCLUDED.is_active AND NOT leader_pressure_status.is_active
                         THEN leader_pressure_status.times_activated + 1
                         ELSE leader_pressure_status.times_activated END,
        updated_at = NOW();

    RETURN QUERY SELECT v_leader_id, v_is_active, v_pressure, v_reduction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply challenge result to judge
CREATE OR REPLACE FUNCTION apply_judge_challenge_result(
    p_challenge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_challenge challenges%ROWTYPE;
    v_penalty INTEGER := 25; -- Stars penalty for overturned decision
    v_bonus INTEGER := 10;   -- Stars bonus for upheld decision
BEGIN
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id
    AND challenge_type = 'judge_decision';

    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Judge challenge not found';
    END IF;

    IF v_challenge.result_applied THEN
        RETURN false; -- Already applied
    END IF;

    IF v_challenge.status = 'passed' THEN
        -- Challenge passed - judge decision overturned
        UPDATE squad_judges
        SET
            is_overturned = true,
            penalty_applied = v_penalty,
            updated_at = NOW()
        WHERE event_id = v_challenge.related_event_id
        AND user_id = v_challenge.target_user_id;

        -- Apply star penalty to judge (if stars system exists)
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_stats' AND column_name = 'stars') THEN
            UPDATE user_stats
            SET stars = GREATEST(0, stars - v_penalty)
            WHERE user_id = v_challenge.target_user_id
            AND squad_id = v_challenge.squad_id;
        END IF;

    ELSIF v_challenge.status = 'failed' THEN
        -- Challenge failed - judge decision upheld
        UPDATE squad_judges
        SET
            bonus_earned = v_bonus,
            updated_at = NOW()
        WHERE event_id = v_challenge.related_event_id
        AND user_id = v_challenge.target_user_id;

        -- Award bonus stars to judge
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_stats' AND column_name = 'stars') THEN
            UPDATE user_stats
            SET stars = stars + v_bonus
            WHERE user_id = v_challenge.target_user_id
            AND squad_id = v_challenge.squad_id;
        END IF;
    END IF;

    -- Mark result as applied
    UPDATE challenges
    SET result_applied = true, updated_at = NOW()
    WHERE id = p_challenge_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_judge_powers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_squad_judges_updated_at ON squad_judges;
CREATE TRIGGER trigger_squad_judges_updated_at
    BEFORE UPDATE ON squad_judges
    FOR EACH ROW EXECUTE FUNCTION update_judge_powers_updated_at();

DROP TRIGGER IF EXISTS trigger_challenges_updated_at ON challenges;
CREATE TRIGGER trigger_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_judge_powers_updated_at();

DROP TRIGGER IF EXISTS trigger_insurance_updated_at ON user_participation_insurance;
CREATE TRIGGER trigger_insurance_updated_at
    BEFORE UPDATE ON user_participation_insurance
    FOR EACH ROW EXECUTE FUNCTION update_judge_powers_updated_at();

DROP TRIGGER IF EXISTS trigger_comeback_updated_at ON user_comeback_status;
CREATE TRIGGER trigger_comeback_updated_at
    BEFORE UPDATE ON user_comeback_status
    FOR EACH ROW EXECUTE FUNCTION update_judge_powers_updated_at();

DROP TRIGGER IF EXISTS trigger_pressure_updated_at ON leader_pressure_status;
CREATE TRIGGER trigger_pressure_updated_at
    BEFORE UPDATE ON leader_pressure_status
    FOR EACH ROW EXECUTE FUNCTION update_judge_powers_updated_at();

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION create_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION cast_challenge_vote TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_challenges TO authenticated;
GRANT EXECUTE ON FUNCTION assign_daily_judge TO authenticated;
GRANT EXECUTE ON FUNCTION log_power_activation TO authenticated;
GRANT EXECUTE ON FUNCTION check_comeback_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION check_leader_pressure TO authenticated;
GRANT EXECUTE ON FUNCTION apply_judge_challenge_result TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE squad_judges IS 'Daily judge assignments with performance tracking (bonuses/penalties)';
COMMENT ON TABLE challenges IS 'Active and historical challenges against judge decisions and power activations';
COMMENT ON TABLE challenge_votes IS 'Individual votes cast on challenges by squad members';
COMMENT ON TABLE power_activations IS 'Complete audit log of all power usage with cancellation tracking';
COMMENT ON TABLE user_participation_insurance IS 'Minimum reward guarantees for qualifying participants';
COMMENT ON TABLE user_comeback_status IS 'Comeback boost eligibility for struggling players';
COMMENT ON TABLE leader_pressure_status IS 'Anti-runaway mechanics to balance leading players';

COMMENT ON FUNCTION create_challenge IS 'Create a new challenge against a judge decision or power activation';
COMMENT ON FUNCTION cast_challenge_vote IS 'Cast a vote for or against an active challenge';
COMMENT ON FUNCTION expire_old_challenges IS 'Mark expired challenges as expired (run via cron)';
COMMENT ON FUNCTION assign_daily_judge IS 'Assign a daily judge for a squad';
COMMENT ON FUNCTION log_power_activation IS 'Log a power activation for audit trail';
COMMENT ON FUNCTION check_comeback_eligibility IS 'Check and update comeback boost eligibility for a user';
COMMENT ON FUNCTION check_leader_pressure IS 'Check and update leader pressure status for a squad';
COMMENT ON FUNCTION apply_judge_challenge_result IS 'Apply the result of a resolved judge challenge';

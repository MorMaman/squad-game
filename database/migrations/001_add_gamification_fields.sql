-- Migration: Add gamification fields for XP, levels, and streak tracking
-- Date: 2024-12-28
-- Description: Adds xp_total, level, and streak_best columns to user_stats table
--              to support the new gamification system with XP progression,
--              level tracking, and best streak records.

-- ============================================
-- ADD NEW COLUMNS TO user_stats TABLE
-- ============================================

-- Add xp_total column (total experience points earned)
-- This tracks cumulative XP across all activities
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;

-- Add level column (current player level calculated from XP)
-- Starts at level 1 for all players
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Add streak_best column (longest streak ever achieved)
-- This is a historical record that never decreases
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS streak_best INTEGER DEFAULT 0;

-- ============================================
-- CREATE INDEX FOR LEVEL LEADERBOARDS
-- ============================================

-- Index for querying players by level (for level-based leaderboards)
CREATE INDEX IF NOT EXISTS idx_user_stats_level
ON user_stats(level DESC);

-- Index for querying players by XP (for XP-based leaderboards)
CREATE INDEX IF NOT EXISTS idx_user_stats_xp
ON user_stats(xp_total DESC);

-- Index for best streak records
CREATE INDEX IF NOT EXISTS idx_user_stats_streak_best
ON user_stats(streak_best DESC);

-- ============================================
-- FUNCTION: Calculate level from XP
-- ============================================

-- XP thresholds per level (exponential but approachable)
-- Level 1->2: 100 XP, Level 2->3: 150 XP, etc.
-- This matches the frontend levelConfig in colors.ts

CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    xp_thresholds INTEGER[] := ARRAY[100, 150, 225, 340, 500, 750, 1000, 1350, 1750, 2200, 2750, 3400, 4200, 5100, 6200, 7500, 9000, 10800, 13000];
    level INTEGER := 1;
    xp_remaining INTEGER := total_xp;
    threshold INTEGER;
    last_threshold INTEGER;
    i INTEGER;
BEGIN
    -- Iterate through thresholds
    FOR i IN 1..array_length(xp_thresholds, 1) LOOP
        threshold := xp_thresholds[i];
        IF xp_remaining >= threshold THEN
            xp_remaining := xp_remaining - threshold;
            level := level + 1;
        ELSE
            RETURN level;
        END IF;
    END LOOP;

    -- For levels beyond the defined thresholds, use 1.2x multiplier
    last_threshold := xp_thresholds[array_length(xp_thresholds, 1)];
    WHILE xp_remaining >= last_threshold LOOP
        xp_remaining := xp_remaining - last_threshold;
        last_threshold := FLOOR(last_threshold * 1.2);
        level := level + 1;
    END LOOP;

    RETURN level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Award XP and update level
-- ============================================

CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_squad_id UUID,
    p_xp_amount INTEGER
)
RETURNS TABLE(new_xp_total INTEGER, new_level INTEGER, level_changed BOOLEAN) AS $$
DECLARE
    v_old_xp INTEGER;
    v_old_level INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Get current XP and level
    SELECT xp_total, level INTO v_old_xp, v_old_level
    FROM user_stats
    WHERE user_id = p_user_id AND squad_id = p_squad_id;

    -- Initialize if not exists
    IF v_old_xp IS NULL THEN
        v_old_xp := 0;
        v_old_level := 1;
    END IF;

    -- Calculate new values
    v_new_xp := v_old_xp + p_xp_amount;
    v_new_level := calculate_level_from_xp(v_new_xp);

    -- Update or insert stats
    INSERT INTO user_stats (user_id, squad_id, xp_total, level)
    VALUES (p_user_id, p_squad_id, v_new_xp, v_new_level)
    ON CONFLICT (user_id, squad_id) DO UPDATE SET
        xp_total = v_new_xp,
        level = v_new_level,
        updated_at = NOW();

    -- Return results
    RETURN QUERY SELECT v_new_xp, v_new_level, v_new_level > v_old_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update best streak
-- ============================================

CREATE OR REPLACE FUNCTION update_best_streak(
    p_user_id UUID,
    p_squad_id UUID,
    p_current_streak INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_stats
    SET streak_best = GREATEST(COALESCE(streak_best, 0), p_current_streak),
        updated_at = NOW()
    WHERE user_id = p_user_id AND squad_id = p_squad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-update best streak when streak_count changes
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_best_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Update best streak if current streak is higher
    IF NEW.streak_count > COALESCE(NEW.streak_best, 0) THEN
        NEW.streak_best := NEW.streak_count;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS update_best_streak_trigger ON user_stats;

CREATE TRIGGER update_best_streak_trigger
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    WHEN (OLD.streak_count IS DISTINCT FROM NEW.streak_count)
    EXECUTE FUNCTION trigger_update_best_streak();

-- ============================================
-- UPDATE EXISTING DATA
-- ============================================

-- Set initial values for existing records
UPDATE user_stats
SET
    xp_total = COALESCE(xp_total, 0),
    level = COALESCE(level, 1),
    streak_best = GREATEST(COALESCE(streak_best, 0), COALESCE(streak_count, 0))
WHERE xp_total IS NULL OR level IS NULL OR streak_best IS NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN user_stats.xp_total IS 'Total experience points earned by the player in this squad';
COMMENT ON COLUMN user_stats.level IS 'Current player level, calculated from xp_total';
COMMENT ON COLUMN user_stats.streak_best IS 'Longest participation streak ever achieved (historical record)';

COMMENT ON FUNCTION calculate_level_from_xp IS 'Calculates player level from total XP using exponential thresholds';
COMMENT ON FUNCTION award_xp IS 'Awards XP to a player and updates their level, returns new totals and whether level changed';
COMMENT ON FUNCTION update_best_streak IS 'Updates the best streak record if current streak is higher';

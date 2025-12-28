-- Migration: Add player card fields (avatar_icon, xp, level)
-- Run this migration on your Supabase database to support the new onboarding flow

-- Add avatar_icon column for icon-based avatars (Ionicons)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_icon VARCHAR(20) DEFAULT NULL;

-- Add XP column for gamification
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Add level column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN profiles.avatar_icon IS 'Ionicon name for player avatar: flame, glasses, flash, crown, hardware-chip, sparkles, ghost, planet';
COMMENT ON COLUMN profiles.xp IS 'Experience points earned by the player';
COMMENT ON COLUMN profiles.level IS 'Current player level (starts at 1)';

-- Create index for level-based queries (leaderboards)
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

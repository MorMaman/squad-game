-- Stars Currency System Migration
-- Adds stars currency to user_stats and creates transaction audit trail

-- Add stars columns to user_stats
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS stars INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stars_lifetime INTEGER NOT NULL DEFAULT 0;

-- Create star_transactions table for audit trail
CREATE TABLE IF NOT EXISTS star_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- positive for earning, negative for spending
    balance_after INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'refund')),
    source TEXT NOT NULL, -- 'event_participation', 'event_first_place', 'daily_login', etc.
    reference_id UUID, -- event_id, shop_item_id, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for star_transactions
CREATE INDEX IF NOT EXISTS idx_star_transactions_user ON star_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_star_transactions_source ON star_transactions(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_star_transactions_squad ON star_transactions(squad_id, created_at DESC);

-- Enable RLS for star_transactions
ALTER TABLE star_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions" ON star_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Function to award stars (SECURITY DEFINER for controlled access)
CREATE OR REPLACE FUNCTION award_stars(
    p_user_id UUID,
    p_squad_id UUID,
    p_amount INTEGER,
    p_source TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(new_balance INTEGER, transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get current balance
    SELECT stars INTO v_current_balance
    FROM user_stats
    WHERE user_id = p_user_id AND squad_id = p_squad_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    v_new_balance := v_current_balance + p_amount;

    -- Update user_stats
    UPDATE user_stats
    SET
        stars = v_new_balance,
        stars_lifetime = stars_lifetime + p_amount
    WHERE user_id = p_user_id AND squad_id = p_squad_id;

    -- If no row was updated, insert one
    IF NOT FOUND THEN
        INSERT INTO user_stats (user_id, squad_id, stars, stars_lifetime)
        VALUES (p_user_id, p_squad_id, p_amount, p_amount);
        v_new_balance := p_amount;
    END IF;

    -- Record transaction
    INSERT INTO star_transactions (
        user_id, squad_id, amount, balance_after,
        transaction_type, source, reference_id, metadata
    )
    VALUES (
        p_user_id, p_squad_id, p_amount, v_new_balance,
        'earn', p_source, p_reference_id, p_metadata
    )
    RETURNING id INTO v_transaction_id;

    RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$;

-- Function to spend stars (SECURITY DEFINER for controlled access)
CREATE OR REPLACE FUNCTION spend_stars(
    p_user_id UUID,
    p_squad_id UUID,
    p_amount INTEGER,
    p_source TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get current balance
    SELECT stars INTO v_current_balance
    FROM user_stats
    WHERE user_id = p_user_id AND squad_id = p_squad_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- Check if user has enough stars
    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT false, v_current_balance, NULL::UUID, 'Insufficient stars'::TEXT;
        RETURN;
    END IF;

    v_new_balance := v_current_balance - p_amount;

    -- Update user_stats
    UPDATE user_stats
    SET stars = v_new_balance
    WHERE user_id = p_user_id AND squad_id = p_squad_id;

    -- Record transaction
    INSERT INTO star_transactions (
        user_id, squad_id, amount, balance_after,
        transaction_type, source, reference_id, metadata
    )
    VALUES (
        p_user_id, p_squad_id, -p_amount, v_new_balance,
        'spend', p_source, p_reference_id, p_metadata
    )
    RETURNING id INTO v_transaction_id;

    RETURN QUERY SELECT true, v_new_balance, v_transaction_id, NULL::TEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_stars TO authenticated;
GRANT EXECUTE ON FUNCTION spend_stars TO authenticated;

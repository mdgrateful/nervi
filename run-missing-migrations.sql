-- ============================================
-- NERVI APP - Missing Database Migrations
-- Run this in Supabase SQL Editor
-- ============================================

-- Add subscription and promo code fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS promo_code_used TEXT,
ADD COLUMN IF NOT EXISTS promo_code_applied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

-- Create indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Create promo_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  grants_tier TEXT DEFAULT 'premium',
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on promo code
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

-- ============================================
-- Verification Queries (run these after)
-- ============================================
-- Uncomment to verify the migrations worked:

-- Check users table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;

-- Check if promo_codes table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_name = 'promo_codes'
-- );

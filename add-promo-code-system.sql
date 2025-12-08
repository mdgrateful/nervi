-- Create promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited uses
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL = never expires
  is_active BOOLEAN DEFAULT true,
  grants_tier TEXT DEFAULT 'premium', -- 'basic' or 'premium'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add promo code fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS promo_code_used TEXT,
ADD COLUMN IF NOT EXISTS promo_code_applied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_users_promo_code ON users(promo_code_used);
CREATE INDEX IF NOT EXISTS idx_users_lifetime_access ON users(has_lifetime_access);

-- Insert some example promo codes
INSERT INTO promo_codes (code, description, grants_tier, max_uses)
VALUES
  ('LAUNCH2024', 'Launch promotion - unlimited premium access', 'premium', NULL),
  ('BETA100', 'First 100 beta users', 'premium', 100),
  ('FRIEND', 'Friend referral code', 'basic', NULL)
ON CONFLICT (code) DO NOTHING;

-- Function to update promo code usage
CREATE OR REPLACE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promo_code_used IS NOT NULL AND OLD.promo_code_used IS NULL THEN
    UPDATE promo_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE code = NEW.promo_code_used;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment usage
DROP TRIGGER IF EXISTS trigger_increment_promo_usage ON users;
CREATE TRIGGER trigger_increment_promo_usage
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION increment_promo_code_usage();

-- Add comment for documentation
COMMENT ON TABLE promo_codes IS 'Stores promotional codes that grant access without payment';
COMMENT ON COLUMN users.promo_code_used IS 'The promo code this user redeemed';
COMMENT ON COLUMN users.has_lifetime_access IS 'If true, user has permanent access regardless of subscription status';

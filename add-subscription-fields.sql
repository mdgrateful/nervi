-- Add subscription fields to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- subscription_status values:
-- 'free' - No active subscription
-- 'active' - Active paid subscription
-- 'past_due' - Payment failed, subscription still active
-- 'canceled' - Subscription canceled, still valid until period end
-- 'incomplete' - Initial payment failed
-- 'incomplete_expired' - Initial payment failed and expired
-- 'trialing' - In trial period
-- 'unpaid' - Payment failed, subscription ended

-- subscription_tier values:
-- 'free' - Free tier (default)
-- 'basic' - Basic monthly subscription ($9.99/mo)
-- 'premium' - Premium monthly subscription ($19.99/mo)

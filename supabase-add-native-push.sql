-- ============================================================================
-- ADD NATIVE PUSH NOTIFICATION SUPPORT TO nervi_push_subscriptions
-- ============================================================================
-- Run this in Supabase SQL Editor to add columns for native iOS/Android push
-- ============================================================================

-- Add columns for native push notifications (if they don't exist)
ALTER TABLE public.nervi_push_subscriptions
ADD COLUMN IF NOT EXISTS device_token TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
ADD COLUMN IF NOT EXISTS push_type TEXT DEFAULT 'web' CHECK (push_type IN ('web', 'native')),
ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster device token lookups
CREATE INDEX IF NOT EXISTS idx_push_device_token
ON public.nervi_push_subscriptions (device_token);

-- Create index for platform filtering
CREATE INDEX IF NOT EXISTS idx_push_platform
ON public.nervi_push_subscriptions (platform);

-- Create index for push type filtering
CREATE INDEX IF NOT EXISTS idx_push_type
ON public.nervi_push_subscriptions (push_type);

-- ============================================================================
-- DONE! Table is now ready for both web and native push notifications
-- ============================================================================
-- You can now store:
-- - Web push subscriptions (endpoint, p256dh, auth) for desktop/Android web
-- - Native device tokens (device_token, platform) for iOS/Android apps
-- ============================================================================

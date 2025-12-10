import { createClient } from "@supabase/supabase-js";

/**
 * Safely create Supabase client for server-side use
 * Returns null if environment variables are not properly configured
 * This prevents build errors when env vars are empty strings
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check that both variables exist and are valid strings
  if (
    !supabaseUrl ||
    typeof supabaseUrl !== 'string' ||
    supabaseUrl.trim() === '' ||
    !supabaseServiceKey ||
    typeof supabaseServiceKey !== 'string' ||
    supabaseServiceKey.trim() === ''
  ) {
    // Don't create client if env vars are missing or empty
    return null;
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  } catch (error) {
    // Silently fail during build time
    return null;
  }
}

// Export singleton instance
export const supabase = createSupabaseClient();

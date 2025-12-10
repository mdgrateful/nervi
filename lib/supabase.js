import { createClient } from "@supabase/supabase-js";

/**
 * Safely create Supabase client for server-side use
 * Returns null if environment variables are not properly configured
 * This prevents build errors when env vars are empty strings
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check that both variables exist and URL is valid
  if (
    !supabaseUrl ||
    !supabaseServiceKey ||
    !supabaseUrl.startsWith('http')
  ) {
    // Don't create client if env vars are missing or invalid
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error.message);
    return null;
  }
}

// Export singleton instance
export const supabase = createSupabaseClient();

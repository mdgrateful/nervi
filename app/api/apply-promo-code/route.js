import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, promoCode } = body || {};

    // Validation
    if (!userId || !promoCode) {
      return NextResponse.json(
        { error: "Missing userId or promoCode" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Normalize promo code to uppercase
    const normalizedCode = promoCode.trim().toUpperCase();

    // Check if user already has a promo code
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, username, promo_code_used, has_lifetime_access")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.promo_code_used) {
      return NextResponse.json(
        {
          error: `You have already used promo code: ${user.promo_code_used}`,
          alreadyUsed: true
        },
        { status: 400 }
      );
    }

    // Validate promo code
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .single();

    if (promoError || !promo) {
      console.log("[PROMO CODE] Invalid code attempted:", normalizedCode);
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This promo code has expired" },
        { status: 400 }
      );
    }

    // Check if code has reached max uses
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json(
        { error: "This promo code has reached its maximum number of uses" },
        { status: 400 }
      );
    }

    // Apply promo code to user
    const { error: updateError } = await supabase
      .from("users")
      .update({
        promo_code_used: normalizedCode,
        promo_code_applied_at: new Date().toISOString(),
        has_lifetime_access: true,
        subscription_tier: promo.grants_tier || 'premium',
        subscription_status: 'active', // Mark as active so they have access
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[PROMO CODE] Error applying promo code:", updateError);
      return NextResponse.json(
        { error: "Failed to apply promo code" },
        { status: 500 }
      );
    }

    console.log(`[PROMO CODE] Successfully applied code ${normalizedCode} to user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Promo code applied! You now have ${promo.grants_tier} access.`,
      tier: promo.grants_tier,
      hasLifetimeAccess: true,
    });
  } catch (err) {
    console.error("[PROMO CODE] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

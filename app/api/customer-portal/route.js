import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "../../../lib/stripe";

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
    const { userId } = body || {};

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user" },
        { status: 404 }
      );
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`,
    });

    console.log(`[STRIPE] Created customer portal session for user: ${userId}`);

    return NextResponse.json({
      url: session.url,
    });
  } catch (err) {
    console.error("[STRIPE] Error creating customer portal session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, SUBSCRIPTION_PLANS } from "../../../lib/stripe";

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
    const { userId, tier } = body || {};

    // Validation
    if (!userId || !tier) {
      return NextResponse.json(
        { error: "Missing userId or tier" },
        { status: 400 }
      );
    }

    if (!['basic', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
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
      .select("user_id, email, username, stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.user_id,
          username: user.username || user.user_id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    const plan = SUBSCRIPTION_PLANS[tier];
    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${tier} tier. Please set STRIPE_${tier.toUpperCase()}_PRICE_ID in environment variables.` },
        { status: 500 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?canceled=true`,
      metadata: {
        userId: user.user_id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: user.user_id,
          tier: tier,
        },
      },
    });

    console.log(`[STRIPE] Created checkout session for user ${userId}, tier: ${tier}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("[STRIPE] Error creating checkout session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

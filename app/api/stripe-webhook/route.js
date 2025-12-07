import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "../../../lib/stripe";
import { headers } from "next/headers";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

// Disable body parsing so we can verify the webhook signature
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("[STRIPE WEBHOOK] No signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[STRIPE WEBHOOK] Signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`[STRIPE WEBHOOK] Checkout completed for customer: ${session.customer}`);

        // Get subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await updateSubscriptionInDatabase(subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSubscriptionInDatabase(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          console.log(`[STRIPE WEBHOOK] Subscription deleted for user: ${userId}`);

          await supabase
            .from("users")
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              stripe_subscription_id: null,
              subscription_current_period_end: null,
            })
            .eq("user_id", userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Update subscription on successful payment
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateSubscriptionInDatabase(subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log(`[STRIPE WEBHOOK] Payment failed for customer: ${customerId}`);

        // Find user by customer ID and update status
        const { data: user } = await supabase
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          await supabase
            .from("users")
            .update({ subscription_status: 'past_due' })
            .eq("user_id", user.user_id);
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Unexpected error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Helper function to update subscription in database
async function updateSubscriptionInDatabase(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    const tier = subscription.metadata?.tier || 'basic';

    if (!userId) {
      console.error("[STRIPE WEBHOOK] No userId in subscription metadata");
      return;
    }

    const updateData = {
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    console.log(`[STRIPE WEBHOOK] Updating subscription for user ${userId}:`, updateData);

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", userId);

    if (error) {
      console.error("[STRIPE WEBHOOK] Error updating user subscription:", error);
    } else {
      console.log(`[STRIPE WEBHOOK] Successfully updated subscription for user: ${userId}`);
    }
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Error in updateSubscriptionInDatabase:", err);
  }
}

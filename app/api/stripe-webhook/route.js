import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { stripe } from "../../../lib/stripe";
import { headers } from "next/headers";
import { logInfo, logError } from "../../../lib/logger";

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
      logError("Stripe webhook missing signature", new Error("No signature"), { operation: "stripe_webhook" });
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
      logError("Stripe webhook signature verification failed", err, { operation: "stripe_webhook" });
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    logInfo("Stripe webhook event received", { operation: "stripe_webhook", eventType: event.type });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logInfo("Stripe checkout session completed", { operation: "stripe_webhook" });

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
          logInfo("Stripe subscription deleted", { operation: "stripe_webhook" });

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

        logInfo("Stripe payment failed", { operation: "stripe_webhook" });

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
        logInfo("Stripe webhook unhandled event type", { operation: "stripe_webhook", eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logError("Unexpected error in stripe webhook", err, { endpoint: "/api/stripe-webhook" });
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
      logError("Stripe subscription missing userId in metadata", new Error("No userId"), { operation: "stripe_webhook" });
      return;
    }

    const updateData = {
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    logInfo("Updating Stripe subscription in database", { operation: "stripe_webhook" });

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", userId);

    if (error) {
      logError("Failed to update subscription in database", error, { operation: "stripe_webhook" });
    } else {
      logInfo("Successfully updated subscription in database", { operation: "stripe_webhook" });
    }
  } catch (err) {
    logError("Error in updateSubscriptionInDatabase helper", err, { operation: "stripe_webhook" });
  }
}

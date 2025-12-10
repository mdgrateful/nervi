import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { logError } from "../../../../lib/logger";
import { sanitizeInput, isValidUUID, isValidURL } from "../../../../lib/validation";

export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId: rawUserId, subscription } = body || {};

    if (!rawUserId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Missing userId or subscription" },
        { status: 400 }
      );
    }

    // Sanitize and validate userId
    const userId = sanitizeInput(rawUserId, 100);
    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Validate subscription endpoint URL
    const endpoint = sanitizeInput(subscription.endpoint, 500);
    if (!isValidURL(endpoint)) {
      return NextResponse.json(
        { error: "Invalid subscription endpoint" },
        { status: 400 }
      );
    }

    // Validate subscription keys
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Subscription keys missing" },
        { status: 400 }
      );
    }

    // Sanitize keys (base64 strings)
    const sanitizedP256dh = sanitizeInput(p256dh, 200);
    const sanitizedAuth = sanitizeInput(auth, 200);

    const { error } = await supabase.from("nervi_push_subscriptions").insert({
      user_id: userId,
      endpoint: endpoint,
      p256dh: sanitizedP256dh,
      auth: sanitizedAuth,
    });

    if (error) {
      logError("Error saving push subscription", error, { operation: "push_subscribe" });
      return NextResponse.json(
        { error: "Error saving push subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("Unexpected error in push subscribe endpoint", err, { endpoint: "/api/push/subscribe" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

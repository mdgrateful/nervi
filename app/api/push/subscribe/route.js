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
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, subscription } = body || {};

    if (!userId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Missing userId or subscription" },
        { status: 400 }
      );
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Subscription keys missing" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("nervi_push_subscriptions").insert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
    });

    if (error) {
      console.error("Error saving push subscription:", error);
      return NextResponse.json(
        { error: "Error saving push subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/push/subscribe:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

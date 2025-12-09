import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/push/register-native
 * Register a native device token (APNs for iOS, FCM for Android)
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceToken, platform } = await request.json();

    if (!deviceToken || !platform) {
      return NextResponse.json(
        { error: "Missing deviceToken or platform" },
        { status: 400 }
      );
    }

    // Check if this device token already exists for this user
    const { data: existing } = await supabase
      .from("nervi_push_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("device_token", deviceToken)
      .single();

    if (existing) {
      // Update last_used timestamp
      await supabase
        .from("nervi_push_subscriptions")
        .update({ last_used: new Date().toISOString() })
        .eq("id", existing.id);

      return NextResponse.json({
        success: true,
        message: "Device token updated",
      });
    }

    // Insert new device token
    const { error: insertError } = await supabase
      .from("nervi_push_subscriptions")
      .insert({
        user_id: session.user.id,
        device_token: deviceToken,
        platform: platform, // 'ios' or 'android'
        push_type: "native", // 'native' vs 'web'
        last_used: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error saving device token:", insertError);
      return NextResponse.json(
        { error: "Failed to save device token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Device token registered successfully",
    });
  } catch (error) {
    console.error("Error in register-native:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

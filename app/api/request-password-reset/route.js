import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "../../../lib/email";

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
    const { email } = body || {};

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Find user by email (case-insensitive)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_id, email, username")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Always return success to prevent email enumeration
    if (userError || !user) {
      console.log("[PASSWORD RESET] User not found for email:", email);
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, you will receive password reset instructions.",
      });
    }

    // Generate reset token (32 random bytes as hex string)
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token to database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[PASSWORD RESET] Error saving reset token:", updateError);
      return NextResponse.json(
        { error: "Failed to generate reset token" },
        { status: 500 }
      );
    }

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success && !emailResult.skipped) {
      console.error("[PASSWORD RESET] Failed to send email:", emailResult.error);
      // Still return success to prevent enumeration
    } else {
      console.log("[PASSWORD RESET] Reset email sent to:", user.email);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, you will receive password reset instructions.",
    });
  } catch (err) {
    console.error("[PASSWORD RESET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

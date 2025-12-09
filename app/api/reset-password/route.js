import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { logInfo, logError } from "../../../lib/logger";
import { validatePassword } from "../../../lib/passwordValidation";

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
    const { token, password } = body || {};

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Find user with valid reset token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_id, password_reset_token, password_reset_expires")
      .eq("password_reset_token", token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq("id", user.id);

    if (updateError) {
      logError("Failed to update password during reset", updateError, { operation: "reset_password" });
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    logInfo("Password reset successful", { operation: "reset_password" });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (err) {
    logError("Unexpected error in reset password endpoint", err, { endpoint: "/api/reset-password" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

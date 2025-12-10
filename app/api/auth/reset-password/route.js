import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import bcrypt from "bcryptjs";
import { logInfo, logError, logSecurityEvent } from "../../../../lib/logger";
import { validatePassword } from "../../../../lib/passwordValidation";
import { sanitizeInput } from "../../../../lib/validation";

export async function POST(request) {
  try {
    const { token: rawToken, newPassword } = await request.json();

    if (!rawToken || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Sanitize token (hex string, max 64 chars)
    const token = sanitizeInput(rawToken, 64);

    // Validate token format (should be hex characters only)
    if (!/^[a-f0-9]+$/i.test(token)) {
      logSecurityEvent("Invalid reset token format detected", { operation: "auth_reset_password" });
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Find reset token
    const { data: tokens, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false);

    if (tokenError || !tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const resetToken = tokens[0];

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("user_id", resetToken.user_id);

    if (updateError) {
      logError("Failed to update password during reset", updateError, { operation: "auth_reset_password" });
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id);

    logInfo("Password reset successful", { operation: "auth_reset_password" });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logError("Unexpected error in auth reset password endpoint", error, { endpoint: "/api/auth/reset-password" });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

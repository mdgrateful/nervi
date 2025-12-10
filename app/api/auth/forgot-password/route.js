import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { randomBytes } from "crypto";
import { rateLimiters } from "../../../../lib/rateLimit";
import { logInfo, logError, logSecurityEvent } from "../../../../lib/logger";
import { sanitizeInput, isValidEmail } from "../../../../lib/validation";
import { sendPasswordResetEmail } from "../../../../lib/email";

export async function POST(request) {
  // Apply rate limiting: 3 password reset requests per hour per IP
  const rateLimitResult = rateLimiters.passwordReset(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { email: rawEmail } = await request.json();

    if (!rawEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const email = sanitizeInput(rawEmail, 100).toLowerCase();

    if (!isValidEmail(email)) {
      // Don't reveal that the email format is invalid (security best practice)
      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive a password reset link.",
      });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("user_id, username, email")
      .eq("email", email);

    // Always return success (don't reveal if email exists)
    if (userError || !users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive a password reset link.",
      });
    }

    const user = users[0];

    // Generate secure reset token (32 bytes = 64 hex characters)
    const resetToken = randomBytes(32).toString("hex");

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert([{
        user_id: user.user_id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      }]);

    if (tokenError) {
      logError("Error creating reset token", tokenError, { operation: "forgot_password" });
      return NextResponse.json(
        { error: "Failed to create reset token" },
        { status: 500 }
      );
    }

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success && !emailResult.skipped) {
      logError("Failed to send password reset email", emailResult.error, {
        operation: "forgot_password"
      });
      // Don't reveal email send failure to user (security best practice)
      // Token is still valid in database, user can retry
    }

    logSecurityEvent("Password reset requested", {
      operation: "forgot_password",
      emailSent: emailResult.success || emailResult.skipped
    });
    logInfo("Password reset token generated", {
      source: "forgot_password",
      emailStatus: emailResult.skipped ? "skipped" : emailResult.success ? "sent" : "failed"
    });

    return NextResponse.json({
      success: true,
      message: "If this email is registered, you will receive a password reset link.",
    });
  } catch (error) {
    logError("Unexpected error in forgot password endpoint", error, { endpoint: "/api/auth/forgot-password" });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

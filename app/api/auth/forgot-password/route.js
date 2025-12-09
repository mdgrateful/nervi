import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { rateLimiters } from "../../../../lib/rateLimit";
import { logInfo, logError, logSecurityEvent } from "../../../../lib/logger";
import { sanitizeInput, isValidEmail } from "../../../../lib/validation";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

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

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, this should be emailed)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    logSecurityEvent("Password reset requested", { operation: "forgot_password" });
    logInfo("Password reset token generated", { source: "forgot_password" });

    return NextResponse.json({
      success: true,
      message: "If this email is registered, you will receive a password reset link.",
      // REMOVE THIS IN PRODUCTION - only for development
      devOnly: {
        resetUrl,
        token: resetToken,
      }
    });
  } catch (error) {
    logError("Unexpected error in forgot password endpoint", error, { endpoint: "/api/auth/forgot-password" });
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

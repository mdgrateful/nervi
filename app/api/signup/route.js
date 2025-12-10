import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendWelcomeEmail } from "../../../lib/email";
import { logInfo, logError, logSecurityEvent } from "../../../lib/logger";
import { validatePassword } from "../../../lib/passwordValidation";
import { rateLimiters } from "../../../lib/rateLimit";
import {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  isValidStateCode,
  isValidTimeFormat,
  parseBoolean,
} from "../../../lib/validation";
import { auditLog } from "../../../lib/auditLog";


export async function POST(request) {
  // Apply rate limiting: 3 signups per hour per IP
  const rateLimitResult = rateLimiters.signup(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const {
      username: rawUsername,
      email: rawEmail,
      password,
      state,
      workStartTime,
      workEndTime,
      allowWorkNotifications,
      profilePictureUrl,
      promoCode,
    } = body || {};

    // Sanitize and normalize inputs
    const username = sanitizeInput(rawUsername, 30).toLowerCase();
    const email = sanitizeInput(rawEmail, 100).toLowerCase();
    const sanitizedState = state ? sanitizeInput(state, 2).toUpperCase() : null;
    const sanitizedPromoCode = promoCode ? sanitizeInput(promoCode, 50) : null;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
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

    // Validate state if provided
    if (sanitizedState && !isValidStateCode(sanitizedState)) {
      return NextResponse.json(
        { error: "Invalid state code" },
        { status: 400 }
      );
    }

    // Validate work times if provided
    if (workStartTime && !isValidTimeFormat(workStartTime)) {
      return NextResponse.json(
        { error: "Invalid work start time format (use HH:MM)" },
        { status: 400 }
      );
    }

    if (workEndTime && !isValidTimeFormat(workEndTime)) {
      return NextResponse.json(
        { error: "Invalid work end time format (use HH:MM)" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Check if username already exists (case-insensitive)
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Check if email already exists (case-insensitive)
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique user ID
    const userId = randomUUID();

    // Validate promo code if provided
    let promoCodeData = null;
    if (sanitizedPromoCode) {
      const normalizedCode = sanitizedPromoCode.toUpperCase();

      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", normalizedCode)
        .eq("is_active", true)
        .single();

      if (promo && !promoError) {
        // Check if code has expired
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          return NextResponse.json(
            { error: "This promo code has expired" },
            { status: 400 }
          );
        }

        // Check if code has reached max uses
        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
          return NextResponse.json(
            { error: "This promo code has reached its maximum number of uses" },
            { status: 400 }
          );
        }

        promoCodeData = {
          code: normalizedCode,
          tier: promo.grants_tier || 'premium',
        };
      } else {
        // Invalid promo code - return error
        return NextResponse.json(
          { error: "Invalid promo code" },
          { status: 400 }
        );
      }
    }

    // Create user with normalized username and email
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          user_id: userId,
          username,
          email,
          password_hash: passwordHash,
          state: sanitizedState,
          work_start_time: workStartTime || null,
          work_end_time: workEndTime || null,
          allow_work_notifications: parseBoolean(allowWorkNotifications) || false,
          profile_picture_url: profilePictureUrl || null,
          promo_code_used: promoCodeData ? promoCodeData.code : null,
          promo_code_applied_at: promoCodeData ? new Date().toISOString() : null,
          has_lifetime_access: promoCodeData ? true : false,
          subscription_tier: promoCodeData ? promoCodeData.tier : 'free',
          subscription_status: promoCodeData ? 'active' : 'free',
        },
      ])
      .select()
      .single();

    if (error) {
      logError("Failed to create user account", error, { operation: "signup" });
      return NextResponse.json(
        { error: "Error creating account" },
        { status: 500 }
      );
    }

    // Increment promo code usage if one was used
    if (promoCodeData) {
      await supabase
        .from("promo_codes")
        .update({
          current_uses: supabase.raw('current_uses + 1'),
          updated_at: new Date().toISOString(),
        })
        .eq("code", promoCodeData.code);

      logInfo("Promo code applied during signup", { source: "signup" });
      auditLog.promoCodeApplied(userId, promoCodeData.code, request);
    }

    // Log account creation
    auditLog.accountCreated(userId, username, request);

    // Send welcome email (don't block signup if email fails)
    sendWelcomeEmail(data.email, data.username).catch((err) => {
      logError("Failed to send welcome email", err, { operation: "signup" });
      // Email failure shouldn't prevent signup from succeeding
    });

    // Return success (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        userId: data.user_id,
        username: data.username,
        email: data.email,
      },
    });
  } catch (err) {
    logError("Unexpected error in signup endpoint", err, { endpoint: "/api/signup" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

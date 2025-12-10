import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { logError, logSecurityEvent } from "../../../lib/logger";
import {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  isValidStateCode,
  isValidTimeFormat,
  isValidUUID,
  parseBoolean,
} from "../../../lib/validation";

// GET: Fetch user profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get("userId");

    if (!rawUserId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Sanitize userId
    const userId = sanitizeInput(rawUserId, 100);

    // Validate UUID format (unless it's a dev user)
    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      logSecurityEvent("Invalid userId format in profile GET", { operation: "get_profile" });
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logError("Failed to fetch profile", error, { operation: "get_profile" });
      return NextResponse.json(
        { error: "Error fetching profile" },
        { status: 500 }
      );
    }

    // If no profile exists, return null (frontend will show form to create one)
    return NextResponse.json({ profile: data || null });
  } catch (err) {
    logError("Unexpected error in get profile endpoint", err, { endpoint: "/api/profile GET" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// POST: Create or update user profile
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId: rawUserId,
      username: rawUsername,
      email: rawEmail,
      state: rawState,
      workStartTime,
      workEndTime,
      allowWorkNotifications,
      profilePictureUrl,
    } = body || {};

    if (!rawUserId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const userId = sanitizeInput(rawUserId, 100);
    const username = rawUsername ? sanitizeInput(rawUsername, 30).toLowerCase() : null;
    const email = rawEmail ? sanitizeInput(rawEmail, 100).toLowerCase() : null;
    const state = rawState ? sanitizeInput(rawState, 2).toUpperCase() : null;

    // Validate userId format
    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      logSecurityEvent("Invalid userId format in profile POST", { operation: "update_profile" });
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Validate username if provided
    if (username && !isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate state if provided
    if (state && !isValidStateCode(state)) {
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

    // Update user profile in users table (user must already exist from signup)
    const updateData = {
      username: username || userId,
      email: email || `${userId}@nervi.app`,
      state: state,
      work_start_time: workStartTime || null,
      work_end_time: workEndTime || null,
      allow_work_notifications: parseBoolean(allowWorkNotifications) || false,
      profile_picture_url: profilePictureUrl !== undefined ? profilePictureUrl : null,
    };

    // Try to update existing user
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    // If user doesn't exist (PGRST116) and it's a dev user, try to find by username
    if (error && error.code === "PGRST116" && userId.startsWith("dev-")) {
      // Check if user exists by username instead of user_id
      const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("username", updateData.username)
        .single();

      if (existingUser) {
        // User exists by username, update without changing password
        const { data: updatedData, error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("username", updateData.username)
          .select()
          .single();

        if (updateError) {
          logError("Failed to update dev user", updateError, { operation: "update_profile" });
          return NextResponse.json(
            { error: "Error updating profile" },
            { status: 500 }
          );
        }

        return NextResponse.json({ profile: updatedData });
      } else {
        // User doesn't exist, create with default password
        const bcrypt = require("bcryptjs");
        const devPassword = await bcrypt.hash("dev-password-123", 12);

        const insertData = {
          user_id: userId,
          ...updateData,
          password_hash: devPassword,
        };

        const { data: newData, error: insertError } = await supabase
          .from("users")
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          logError("Failed to create dev user", insertError, { operation: "create_profile" });
          return NextResponse.json(
            { error: "Error creating profile" },
            { status: 500 }
          );
        }

        return NextResponse.json({ profile: newData });
      }
    }

    if (error) {
      logError("Failed to save profile", error, { operation: "update_profile" });
      return NextResponse.json(
        { error: "Error saving profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    logError("Unexpected error in update profile endpoint", err, { endpoint: "/api/profile POST" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

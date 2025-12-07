import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendWelcomeEmail } from "../../../lib/email";

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
    const {
      username,
      email,
      password,
      state,
      workStartTime,
      workEndTime,
      allowWorkNotifications,
      profilePictureUrl,
    } = body || {};

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Check if username already exists
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

    // Check if email already exists
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

    // Create user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          user_id: userId,
          username,
          email,
          password_hash: passwordHash,
          state: state || null,
          work_start_time: workStartTime || null,
          work_end_time: workEndTime || null,
          allow_work_notifications: allowWorkNotifications || false,
          profile_picture_url: profilePictureUrl || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Error creating account" },
        { status: 500 }
      );
    }

    // Send welcome email (don't block signup if email fails)
    sendWelcomeEmail(data.email, data.username).catch((err) => {
      console.error("Failed to send welcome email:", err);
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
    console.error("Unexpected error in /api/signup POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

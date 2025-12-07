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

// GET: Fetch user profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
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
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        { error: "Error fetching profile" },
        { status: 500 }
      );
    }

    // If no profile exists, return null (frontend will show form to create one)
    return NextResponse.json({ profile: data || null });
  } catch (err) {
    console.error("Unexpected error in /api/profile GET:", err);
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
      userId,
      username,
      email,
      state,
      workStartTime,
      workEndTime,
      allowWorkNotifications,
      profilePictureUrl,
    } = body || {};

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
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
      username: username || userId, // Use username if provided, otherwise use userId
      email: email || `${userId}@nervi.app`, // Use email if provided, otherwise generate a default
      state: state || null,
      work_start_time: workStartTime || null,
      work_end_time: workEndTime || null,
      allow_work_notifications: allowWorkNotifications || false,
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
          console.error("Error updating dev user by username:", updateError);
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
          console.error("Error creating dev user:", insertError);
          return NextResponse.json(
            { error: "Error creating profile" },
            { status: 500 }
          );
        }

        return NextResponse.json({ profile: newData });
      }
    }

    if (error) {
      console.error("Error saving profile:", error);
      return NextResponse.json(
        { error: "Error saving profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Unexpected error in /api/profile POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

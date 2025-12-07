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

    // Upsert user profile in users table (create or update)
    const upsertData = {
      user_id: userId,
      username: username || userId, // Use username if provided, otherwise use userId
      email: email || null,
      state: state || null,
      work_start_time: workStartTime || null,
      work_end_time: workEndTime || null,
      allow_work_notifications: allowWorkNotifications || false,
      profile_picture_url: profilePictureUrl || null,
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(upsertData, { onConflict: "user_id" })
      .select()
      .single();

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

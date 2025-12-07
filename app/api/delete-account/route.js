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

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, username } = body || {};

    // Validation
    if (!userId || !username) {
      return NextResponse.json(
        { error: "Missing userId or username" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    console.log(`[DELETE ACCOUNT] Starting deletion for user: ${userId} (${username})`);

    // Verify user exists and username matches
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, username")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.username !== username) {
      return NextResponse.json(
        { error: "Username does not match" },
        { status: 400 }
      );
    }

    // Delete all user data in order
    // 1. Delete all conversations (nervi_memories)
    const { error: memoriesError } = await supabase
      .from("nervi_memories")
      .delete()
      .eq("user_id", userId);

    if (memoriesError) {
      console.error("[DELETE ACCOUNT] Error deleting memories:", memoriesError);
      // Continue anyway - we want to delete as much as possible
    } else {
      console.log(`[DELETE ACCOUNT] Deleted conversations for user: ${userId}`);
    }

    // 2. Delete all notes (nervi_notes)
    const { error: notesError } = await supabase
      .from("nervi_notes")
      .delete()
      .eq("user_id", userId);

    if (notesError) {
      console.error("[DELETE ACCOUNT] Error deleting notes:", notesError);
      // Continue anyway
    } else {
      console.log(`[DELETE ACCOUNT] Deleted notes for user: ${userId}`);
    }

    // 3. Delete life story chapters
    const { error: chaptersError } = await supabase
      .from("life_story_chapters")
      .delete()
      .eq("user_id", userId);

    if (chaptersError) {
      console.error("[DELETE ACCOUNT] Error deleting life story chapters:", chaptersError);
    } else {
      console.log(`[DELETE ACCOUNT] Deleted life story chapters for user: ${userId}`);
    }

    // 4. Delete life story events
    const { error: eventsError } = await supabase
      .from("life_story_events")
      .delete()
      .eq("user_id", userId);

    if (eventsError) {
      console.error("[DELETE ACCOUNT] Error deleting life story events:", eventsError);
    } else {
      console.log(`[DELETE ACCOUNT] Deleted life story events for user: ${userId}`);
    }

    // 5. Delete life story threads
    const { error: threadsError } = await supabase
      .from("life_story_threads")
      .delete()
      .eq("user_id", userId);

    if (threadsError) {
      console.error("[DELETE ACCOUNT] Error deleting life story threads:", threadsError);
    } else {
      console.log(`[DELETE ACCOUNT] Deleted life story threads for user: ${userId}`);
    }

    // 6. Delete daily tasks
    const { error: tasksError } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("user_id", userId);

    if (tasksError) {
      console.error("[DELETE ACCOUNT] Error deleting daily tasks:", tasksError);
    } else {
      console.log(`[DELETE ACCOUNT] Deleted daily tasks for user: ${userId}`);
    }

    // 7. Delete master schedule
    const { error: scheduleError } = await supabase
      .from("master_schedules")
      .delete()
      .eq("user_id", userId);

    if (scheduleError) {
      console.error("[DELETE ACCOUNT] Error deleting master schedule:", scheduleError);
    } else {
      console.log(`[DELETE ACCOUNT] Deleted master schedule for user: ${userId}`);
    }

    // 8. Finally, delete the user profile itself
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (deleteUserError) {
      console.error("[DELETE ACCOUNT] Error deleting user profile:", deleteUserError);
      return NextResponse.json(
        { error: "Error deleting user profile" },
        { status: 500 }
      );
    }

    console.log(`[DELETE ACCOUNT] Successfully deleted all data for user: ${userId} (${username})`);

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (err) {
    console.error("[DELETE ACCOUNT] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

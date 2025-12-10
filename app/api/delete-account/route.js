import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { logInfo, logError, logSecurityEvent } from "../../../lib/logger";
import { rateLimiters } from "../../../lib/rateLimit";
import { sanitizeInput, isValidUUID, isValidUsername } from "../../../lib/validation";
import { auditLog } from "../../../lib/auditLog";

export async function DELETE(request) {
  // Apply strict rate limiting: 10 delete attempts per hour per IP
  const rateLimitResult = rateLimiters.strict(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { userId: rawUserId, username: rawUsername } = body || {};

    // Validation
    if (!rawUserId || !rawUsername) {
      return NextResponse.json(
        { error: "Missing userId or username" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const userId = sanitizeInput(rawUserId, 100);
    const username = sanitizeInput(rawUsername, 30).toLowerCase();

    // Validate userId format
    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      logSecurityEvent("Invalid userId format in delete account", { operation: "delete_account" });
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    logSecurityEvent("Account deletion started", { operation: "delete_account" });

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
      logError("Failed to delete user memories", memoriesError, { operation: "delete_account" });
      // Continue anyway - we want to delete as much as possible
    } else {
      logInfo("Deleted user conversations", { operation: "delete_account" });
    }

    // 2. Delete all notes (nervi_notes)
    const { error: notesError } = await supabase
      .from("nervi_notes")
      .delete()
      .eq("user_id", userId);

    if (notesError) {
      logError("Failed to delete user notes", notesError, { operation: "delete_account" });
      // Continue anyway
    } else {
      logInfo("Deleted user notes", { operation: "delete_account" });
    }

    // 3. Delete life story chapters
    const { error: chaptersError } = await supabase
      .from("life_story_chapters")
      .delete()
      .eq("user_id", userId);

    if (chaptersError) {
      logError("Failed to delete life story chapters", chaptersError, { operation: "delete_account" });
    } else {
      logInfo("Deleted life story chapters", { operation: "delete_account" });
    }

    // 4. Delete life story events
    const { error: eventsError } = await supabase
      .from("life_story_events")
      .delete()
      .eq("user_id", userId);

    if (eventsError) {
      logError("Failed to delete life story events", eventsError, { operation: "delete_account" });
    } else {
      logInfo("Deleted life story events", { operation: "delete_account" });
    }

    // 5. Delete life story threads
    const { error: threadsError } = await supabase
      .from("life_story_threads")
      .delete()
      .eq("user_id", userId);

    if (threadsError) {
      logError("Failed to delete life story threads", threadsError, { operation: "delete_account" });
    } else {
      logInfo("Deleted life story threads", { operation: "delete_account" });
    }

    // 6. Delete daily tasks
    const { error: tasksError } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("user_id", userId);

    if (tasksError) {
      logError("Failed to delete daily tasks", tasksError, { operation: "delete_account" });
    } else {
      logInfo("Deleted daily tasks", { operation: "delete_account" });
    }

    // 7. Delete master schedule
    const { error: scheduleError } = await supabase
      .from("master_schedules")
      .delete()
      .eq("user_id", userId);

    if (scheduleError) {
      logError("Failed to delete master schedule", scheduleError, { operation: "delete_account" });
    } else {
      logInfo("Deleted master schedule", { operation: "delete_account" });
    }

    // 8. Finally, delete the user profile itself
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (deleteUserError) {
      logError("Failed to delete user profile", deleteUserError, { operation: "delete_account" });
      return NextResponse.json(
        { error: "Error deleting user profile" },
        { status: 500 }
      );
    }

    logSecurityEvent("Account successfully deleted", { operation: "delete_account" });
    auditLog.accountDeleted(userId, username, request);

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (err) {
    logError("Unexpected error in delete account endpoint", err, { endpoint: "/api/delete-account" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

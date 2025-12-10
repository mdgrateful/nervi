import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { logInfo, logError, logSecurityEvent } from "../../../lib/logger";
import { rateLimiters } from "../../../lib/rateLimit";

export async function POST(request) {
  // Apply rate limiting: 10 data exports per hour per IP
  const rateLimitResult = rateLimiters.strict(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { userId } = body || {};

    // Validation
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

    logSecurityEvent("Data export requested", { operation: "export_data" });

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all user data
    const userData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        state: user.state,
        workStartTime: user.work_start_time,
        workEndTime: user.work_end_time,
        allowWorkNotifications: user.allow_work_notifications,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
        hasLifetimeAccess: user.has_lifetime_access,
        promoCodeUsed: user.promo_code_used,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    };

    // Fetch conversations (nervi_memories)
    const { data: memories, error: memoriesError } = await supabase
      .from("nervi_memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!memoriesError && memories) {
      userData.conversations = memories.map(memory => ({
        id: memory.id,
        role: memory.role,
        content: memory.content,
        timestamp: memory.timestamp,
        createdAt: memory.created_at,
      }));
    } else {
      userData.conversations = [];
    }

    // Fetch notes (nervi_notes)
    const { data: notes, error: notesError } = await supabase
      .from("nervi_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!notesError && notes) {
      userData.notes = notes.map(note => ({
        id: note.id,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));
    } else {
      userData.notes = [];
    }

    // Fetch life story chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from("life_story_chapters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!chaptersError && chapters) {
      userData.lifeStoryChapters = chapters;
    } else {
      userData.lifeStoryChapters = [];
    }

    // Fetch life story events
    const { data: events, error: eventsError } = await supabase
      .from("life_story_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (!eventsError && events) {
      userData.lifeStoryEvents = events;
    } else {
      userData.lifeStoryEvents = [];
    }

    // Fetch life story threads
    const { data: threads, error: threadsError } = await supabase
      .from("life_story_threads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!threadsError && threads) {
      userData.lifeStoryThreads = threads;
    } else {
      userData.lifeStoryThreads = [];
    }

    // Fetch daily tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!tasksError && tasks) {
      userData.dailyTasks = tasks;
    } else {
      userData.dailyTasks = [];
    }

    // Fetch master schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("master_schedules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!schedulesError && schedules) {
      userData.masterSchedules = schedules;
    } else {
      userData.masterSchedules = [];
    }

    logSecurityEvent("Data export completed successfully", { operation: "export_data" });

    // Return data as downloadable JSON
    const filename = `nervi-data-${userId}-${Date.now()}.json`;
    const jsonData = JSON.stringify(userData, null, 2);

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logError("Unexpected error in export data endpoint", err, { endpoint: "/api/export-data" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

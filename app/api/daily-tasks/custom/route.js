import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { logError } from "../../../../lib/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/daily-tasks/custom
 * Add a custom task for the user
 * Body: { userId, taskInput } where taskInput is like "2:00 PM - Take a walk"
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, taskInput } = body;

    if (!userId || !taskInput) {
      return NextResponse.json(
        { error: "Missing userId or taskInput" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Parse time and activity from input (e.g., "2:00 PM - Take a walk")
    const timeMatch = taskInput.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–]\s*(.+)$/);
    let time, activity;

    if (timeMatch) {
      time = timeMatch[1].trim();
      activity = timeMatch[2].trim();
    } else {
      // No time specified, just the activity
      time = "Anytime";
      activity = taskInput.trim();
    }

    const today = new Date().toISOString().split('T')[0];
    const taskId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert task into database
    const { data, error } = await supabase
      .from('nervi_daily_tasks')
      .insert({
        user_id: userId,
        task_id: taskId,
        task_date: today,
        time: time,
        activity: activity,
        why: null,
        data_source: 'user_added',
        completed: false,
      })
      .select()
      .single();

    if (error) {
      logError("Failed to add custom task", error, { operation: "add_custom_task" });
      return NextResponse.json(
        { error: "Failed to add task" },
        { status: 500 }
      );
    }

    // Return the task in the format expected by the frontend
    return NextResponse.json({
      success: true,
      task: {
        id: data.task_id,
        time: data.time,
        activity: data.activity,
        why: data.why,
        dataSource: data.data_source,
        completed: data.completed,
      },
    });
  } catch (error) {
    logError("Failed to process POST request", error, { endpoint: "/api/daily-tasks/custom" });
    return NextResponse.json(
      { error: "Failed to add task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daily-tasks/custom?userId=xxx&taskId=yyy
 * Remove a custom task
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const taskId = searchParams.get("taskId");

    if (!userId || !taskId) {
      return NextResponse.json(
        { error: "Missing userId or taskId" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Delete task from database
    const { error } = await supabase
      .from('nervi_daily_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('task_date', today);

    if (error) {
      logError("Failed to delete custom task", error, { operation: "delete_custom_task" });
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logError("Failed to process DELETE request", error, { endpoint: "/api/daily-tasks/custom" });
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

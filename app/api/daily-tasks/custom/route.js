import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { logError } from "../../../../lib/logger";
import OpenAI from "openai";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Parse natural language task input using AI
 * Handles: "remind me to call mom tomorrow at 3pm", "meeting 2morrow 2pm", "call john at 5"
 */
async function parseTaskWithAI(taskInput, userTimezone = 'America/New_York') {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You parse natural language task inputs into structured data.

Today is ${dayOfWeek}, ${todayStr}.
User timezone: ${userTimezone} (Eastern Time)

Extract:
1. activity: The main task/action (clean up spelling, make it clear)
2. time: Time in 12-hour format with AM/PM (e.g., "3:00 PM", "9:30 AM"). Always include AM/PM. If no time specified, use "Anytime"
   - Handle variations: "3pm", "3 pm", "3:00pm", "3:00 PM", "15:00", "3", "three pm"
   - If only hour given (no AM/PM), assume PM if 1-5, AM if 6-11
   - Normalize to format "H:MM AM/PM" (e.g., "3:00 PM", "10:30 AM")
3. date: ISO date (YYYY-MM-DD). Handle "today", "tomorrow", "tmrw", "2morrow", day names like "monday", "next week", etc.

Return JSON: {"activity": "...", "time": "...", "date": "..."}

Examples:
- "remind me to call mom tomorrow at 3pm" → {"activity": "Call mom", "time": "3:00 PM", "date": "2025-12-12"}
- "meeting 2morrow 2pm" → {"activity": "Meeting", "time": "2:00 PM", "date": "2025-12-12"}
- "call john at 5" → {"activity": "Call John", "time": "5:00 PM", "date": "${todayStr}"}
- "buy groceries" → {"activity": "Buy groceries", "time": "Anytime", "date": "${todayStr}"}
- "workout monday 6am" → {"activity": "Workout", "time": "6:00 AM", "date": "2025-12-15"}
- "lunch at 12" → {"activity": "Lunch", "time": "12:00 PM", "date": "${todayStr}"}
- "dentist 2:30" → {"activity": "Dentist", "time": "2:30 PM", "date": "${todayStr}"}`
        },
        {
          role: "user",
          content: taskInput
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("AI parsing failed:", error);
    // Fallback to simple regex parsing
    return null;
  }
}

/**
 * POST /api/daily-tasks/custom
 * Add a custom task for the user
 * Body: { userId, taskInput } where taskInput can be natural language
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

    // Try AI parsing first for natural language understanding
    let time, activity, taskDate;
    const aiParsed = await parseTaskWithAI(taskInput);

    if (aiParsed) {
      time = aiParsed.time || "Anytime";
      activity = aiParsed.activity || taskInput.trim();
      taskDate = aiParsed.date || new Date().toISOString().split('T')[0];
    } else {
      // Fallback to simple regex parsing
      const timeMatch = taskInput.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–]?\s*(.+)$/);
      if (timeMatch) {
        time = timeMatch[1].trim();
        activity = timeMatch[2].trim();
      } else {
        time = "Anytime";
        activity = taskInput.trim();
      }
      taskDate = new Date().toISOString().split('T')[0];
    }

    const taskId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert task into database
    const { data, error } = await supabase
      .from('nervi_daily_tasks')
      .insert({
        user_id: userId,
        task_id: taskId,
        task_date: taskDate,
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
 * PATCH /api/daily-tasks/custom
 * Edit an existing task (both custom and AI-generated)
 * Body: { userId, taskId, updates: { time?, activity?, why? } }
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, taskId, updates } = body;

    if (!userId || !taskId || !updates) {
      return NextResponse.json(
        { error: "Missing userId, taskId, or updates" },
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

    // Build the update object - only include provided fields
    const updateFields = {};
    if (updates.time !== undefined) updateFields.time = updates.time;
    if (updates.activity !== undefined) updateFields.activity = updates.activity;
    if (updates.why !== undefined) updateFields.why = updates.why;

    // Update task in database
    const { data, error } = await supabase
      .from('nervi_daily_tasks')
      .update(updateFields)
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('task_date', today)
      .select()
      .single();

    if (error) {
      logError("Failed to update task", error, { operation: "update_task" });
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    // Return updated task in frontend format
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
    logError("Failed to process PATCH request", error, { endpoint: "/api/daily-tasks/custom" });
    return NextResponse.json(
      { error: "Failed to update task" },
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

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

/**
 * GET /api/program/current?userId=xxx
 * Get the current active 2-week program with all tasks
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Get active program
    const { data: program, error: programError } = await supabase
      .from("nervi_programs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (programError || !program) {
      // No active program
      return NextResponse.json({
        program: null,
        days: [],
        message: "No active program found",
      });
    }

    // Get tasks for this program
    const { data: tasks, error: tasksError } = await supabase
      .from("program_tasks")
      .select("*")
      .eq("program_id", program.id)
      .order("task_date", { ascending: true })
      .order("task_order", { ascending: true });

    if (tasksError) {
      return NextResponse.json(
        { error: "Failed to load tasks" },
        { status: 500 }
      );
    }

    // Group tasks by day
    const dayMap = {};
    for (const task of tasks || []) {
      if (!dayMap[task.task_date]) {
        dayMap[task.task_date] = {
          date: task.task_date,
          dayNumber: Object.keys(dayMap).length + 1,
          tasks: [],
        };
      }
      dayMap[task.task_date].tasks.push(task);
    }

    const days = Object.values(dayMap);

    return NextResponse.json({
      program: {
        ...program,
        focus_points: JSON.parse(program.focus_points || '[]'),
      },
      days,
    });

  } catch (error) {
    console.error("Error fetching current program:", error);
    return NextResponse.json(
      { error: "Failed to fetch program" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/program/current
 * Get the current active 2-week program with all tasks
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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

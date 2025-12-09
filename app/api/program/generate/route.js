import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { extractUserProfile, generate14DayProgram } from "../../../../lib/programGenerator";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/program/generate
 * Generate a new 2-week nervous system program for the authenticated user
 *
 * Optional body:
 * {
 *   force Phase?: 'A' | 'B' | 'C'  // For debugging/testing
 * }
 */
export async function POST(request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const forcePhase = body.forcePhase;

    console.log(`Generating program for user ${userId}${forcePhase ? ` (forced phase: ${forcePhase})` : ''}`);

    // Step 1: Get previous program for context (to avoid exact repetition)
    const previousProgram = await getPreviousProgram(userId);

    // Step 2: Extract user's nervous system profile using LLM
    console.log("Extracting user profile...");
    const profile = await extractUserProfile(userId, forcePhase);
    console.log(`Profile extracted - Phase: ${profile.phase}`);

    // Step 3: Generate 14-day program using LLM
    console.log("Generating 14-day program...");
    const programData = await generate14DayProgram(userId, profile, previousProgram);
    console.log("Program generated successfully");

    // Step 4: Calculate start and end dates
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 14 days total

    // Step 5: Get next version number
    const { data: existingPrograms } = await supabase
      .from("nervi_programs")
      .select("version")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existingPrograms?.length > 0
      ? existingPrograms[0].version + 1
      : 1;

    // Step 6: Create new program row
    const { data: newProgram, error: programError } = await supabase
      .from("nervi_programs")
      .insert({
        user_id: userId,
        version: nextVersion,
        phase: profile.phase,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        summary: programData.program_summary,
        focus_points: JSON.stringify(programData.focus_points || []),
        previous_program_summary: previousProgram?.summary || null,
        is_active: true, // Trigger will deactivate old programs
      })
      .select()
      .single();

    if (programError) {
      console.error("Error creating program:", programError);
      return NextResponse.json(
        { error: "Failed to save program" },
        { status: 500 }
      );
    }

    console.log(`Created program ${newProgram.id}, version ${nextVersion}`);

    // Step 7: Create tasks for all 14 days
    const tasks = [];
    for (const day of programData.days) {
      for (const task of day.tasks) {
        tasks.push({
          program_id: newProgram.id,
          user_id: userId,
          task_date: day.date,
          task_order: task.task_order,
          title: task.title,
          task_type: task.task_type,
          time_block: task.time_block,
          scheduled_time: task.scheduled_time,
          duration_minutes: task.duration_minutes || 10,
          why_text: task.why_text,
          instructions: task.instructions || null,
          phase: profile.phase,
          plan_version: nextVersion,
        });
      }
    }

    const { error: tasksError } = await supabase
      .from("program_tasks")
      .insert(tasks);

    if (tasksError) {
      console.error("Error creating tasks:", tasksError);
      // Program was created but tasks failed - this is a problem
      return NextResponse.json(
        { error: "Failed to save program tasks" },
        { status: 500 }
      );
    }

    console.log(`Created ${tasks.length} tasks for program`);

    // Step 8: Return the program with tasks grouped by day
    const response = await formatProgramResponse(newProgram.id);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("Error generating program:", error);
    return NextResponse.json(
      {
        error: "Failed to generate program",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getPreviousProgram(userId) {
  const { data } = await supabase
    .from("nervi_programs")
    .select("id, summary, version")
    .eq("user_id", userId)
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  // Get a summary of key practices from previous program
  const { data: previousTasks } = await supabase
    .from("program_tasks")
    .select("title, task_type")
    .eq("program_id", data.id)
    .limit(20);

  return {
    summary: data.summary,
    key_practices: previousTasks?.map(t => t.title) || [],
  };
}

async function formatProgramResponse(programId) {
  // Get program
  const { data: program } = await supabase
    .from("nervi_programs")
    .select("*")
    .eq("id", programId)
    .single();

  // Get tasks grouped by date
  const { data: tasks } = await supabase
    .from("program_tasks")
    .select("*")
    .eq("program_id", programId)
    .order("task_date", { ascending: true })
    .order("task_order", { ascending: true });

  // Group tasks by day
  const dayMap = {};
  for (const task of tasks || []) {
    if (!dayMap[task.task_date]) {
      dayMap[task.task_date] = {
        date: task.task_date,
        tasks: [],
      };
    }
    dayMap[task.task_date].tasks.push(task);
  }

  const days = Object.values(dayMap);

  return {
    program: {
      ...program,
      focus_points: JSON.parse(program.focus_points || '[]'),
    },
    days,
  };
}

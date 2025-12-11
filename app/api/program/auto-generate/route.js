import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { extractUserProfile, generate14DayProgram } from "../../../../lib/programGenerator";
import { logInfo, logError } from "../../../../lib/logger";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/program/auto-generate
 * Auto-generate next program for users whose current program is ending soon
 * Called by Vercel Cron every Wednesday
 *
 * Logic:
 * - Runs on Wednesdays (3 days before Sunday)
 * - Finds users with active programs ending in ≤ 4 days
 * - Generates next 14-day program for those users
 */
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 3 = Wednesday

    logInfo(`Auto-generate cron triggered. Day of week: ${dayOfWeek}`, {
      operation: "program_auto_generate",
      day: today.toISOString().split('T')[0]
    });

    // Calculate the date 4 days from now (Wed + 4 days = Sunday)
    const fourDaysFromNow = new Date(today);
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    const fourDaysFromNowStr = fourDaysFromNow.toISOString().split('T')[0];

    // Find all active programs ending within 4 days
    const { data: endingPrograms, error: queryError } = await supabase
      .from("nervi_programs")
      .select("id, user_id, end_date, version")
      .eq("is_active", true)
      .lte("end_date", fourDaysFromNowStr)
      .order("end_date", { ascending: true });

    if (queryError) {
      logError("Failed to query ending programs", queryError, {
        operation: "program_auto_generate"
      });
      return NextResponse.json(
        { error: "Failed to query programs" },
        { status: 500 }
      );
    }

    if (!endingPrograms || endingPrograms.length === 0) {
      logInfo("No programs ending soon - no auto-generation needed", {
        operation: "program_auto_generate"
      });
      return NextResponse.json({
        ok: true,
        message: "No programs ending soon",
        programsGenerated: 0,
      });
    }

    logInfo(`Found ${endingPrograms.length} programs ending soon`, {
      operation: "program_auto_generate",
      count: endingPrograms.length
    });

    // Generate next program for each user
    const results = [];
    for (const program of endingPrograms) {
      try {
        logInfo(`Generating next program for user ${program.user_id}`, {
          operation: "program_auto_generate",
          userId: program.user_id,
          currentVersion: program.version
        });

        // Get previous program summary
        const { data: previousTasks } = await supabase
          .from("program_tasks")
          .select("title, task_type")
          .eq("program_id", program.id)
          .limit(20);

        const previousProgram = {
          summary: `Previous program (Version ${program.version})`,
          key_practices: previousTasks?.map(t => t.title) || [],
        };

        // Extract user profile
        const profile = await extractUserProfile(program.user_id);

        // Generate new 14-day program
        const programData = await generate14DayProgram(
          program.user_id,
          profile,
          previousProgram
        );

        // Calculate new start/end dates (starts the day after current program ends)
        const startDate = new Date(program.end_date);
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13); // 14 days total

        const nextVersion = program.version + 1;

        // Create new program
        const { data: newProgram, error: createError } = await supabase
          .from("nervi_programs")
          .insert({
            user_id: program.user_id,
            version: nextVersion,
            phase: profile.phase,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            summary: programData.program_summary,
            focus_points: JSON.stringify(programData.focus_points || []),
            previous_program_summary: previousProgram.summary,
            is_active: false, // Will become active when current program ends
          })
          .select()
          .single();

        if (createError) {
          logError(`Failed to create program for user ${program.user_id}`, createError, {
            operation: "program_auto_generate",
            userId: program.user_id
          });
          results.push({
            userId: program.user_id,
            success: false,
            error: createError.message
          });
          continue;
        }

        // Create tasks for the new program
        const tasks = [];
        for (const day of programData.days) {
          for (const task of day.tasks) {
            tasks.push({
              program_id: newProgram.id,
              user_id: program.user_id,
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
          logError(`Failed to create tasks for user ${program.user_id}`, tasksError, {
            operation: "program_auto_generate",
            userId: program.user_id,
            programId: newProgram.id
          });
          results.push({
            userId: program.user_id,
            success: false,
            error: tasksError.message
          });
          continue;
        }

        logInfo(`Successfully generated program version ${nextVersion} for user ${program.user_id}`, {
          operation: "program_auto_generate",
          userId: program.user_id,
          version: nextVersion,
          programId: newProgram.id
        });

        results.push({
          userId: program.user_id,
          success: true,
          programId: newProgram.id,
          version: nextVersion,
          startDate: startDate.toISOString().split('T')[0],
        });

      } catch (error) {
        logError(`Error generating program for user ${program.user_id}`, error, {
          operation: "program_auto_generate",
          userId: program.user_id
        });
        results.push({
          userId: program.user_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    logInfo(`Auto-generation complete: ${successCount}/${results.length} successful`, {
      operation: "program_auto_generate",
      successCount,
      totalCount: results.length
    });

    return NextResponse.json({
      ok: true,
      programsGenerated: successCount,
      results,
    });

  } catch (error) {
    logError("Unexpected error in auto-generate", error, {
      endpoint: "/api/program/auto-generate"
    });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

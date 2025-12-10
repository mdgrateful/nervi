import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabase } from "../../../../lib/supabase";

/**
 * GET /api/program/status
 * Check if user has enough data to generate a program
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const userId = session.user.id;

    // Check for existing active program
    const { data: activeProgram } = await supabase
      .from("nervi_programs")
      .select("id, version, phase, created_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    // Count recent data points
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [memoryCount, noteCount, checkinCount] = await Promise.all([
      supabase
        .from("nervi_memories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("nervi_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("checkin_date", thirtyDaysAgo.toISOString())
        .catch(() => ({ count: 0 })) // table might not exist
    ]);

    const totalDataPoints = (memoryCount.count || 0) + (noteCount.count || 0) + (checkinCount.count || 0);

    // Determine if enough data exists
    const hasEnoughData = totalDataPoints >= 5; // Minimum 5 data points
    const recommendedPhase = totalDataPoints < 10 ? 'A' : (totalDataPoints < 20 ? 'B' : 'B'); // Start conservative

    let reasoning = "";
    if (totalDataPoints < 5) {
      reasoning = "Not quite ready yet. Have a few more conversations with Nervi to build your program.";
    } else if (totalDataPoints < 10) {
      reasoning = `You have ${totalDataPoints} days of conversations. Ready to build your first stabilization program (Phase A).`;
    } else {
      reasoning = `You have ${totalDataPoints} conversations and check-ins. Ready to build a personalized program based on your patterns.`;
    }

    return NextResponse.json({
      hasActiveProgram: !!activeProgram,
      activeProgram: activeProgram || null,
      hasEnoughData,
      recommendedPhase,
      reasoning,
      dataPoints: {
        memories: memoryCount.count || 0,
        notes: noteCount.count || 0,
        checkins: checkinCount.count || 0,
        total: totalDataPoints,
      },
    });

  } catch (error) {
    console.error("Error checking program status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

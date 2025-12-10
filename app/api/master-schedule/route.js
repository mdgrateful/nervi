import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// Default empty weekly schedule structure
function makeDefaultSchedule() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return {
    version: 1,
    days: days.map((d) => ({
      key: d,
      label: d[0].toUpperCase() + d.slice(1),
      blocks: [], // each block is a short string describing an activity
    })),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

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

    const { data, error } = await supabase
      .from("nervi_master_schedules")
      .select("id, schedule")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading master schedule:", error);
      return NextResponse.json(
        { error: "Error loading master schedule" },
        { status: 500 }
      );
    }

    if (!data) {
      // No schedule yet → return a default empty one
      return NextResponse.json({
        schedule: makeDefaultSchedule(),
        exists: false,
      });
    }

    return NextResponse.json({
      schedule: data.schedule || makeDefaultSchedule(),
      exists: true,
    });
  } catch (err) {
    console.error("Unexpected error in /api/master-schedule GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, schedule } = body || {};

    if (!userId || !schedule) {
      return NextResponse.json(
        { error: "Missing userId or schedule" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Does a schedule already exist?
    const { data: existing, error: fetchError } = await supabase
      .from("nervi_master_schedules")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing master schedule:", fetchError);
      return NextResponse.json(
        { error: "Error checking existing schedule" },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();

    if (existing) {
      // Update existing schedule
      const { error: updateError } = await supabase
        .from("nervi_master_schedules")
        .update({
          schedule,
          updated_at: nowIso,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating master schedule:", updateError);
        return NextResponse.json(
          { error: "Error updating master schedule" },
          { status: 500 }
        );
      }
    } else {
      // Insert new schedule
      const { error: insertError } = await supabase
        .from("nervi_master_schedules")
        .insert([
          {
            user_id: userId,
            schedule,
            created_at: nowIso,
            updated_at: nowIso,
          },
        ]);

      if (insertError) {
        console.error("Error creating master schedule:", insertError);
        return NextResponse.json(
          { error: "Error creating master schedule" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/master-schedule POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

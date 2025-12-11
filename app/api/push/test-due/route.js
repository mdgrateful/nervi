import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

// Test endpoint to debug why notifications aren't working
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const windowMinutes = 5; // 5 minute window for testing

    // Get user's daily tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from("nervi_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", today);

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // Get user's push subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("nervi_push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    // Parse times and check which tasks would trigger
    function getMinutesFromLine(line) {
      if (!line) return Number.POSITIVE_INFINITY;
      const match = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
      if (!match) return Number.POSITIVE_INFINITY;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3] ? match[3].toUpperCase() : null;
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      if (!period) hours = Math.max(0, Math.min(23, hours));
      return hours * 60 + minutes;
    }

    const taskAnalysis = tasksData?.map(task => {
      const taskMinutes = getMinutesFromLine(task.time);
      const withinWindow = taskMinutes >= nowMinutes && taskMinutes <= nowMinutes + windowMinutes;
      const minutesUntil = taskMinutes - nowMinutes;

      return {
        activity: task.activity,
        time: task.time,
        completed: task.completed,
        taskMinutes,
        withinWindow,
        minutesUntil,
        wouldTrigger: withinWindow && !task.completed
      };
    }) || [];

    return NextResponse.json({
      debug: {
        now: now.toISOString(),
        localTime: now.toString(),
        today,
        nowMinutes,
        nowTime: `${Math.floor(nowMinutes / 60)}:${String(nowMinutes % 60).padStart(2, '0')}`,
        windowMinutes,
      },
      hasPushSubscription: subs && subs.length > 0,
      subscriptions: subs,
      totalTasks: tasksData?.length || 0,
      tasks: taskAnalysis,
      tasksInWindow: taskAnalysis.filter(t => t.wouldTrigger),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const intensity = searchParams.get("intensity") || "honest-kind";

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

    // Gather all necessary data in parallel
    const [
      recentNotes,
      recentCheckins,
      dayOfWeekPattern,
      triggers,
      buffers,
      todayMicroActions,
    ] = await Promise.all([
      getRecentNotes(userId, 14), // last 2 weeks
      getRecentCheckins(userId, 7), // last week
      getDayOfWeekPattern(userId, new Date().getDay()),
      getUserTriggers(userId),
      getUserBuffers(userId),
      getTodayMicroActions(userId),
    ]);

    // Generate personalized daily read
    const dailyRead = generateDailyRead({
      userId,
      recentNotes,
      recentCheckins,
      dayOfWeekPattern,
      triggers,
      buffers,
      todayMicroActions,
      intensity,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    });

    return NextResponse.json(dailyRead);
  } catch (err) {
    console.error("Unexpected error in /api/nervi-daily-read GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

async function getRecentNotes(userId, days) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from("nervi_notes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recent notes:", error);
    return [];
  }

  return data || [];
}

async function getRecentCheckins(userId, days) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .gte("checkin_date", sinceDate.toISOString().split('T')[0])
    .order("checkin_date", { ascending: false });

  if (error) {
    console.error("Error fetching recent check-ins:", error);
    return [];
  }

  return data || [];
}

async function getDayOfWeekPattern(userId, dayOfWeek) {
  const { data, error } = await supabase
    .from("day_of_week_patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (error) {
    return null;
  }

  return data;
}

async function getUserTriggers(userId) {
  const { data, error } = await supabase
    .from("user_triggers_buffers")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "trigger")
    .order("confidence_score", { ascending: false });

  if (error) {
    console.error("Error fetching triggers:", error);
    return [];
  }

  return data || [];
}

async function getUserBuffers(userId) {
  const { data, error } = await supabase
    .from("user_triggers_buffers")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "buffer")
    .order("confidence_score", { ascending: false });

  if (error) {
    console.error("Error fetching buffers:", error);
    return [];
  }

  return data || [];
}

async function getTodayMicroActions(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("micro_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_date", today)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching today's micro-actions:", error);
    return [];
  }

  return data || [];
}

function generateDailyRead(context) {
  const {
    recentNotes,
    recentCheckins,
    dayOfWeekPattern,
    triggers,
    buffers,
    dayOfWeek,
    intensity,
  } = context;

  return {
    todaysTheme: buildTheme({
      dayOfWeek,
      dayOfWeekPattern,
      recentCheckins,
      recentNotes,
      intensity,
    }),
    watchFor: buildWatchFors({
      dayOfWeekPattern,
      triggers,
      recentNotes,
      intensity,
    }),
    whatHelps: buildHelpers({
      buffers,
      recentNotes,
      dayOfWeekPattern,
    }),
    tinyPact: buildTinyPact({
      triggers,
      buffers,
      recentNotes,
    }),
    microAction: suggestMicroAction({
      recentNotes,
      recentCheckins,
      buffers,
    }),
  };
}

function buildTheme({ dayOfWeek, dayOfWeekPattern, recentCheckins, recentNotes, intensity }) {
  // Check for poor sleep streak
  const poorSleepStreak = recentCheckins.filter(
    (c) => c.sleep_quality === "poor"
  ).length;

  if (poorSleepStreak >= 3) {
    return intensity === "light-gentle"
      ? "Today might call for extra gentleness."
      : "Likely a vulnerability hangover day after rough sleep.";
  }

  // Check day-of-week pattern
  if (dayOfWeekPattern?.common_theme) {
    return `${dayOfWeek}s tend to be "${dayOfWeekPattern.common_theme}" days for you.`;
  }

  // Check recent stress levels
  const stressWords = ["anxious", "overwhelmed", "tense", "frazzled", "stressed"];
  const recentStates = recentNotes.slice(0, 5).map((n) => n.feeling?.toLowerCase() || "");
  const stressCount = recentStates.filter((s) =>
    stressWords.some((w) => s.includes(w))
  ).length;

  if (stressCount >= 3) {
    return intensity === "light-gentle"
      ? "You've been carrying a lot this week."
      : "You've been running hot this week. Today might need extra softness.";
  }

  // Default
  return "A fresh day. Let's keep your nervous system in the driver's seat.";
}

function buildWatchFors({ dayOfWeekPattern, triggers, recentNotes, intensity }) {
  const watchFors = [];

  // Time-based patterns from day-of-week data
  if (dayOfWeekPattern?.time_patterns?.length > 0) {
    const patterns = dayOfWeekPattern.time_patterns;
    if (patterns.includes("afternoon-slump")) {
      watchFors.push("Around 3-5pm you often get tired + guilty and start doom-scrolling.");
    }
    if (patterns.includes("morning-anxiety")) {
      watchFors.push("Mornings can bring up 'what if' spirals before you've even started.");
    }
  }

  // Trigger-based warnings
  const topTriggers = triggers.slice(0, 2);
  topTriggers.forEach((trigger) => {
    if (trigger.name === "last-minute-changes") {
      watchFors.push("When plans change last minute, you tend to jump to 'I'm failing' and shut down.");
    } else if (trigger.name === "criticism") {
      watchFors.push("Critical feedback can send you into a shame spiral. Notice if that's happening.");
    } else if (trigger.name === "being-ignored") {
      watchFors.push("Being overlooked or ignored can trigger old 'I'm invisible' wounds.");
    } else {
      watchFors.push(`${trigger.name} tends to activate your nervous system.`);
    }
  });

  // Recent behavioral patterns
  const skipsMeals = recentNotes.filter(
    (n) =>
      n.activity?.toLowerCase().includes("skip") &&
      (n.activity?.toLowerCase().includes("meal") ||
        n.activity?.toLowerCase().includes("eat"))
  ).length;

  if (skipsMeals >= 2) {
    watchFors.push("You often skip meals when locked into work mode.");
  }

  // If light-gentle mode and we have harsh warnings, soften them
  if (intensity === "light-gentle" && watchFors.length > 0) {
    return watchFors.slice(0, 2); // Fewer warnings in gentle mode
  }

  return watchFors.slice(0, 3); // Max 3 watch-fors
}

function buildHelpers({ buffers, recentNotes, dayOfWeekPattern }) {
  const helpers = [];

  // Top user buffers based on confidence score
  const topBuffers = buffers.slice(0, 2);
  topBuffers.forEach((buffer) => {
    helpers.push(buffer.name);
  });

  // Day-specific helpers
  if (dayOfWeekPattern?.effective_buffers?.length > 0) {
    const dayBuffer = dayOfWeekPattern.effective_buffers[0];
    if (!helpers.includes(dayBuffer)) {
      helpers.push(dayBuffer);
    }
  }

  // Default helpers if none exist
  if (helpers.length === 0) {
    helpers.push("A 5-minute walk or stretch");
    helpers.push("3 slow, deep belly breaths");
    helpers.push("Texting one safe person instead of spiraling alone");
  }

  return helpers.slice(0, 3); // Max 3 helpers
}

function buildTinyPact({ triggers, buffers, recentNotes }) {
  const topTrigger = triggers[0];
  const topBuffer = buffers[0];

  if (topTrigger && topBuffer) {
    return {
      condition: `If you catch ${topTrigger.name}`,
      action: `pause → ${topBuffer.name} → ask 'What am I actually needing right now?'`,
    };
  }

  // Check recent notes for common pattern
  const scrollingMentions = recentNotes.filter(
    (n) =>
      n.activity?.toLowerCase().includes("scroll") ||
      n.activity?.toLowerCase().includes("social media")
  ).length;

  if (scrollingMentions >= 2) {
    return {
      condition: "If you catch yourself scrolling while anxious",
      action: "pause → 3 slow exhales → ask 'What am I actually needing right now?'",
    };
  }

  // Default pact
  return {
    condition: "If you notice activation rising",
    action: "pause → name the feeling → 3 deep breaths → choose one small next step",
  };
}

function suggestMicroAction({ recentNotes, recentCheckins, buffers }) {
  // Check recent stress levels
  const stressWords = ["anxious", "overwhelmed", "tense", "frazzled"];
  const recentStates = recentNotes.slice(0, 3).map((n) => n.feeling?.toLowerCase() || "");
  const isStressed = recentStates.some((s) =>
    stressWords.some((w) => s.includes(w))
  );

  if (isStressed) {
    return {
      text: "Walk me through a 3-minute reset now",
      action: "reset-flow",
    };
  }

  // Check if they've been tracking consistently
  const hasRecentCheckins = recentCheckins.length >= 3;
  if (!hasRecentCheckins) {
    return {
      text: "Set a quick check-in reminder for this afternoon",
      action: "schedule-checkin",
    };
  }

  // Default action
  return {
    text: "Help me plan a nervous system check-in for later",
    action: "schedule-checkin",
  };
}

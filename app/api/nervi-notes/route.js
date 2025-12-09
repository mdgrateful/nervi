import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectTriggers, detectBuffers } from "../../utils/patternLearning";
import { logError, logInfo } from "../../../lib/logger";
import { sanitizeInput, sanitizeTextContent, isValidUUID } from "../../../lib/validation";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get("userId");

    if (!rawUserId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Sanitize and validate userId
    const userId = sanitizeInput(rawUserId, 100);

    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Get all notes for user, sorted by date
    const { data: notes, error } = await supabase
      .from("nervi_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error loading notes", error, { operation: "get_notes" });
      return NextResponse.json(
        { error: "Error loading notes" },
        { status: 500 }
      );
    }

    // Analyze patterns from notes
    const patterns = analyzePatterns(notes || []);

    return NextResponse.json({
      notes: notes || [],
      patterns,
    });
  } catch (err) {
    logError("Unexpected error in nervi-notes GET endpoint", err, { endpoint: "/api/nervi-notes GET" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId: rawUserId, activity: rawActivity, feeling: rawFeeling, location: rawLocation, action, noteId } = body || {};

    if (!rawUserId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Sanitize and validate userId
    const userId = sanitizeInput(rawUserId, 100);

    if (!userId.startsWith("dev-") && !isValidUUID(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Handle delete action
    if (action === "delete" && noteId) {
      const sanitizedNoteId = sanitizeInput(noteId, 100);

      const { error: deleteError } = await supabase
        .from("nervi_notes")
        .delete()
        .eq("id", sanitizedNoteId)
        .eq("user_id", userId);

      if (deleteError) {
        logError("Error deleting note", deleteError, { operation: "delete_note" });
        return NextResponse.json(
          { error: "Error deleting note" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Sanitize text inputs (allow longer content for user notes)
    const activity = rawActivity ? sanitizeTextContent(rawActivity, 500) : null;
    const feeling = rawFeeling ? sanitizeTextContent(rawFeeling, 500) : null;
    const location = rawLocation ? sanitizeTextContent(rawLocation, 200) : null;

    // Save new note
    if (!activity && !feeling && !location) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error: insertError } = await supabase
      .from("nervi_notes")
      .insert([
        {
          user_id: userId,
          activity: activity || null,
          feeling: feeling || null,
          body_location: location || null,
          created_at: nowIso,
        },
      ]);

    if (insertError) {
      logError("Error creating note", insertError, { operation: "create_note" });
      return NextResponse.json(
        { error: "Error creating note" },
        { status: 500 }
      );
    }

    // Auto-learn triggers and buffers from this note
    try {
      const note = {
        activity: activity || null,
        feeling: feeling || null,
        body_location: location || null,
      };

      const triggers = detectTriggers(note);
      const buffers = detectBuffers(note);

      // Increment confidence for detected triggers
      for (const trigger of triggers) {
        await supabase
          .from("user_triggers_buffers")
          .upsert(
            {
              user_id: userId,
              type: "trigger",
              name: trigger,
              last_observed: nowIso,
            },
            {
              onConflict: "user_id,type,name",
              ignoreDuplicates: false,
            }
          )
          .then(async ({ data: existing }) => {
            if (existing) {
              await supabase
                .from("user_triggers_buffers")
                .update({
                  confidence_score: (existing.confidence_score || 1) + 1,
                  last_observed: nowIso,
                })
                .eq("user_id", userId)
                .eq("type", "trigger")
                .eq("name", trigger);
            }
          });
      }

      // Increment confidence for detected buffers
      for (const buffer of buffers) {
        await supabase
          .from("user_triggers_buffers")
          .upsert(
            {
              user_id: userId,
              type: "buffer",
              name: buffer,
              last_observed: nowIso,
            },
            {
              onConflict: "user_id,type,name",
              ignoreDuplicates: false,
            }
          )
          .then(async ({ data: existing }) => {
            if (existing) {
              await supabase
                .from("user_triggers_buffers")
                .update({
                  confidence_score: (existing.confidence_score || 1) + 1,
                  last_observed: nowIso,
                })
                .eq("user_id", userId)
                .eq("type", "buffer")
                .eq("name", buffer);
            }
          });
      }
    } catch (learnError) {
      logError("Error auto-learning patterns", learnError, { operation: "pattern_learning" });
      // Don't fail the request if learning fails
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("Unexpected error in nervi-notes POST endpoint", err, { endpoint: "/api/nervi-notes POST" });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// Simple pattern analysis
function analyzePatterns(notes) {
  if (!notes || notes.length === 0) {
    return {
      totalNotes: 0,
      patterns: [],
      insights: ["Keep logging notes to discover patterns in your nervous system responses."],
    };
  }

  const patterns = [];
  const insights = [];

  // Feeling frequency
  const feelings = {};
  const bodyLocations = {};
  const activities = {};

  notes.forEach(note => {
    if (note.feeling) {
      feelings[note.feeling.toLowerCase()] = (feelings[note.feeling.toLowerCase()] || 0) + 1;
    }
    if (note.body_location) {
      bodyLocations[note.body_location.toLowerCase()] = (bodyLocations[note.body_location.toLowerCase()] || 0) + 1;
    }
    if (note.activity) {
      activities[note.activity.toLowerCase()] = (activities[note.activity.toLowerCase()] || 0) + 1;
    }
  });

  // Most common feeling
  const topFeeling = Object.entries(feelings).sort((a, b) => b[1] - a[1])[0];
  if (topFeeling && topFeeling[1] >= 3) {
    patterns.push({
      type: "feeling",
      pattern: `You've reported feeling "${topFeeling[0]}" ${topFeeling[1]} times`,
      frequency: topFeeling[1],
    });
    insights.push(`"${topFeeling[0]}" appears frequently in your notes. This may be a baseline state for you.`);
  }

  // Most common body location
  const topLocation = Object.entries(bodyLocations).sort((a, b) => b[1] - a[1])[0];
  if (topLocation && topLocation[1] >= 3) {
    patterns.push({
      type: "body",
      pattern: `You often notice sensations in: ${topLocation[0]}`,
      frequency: topLocation[1],
    });
    insights.push(`Your ${topLocation[0]} is a common place where you feel activation. This is a key somatic marker to track.`);
  }

  // Stress indicators
  const stressWords = ["anxious", "stressed", "overwhelmed", "tense", "worried", "panic"];
  const stressCount = notes.filter(n =>
    stressWords.some(word =>
      (n.feeling && n.feeling.toLowerCase().includes(word)) ||
      (n.activity && n.activity.toLowerCase().includes(word))
    )
  ).length;

  if (stressCount >= 3) {
    patterns.push({
      type: "activation",
      pattern: `Stress-related notes: ${stressCount} times`,
      frequency: stressCount,
    });
    insights.push(`${stressCount} notes mention stress/anxiety. Consider tracking what happens before these moments.`);
  }

  // Recent trend (last 7 days vs older)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentNotes = notes.filter(n => new Date(n.created_at) > weekAgo);

  if (recentNotes.length >= 3) {
    insights.push(`You've logged ${recentNotes.length} notes this week. Consistency helps identify patterns!`);
  }

  return {
    totalNotes: notes.length,
    patterns,
    insights,
  };
}

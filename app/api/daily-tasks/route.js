import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { logError } from "../../../lib/logger";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

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

    if (!supabase || !openai) {
      return NextResponse.json(
        { error: "Services not configured" },
        { status: 500 }
      );
    }

    // Gather user context from multiple sources
    const userContext = await gatherUserContext(userId);

    // Generate personalized daily tasks with AI
    const tasks = await generatePersonalizedTasks(userId, userContext);

    return NextResponse.json({
      success: true,
      tasks,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to generate daily tasks", error, { endpoint: "/api/daily-tasks" });
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 }
    );
  }
}

async function gatherUserContext(userId) {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  try {
    // 1. Recent conversations (last 14 days, max 50 messages)
    const { data: recentChats } = await supabase
      .from("nervi_memories")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    // 2. Recent check-ins (last 7 days)
    const { data: recentCheckins } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("checkin_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("checkin_date", { ascending: false });

    // 3. Recent notes (last 14 days)
    const { data: recentNotes } = await supabase
      .from("nervi_notes")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    // 4. Identified patterns (triggers & buffers)
    const { data: triggers } = await supabase
      .from("user_triggers_buffers")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "trigger")
      .order("confidence_score", { ascending: false })
      .limit(10);

    const { data: buffers } = await supabase
      .from("user_triggers_buffers")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "buffer")
      .order("confidence_score", { ascending: false })
      .limit(10);

    // 5. Life story context (recent events and active threads)
    const { data: lifeEvents } = await supabase
      .from("nervi_life_events")
      .select("*, chapter:nervi_life_chapters(name, dominant_state)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: lifeThreads } = await supabase
      .from("nervi_life_threads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. User profile for work schedule context
    const { data: userProfile } = await supabase
      .from("users")
      .select("work_start_time, work_end_time, allow_work_notifications, state")
      .eq("user_id", userId)
      .single();

    return {
      dayOfWeek,
      today: today.toISOString().split("T")[0],
      recentChats: recentChats || [],
      recentCheckins: recentCheckins || [],
      recentNotes: recentNotes || [],
      triggers: triggers || [],
      buffers: buffers || [],
      lifeEvents: lifeEvents || [],
      lifeThreads: lifeThreads || [],
      userProfile: userProfile || {},
    };
  } catch (error) {
    logError("Failed to gather user context for daily tasks", error, { operation: "gather_user_context" });
    return {
      dayOfWeek,
      today: today.toISOString().split("T")[0],
      recentChats: [],
      recentCheckins: [],
      recentNotes: [],
      triggers: [],
      buffers: [],
      lifeEvents: [],
      lifeThreads: [],
      userProfile: {},
    };
  }
}

async function generatePersonalizedTasks(userId, context) {
  const systemPrompt = `You are Nervi, a trauma-informed nervous system clinician with deep expertise in polyvagal theory, somatic experiencing, and autonomic nervous system regulation. Generate a detailed, personalized nervous system care plan for today.

REQUIREMENTS:
1. ALWAYS start with hydration - critical for nervous system conductivity
2. Generate 4-6 specific nervous system regulation practices tied to THIS user's patterns
3. Each "activity" field MUST include DETAILED STEP-BY-STEP INSTRUCTIONS on how to do the practice
4. Connect each practice to specific user data: their emotions, body sensations, conversations, or patterns
5. Use clinical nervous system language referencing: vagal tone, polyvagal states, sympathetic/parasympathetic balance, somatic tracking, window of tolerance, co-regulation, neuroception

STRICTLY AVOID:
- EMDR or EFT techniques (we don't use these modalities)
- Vague practice names without instructions (e.g., "5-minute bilateral tapping" with no explanation of HOW)
- Generic wellness advice that could apply to anyone

NERVOUS SYSTEM PRACTICES TO DRAW FROM:
- Vagal nerve stimulation: humming, gargling, singing, cold water on face, massage
- Bilateral stimulation: alternating knee taps, butterfly taps, cross-lateral walking, figure-8 movements
- Orienting: slow head turns to scan environment, name 5 things you see
- Grounding: feet on floor awareness, hands pressed together, progressive muscle release
- Breath work: box breathing (4-4-4-4), physiological sigh (2 inhales + long exhale), extended exhale (4-in, 8-out)
- Somatic tracking: body scan with noticing (not fixing), pendulation between tension and ease
- Polyvagal anchoring: hand on heart, voo sound, self-havening (hand strokes on arms/face)
- Movement for discharge: shaking, stretching, pushing against wall, squeezing/releasing fists
- Resourcing: recall a safe memory, touch objects with different textures, gentle rocking

USER DATA:
Day: ${context.dayOfWeek}
Work schedule: ${context.userProfile.work_start_time || "Not set"} - ${context.userProfile.work_end_time || "Not set"}

Recent Check-ins:
${context.recentCheckins.map(c => `${c.checkin_date}: Body: ${c.body_state}, Emotion: ${c.emotion}`).join("\n") || "No check-ins yet"}

Recent Notes:
${context.recentNotes.map(n => `${n.activity} - Feeling: ${n.feeling}, Location: ${n.location}`).join("\n") || "No notes yet"}

Triggers:
${context.triggers.map(t => `${t.name} (${t.context})`).join("\n") || "None identified"}

Buffers:
${context.buffers.map(b => `${b.name} (${b.context})`).join("\n") || "None identified"}

Recent Conversations:
${context.recentChats.slice(0, 10).map(c => `${c.role}: ${c.content.substring(0, 150)}`).join("\n") || "No conversations yet"}

Life Events:
${context.lifeEvents.map(e => `${e.title} (Age ${e.age}) - ${e.nervous_system_state}`).join("\n") || "No events mapped"}

EXAMPLES OF WELL-FORMATTED TASKS:

{
  "time": "First thing",
  "activity": "Drink 16oz of water slowly over 5 minutes",
  "why": "Hydration is foundational for nervous system conductivity and vagal tone. Your system can't regulate well when dehydrated.",
  "dataSource": "nervous system protocol"
}

{
  "time": "Morning (9am)",
  "activity": "Box breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 5 times while sitting upright.",
  "why": "You mentioned feeling 'tight and anxious' in yesterday's check-in - that's sympathetic activation. Box breathing resets your autonomic balance by engaging the vagus nerve.",
  "dataSource": "check-in from 12/5"
}

{
  "time": "Midday (12:30pm)",
  "activity": "Bilateral knee taps: Sit down, alternately tap your knees left-right-left-right for 2 minutes. Let your torso gently sway.",
  "why": "Your Tuesday notes show you feel 'overwhelmed' around lunch. This bilateral movement helps your brain process stuck stress and integrates left-right hemispheres, calming the amygdala.",
  "dataSource": "pattern from weekly notes"
}

{
  "time": "Afternoon (3pm)",
  "activity": "Voo breath: Take a deep breath, then exhale while making a 'voooo' sound (like a foghorn) for 10 seconds. Repeat 3 times. Feel the vibration in your chest.",
  "why": "You said work calls leave you 'buzzing and can't come down' - that's sympathetic charge that needs discharge. The voo sound directly stimulates your vagus nerve and releases ventral vagal tone.",
  "dataSource": "conversation pattern"
}

{
  "time": "Evening (7pm)",
  "activity": "Self-havening: Slowly stroke your hands down your arms from shoulders to hands, 10 times per side. Use gentle, soothing pressure.",
  "why": "You've described feeling 'on edge' on ${context.dayOfWeek}s. This self-touch activates your social engagement system and signals safety to your nervous system through C-tactile afferents.",
  "dataSource": "weekly pattern recognition"
}

RESPONSE FORMAT (JSON):
{
  "tasks": [
    {
      "time": "specific time or general (First thing/Morning/Afternoon/Evening)",
      "activity": "DETAILED step-by-step instructions for the practice",
      "why": "Clinical explanation tying to specific user data, nervous system state, and mechanism",
      "dataSource": "where this recommendation comes from"
    }
  ]
}

Be specific. Be detailed. Be clinical. Reference their actual data. Teach them HOW to do each practice.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Generate my personalized nervous system care plan for today with detailed step-by-step instructions for each practice. Connect each recommendation to my specific patterns and data.",
        },
      ],
      temperature: 1.0, // Maximum creativity while staying grounded in data
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // Validate and return tasks
    if (response.tasks && Array.isArray(response.tasks)) {
      return response.tasks.map((task, index) => ({
        id: `task_${Date.now()}_${index}`,
        time: task.time || "",
        activity: task.activity || "",
        why: task.why || "",
        dataSource: task.dataSource || "your recent activity",
        completed: false,
      }));
    }

    return [];
  } catch (error) {
    logError("Failed to generate tasks with AI, using fallback", error, { operation: "generate_personalized_tasks" });

    // Fallback: return context-aware default tasks
    return generateFallbackTasks(context);
  }
}

function generateFallbackTasks(context) {
  const tasks = [];
  const now = new Date();
  const currentHour = now.getHours();

  // ALWAYS start with water - critical for nervous system function
  tasks.push({
    id: `task_${Date.now()}_0`,
    time: "First thing",
    activity: "Drink 16oz of water slowly over 5 minutes. Sit or stand calmly while drinking, noticing the sensation of hydration.",
    why: "Hydration is foundational for nervous system conductivity and vagal tone. Your autonomic nervous system cannot regulate effectively when dehydrated.",
    dataSource: "nervous system hydration protocol",
    completed: false,
  });

  // Morning regulation
  if (currentHour < 12) {
    tasks.push({
      id: `task_${Date.now()}_1`,
      time: "Morning",
      activity: "Extended exhale breathing: Inhale through your nose for 4 counts, exhale through your mouth for 8 counts. Repeat 5 times while sitting comfortably.",
      why: "Extended exhales (longer exhale than inhale) directly activate your vagus nerve and parasympathetic nervous system, signaling safety and shifting you out of sympathetic activation.",
      dataSource: "polyvagal regulation",
      completed: false,
    });
  }

  // Based on recent check-ins - nervous system language
  if (context.recentCheckins.length > 0) {
    const lastCheckin = context.recentCheckins[0];
    if (lastCheckin.emotion && (lastCheckin.emotion.includes("anxious") || lastCheckin.emotion.includes("stress"))) {
      tasks.push({
        id: `task_${Date.now()}_2`,
        time: "Midday",
        activity: "Bilateral knee taps: Sit comfortably, alternately tap your left knee then right knee in a steady rhythm for 2 minutes. Let your torso gently sway with the movement.",
        why: `Your recent check-in showed ${lastCheckin.emotion} - that's sympathetic nervous system activation (fight/flight). This bilateral movement helps your left and right brain hemispheres integrate and process stress, supporting a shift toward ventral vagal regulation.`,
        dataSource: "recent check-ins",
        completed: false,
      });
    } else if (lastCheckin.body_state && lastCheckin.body_state.includes("tired")) {
      tasks.push({
        id: `task_${Date.now()}_2`,
        time: "Midday",
        activity: "Restorative rest: Lie down with your feet elevated on pillows for 10 minutes. Notice sensations in your body without trying to change them - just observe.",
        why: `Your body signaled '${lastCheckin.body_state}' - that's dorsal vagal shutdown (collapse/conservation mode). This supported rest position helps blood flow while gentle somatic awareness can bring you back to connected, safe energy.`,
        dataSource: "recent check-ins",
        completed: false,
      });
    }
  }

  // Based on buffers - clinical framing
  if (context.buffers.length > 0) {
    const topBuffer = context.buffers[0];
    tasks.push({
      id: `task_${Date.now()}_3`,
      time: "Afternoon",
      activity: topBuffer.name,
      why: "This practice has shown consistent effectiveness in helping your nervous system return to regulation. Building these neural pathways strengthens your resilience over time.",
      dataSource: "identified regulation resource",
      completed: false,
    });
  }

  // Evening nervous system practice
  tasks.push({
    id: `task_${Date.now()}_4`,
    time: "Evening",
    activity: "Somatic body scan: Lie down comfortably. Slowly scan from your feet to your head, noticing sensations without trying to change them. If you find tension, just notice it and move on. 5-10 minutes.",
    why: "Evening somatic tracking teaches your nervous system it's safe to feel sensations. This builds interoceptive awareness (knowing what's happening inside) and gradually expands your window of tolerance.",
    dataSource: "somatic experiencing protocol",
    completed: false,
  });

  return tasks.slice(0, 6);
}

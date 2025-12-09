import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase URL or SERVICE_ROLE_KEY is missing in env.");
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Nervi API is reachable.",
  });
}

function extractLatestUserMessage(body) {
  // Preferred: pull from messages array
  const msgs = Array.isArray(body?.messages) ? body.messages : [];

  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (
      m &&
      m.role === "user" &&
      typeof m.content === "string" &&
      m.content.trim()
    ) {
      return m.content.trim();
    }
  }

  // Fallback: allow direct message field if you ever send it
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  return "";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      sessionId,
      programType,
      mode,
      messages,
      scheduleIntent = false,
    } = body;

    const message = extractLatestUserMessage(body);

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const effectiveUserId =
      typeof userId === "string" && userId.trim().length > 0
        ? userId.trim().slice(0, 100)
        : "anonymous";

    const effectiveSessionId =
      typeof sessionId === "string" && sessionId.trim().length > 0
        ? sessionId.trim().slice(0, 100)
        : "default-session";

    const effectiveProgramType =
      typeof programType === "string" && programType.trim().length > 0
        ? programType.trim()
        : "free";

    // 1) Load recent memories for this user (across ALL sessions for continuity)
    let memoryMessages = [];
    if (supabase) {
      // Load last 100 messages from ALL sessions in the past 30 days for long-term memory
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: rows, error } = await supabase
        .from("nervi_memories")
        .select("role, content, created_at, session_id")
        .eq("user_id", effectiveUserId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error loading memories from Supabase:", error);
      } else if (rows && rows.length > 0) {
        // Reverse to get chronological order (oldest first)
        memoryMessages = rows.reverse().map((row) => ({
          role: row.role === "assistant" ? "assistant" : "user",
          content: row.content,
        }));
      }
    } else {
      console.warn("Supabase client not initialized, skipping memory load.");
    }

    // 2) System prompt, adjusted by program + schedule intent
    const voiceMode = mode === "M" ? "M" : "F";

    const baseVoicePrompt =
      voiceMode === "F"
        ? "You are Nervi-F, a feminine, trauma-aware, nervous-system-focused AI companion. Your style is warm, nurturing, validating, and gentle. You speak like a caring, grounded mentor. You do NOT diagnose or replace therapy. You help the user notice sensations, emotions, and patterns, and you offer small, doable practices. You reassure without rescuing. Keep responses short (3–6 sentences)."
        : "You are Nervi-M, a masculine, trauma-aware, nervous-system-focused AI companion. Your style is calm, direct, structured, and encouraging. You help the user name what is happening, then move toward clear next steps and simple commitments. You do NOT diagnose or replace therapy. You focus on grounded action and nervous-system regulation, not perfection. Keep responses short (3–6 sentences).";

    let programPrompt = "";
    if (effectiveProgramType === "daily-checkin") {
      programPrompt =
        " This is the 'Daily Check-In' program. Gently guide the user through naming how they feel emotionally, physically, and mentally, then help them choose 1–2 tiny, realistic actions or comforts for the rest of today. Reflect patterns if they mention similar themes across check-ins.";
    } else if (effectiveProgramType === "somatic-reset") {
      programPrompt =
        " This is the 'Somatic Reset' program. Focus on helping the user notice body sensations, breath, posture, and simple grounding exercises. Offer very small concrete somatic steps (e.g., breath, orienting, touch, movement) instead of long analysis.";
    } else {
      programPrompt =
        " This is an open, free-form conversation. Follow the user's lead while still being trauma-aware and nervous-system-focused.";
    }

        // Explain the Master Schedule + *nervous-system-focused* scheduling philosophy.
    const schedulePrompt =
      " The user has a separate 'Master Schedule' page that holds their stable weekly routine (e.g., wake times, walks, nervous-system practices, wind-down rituals). You do NOT directly edit that schedule data structure, but you CAN propose additions which the app will merge when the user says 'Yes'." +
      " Your schedule proposals must be different from week to week, not exceed more than 5 tasks unless the user asks for more, and focused on *nervous-system regulation and capacity-building*, not chores or productivity. Favor short, body-based practices like slow breathing, orienting, tension release, micro-movements, soothing routines, grounding walks, and gentle self-reflection, not 'do laundry' or 'answer emails'." +
      "When delivering a schedule, make sure it is for a full day from that day to the next 7 days. Begin each day with something consistent, for example,drink a glass of water and speak an affirmation. Always start it off with something consistent unless noted otherwise."+
      " When the user mentions being anxious, nervous, overwhelmed, or dreading a specific upcoming event (for example a meeting, trip, conversation, or performance), you should: (1) briefly validate, (2) ask WHEN the event is (day + time), and (3) propose pre- and post-event nervous-system practices around that event. The pre-event practice should help them feel calmer, more confident, and more willing to show up; the post-event practice should help them discharge activation and integrate what actually happened.";


    const scheduleIntentPrompt = scheduleIntent
      ? " In THIS exchange, the user is asking to plan or adjust their schedule. You MUST respond with a short explanation followed by a clearly marked section titled 'Proposed additions to your schedule'. In that section, list activities grouped by day, one per line, in a simple format like 'Mon – 7:30 AM: 10-min walk' or 'Wed – 9:00 PM: 5-min stretching before bed'. Keep it modest and realistic so the user can copy-paste directly into their Master Schedule page."
      : "";

    // Life Story auto-extraction prompt
    const lifeStoryPrompt =
      " LIFE STORY TRACKING: You actively build the user's Life Story Map by extracting significant experiences and patterns. " +
      " \n\nBE AGGRESSIVE - Extract liberally! When in doubt, INCLUDE it." +
      " \n\nWHAT TO SAVE AS LIFE EVENTS:" +
      " - ANY past experience they mention (childhood, school, relationships, work, family, trauma)" +
      " - Formative moments: 'My dad left when I was young', 'I've always struggled with anxiety', 'I was bullied'" +
      " - Significant current struggles if recurring: 'I've been dealing with panic attacks', 'My marriage has been rocky for years'" +
      " - Relationship patterns: 'My ex was controlling', 'I never felt safe with my mom', 'All my relationships end the same way'" +
      " - Work/career moments: 'I got fired last year', 'I've always been a perfectionist at work'" +
      " - Health/trauma: 'I was in a car accident', 'I had a breakdown', 'I developed chronic pain'" +
      " - Explicit requests: 'add this to my life story', 'this shaped who I am'" +
      " \n\nAge Estimation (if not stated):" +
      " - 'as a kid/child' = age 8" +
      " - 'in school/middle school' = age 12" +
      " - 'in high school/as a teen' = age 16" +
      " - 'in college' = age 20" +
      " - 'in my 20s/30s/40s' = use midpoint (25, 35, 45)" +
      " - 'recently/last year/lately' = current age minus 1 (estimate from context)" +
      " \n\nWHAT NOT TO SAVE (only exclude these):" +
      " - Simple greetings: 'Hi', 'Hello', 'How are you'" +
      " - Pure questions without context: 'Can you help me?', 'What should I do?'" +
      " - Single-instance current sensations without backstory: 'My chest feels tight right this second' (but DO save if it's part of a pattern)" +
      " \n\nCRITERIA FOR THREADS/PATTERNS:" +
      " - Mentioned 2+ times across conversations: 'I freeze', 'I people-please', 'I feel abandoned'" +
      " - Explicitly stated patterns: 'I've always been anxious', 'I never feel good enough', 'I shut down in conflict'" +
      " - Relationship patterns: 'I pick unavailable partners', 'I lose myself in relationships'" +
      " \n\nFormat: '<<<LIFE_STORY_DATA>>>{\"action\":\"add_event|add_thread\",\"data\":{...}}<<<END_LIFE_STORY>>>'" +
      " For events: {title, age, chapterName, description, nervousSystemState, emotionTags[], keyBeliefs[]}" +
      " For threads: {name, description, color}";

    const systemPrompt =
      baseVoicePrompt +
      programPrompt +
      schedulePrompt +
      scheduleIntentPrompt +
      lifeStoryPrompt +
      " You are given the user's conversation history from the past 30 days (up to 100 recent messages across all sessions). This allows you to remember what they've shared previously, track patterns over time, and build continuity. Reference past conversations naturally when relevant (e.g., 'Last time you mentioned...', 'I remember you were working on...'). You are their long-term companion, not just a single-session chatbot.";

    // 3) Call OpenAI Chat Completions API
    // (Chat Completions is supported; Responses is recommended for new projects.) :contentReference[oaicite:0]{index=0}
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...memoryMessages,
          { role: "user", content: message },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const errorText = await openAiRes.text();
      console.error("OpenAI error:", errorText);
      return NextResponse.json(
        { error: "OpenAI request failed" },
        { status: 500 }
      );
    }

    const data = await openAiRes.json();
    let reply =
      data.choices?.[0]?.message?.content ??
      "I'm having trouble responding right now, but your message still matters.";

    // Extract and process life story data if present
    let lifeStoryUpdated = false;
    const lifeStoryMatch = reply.match(/<<<LIFE_STORY_DATA>>>(.*?)<<<END_LIFE_STORY>>>/s);

    if (lifeStoryMatch) {
      try {
        const lifeStoryJSON = lifeStoryMatch[1].trim();
        const lifeStoryData = JSON.parse(lifeStoryJSON);

        // Process the life story action
        if (lifeStoryData.action === "add_event" && lifeStoryData.data) {
          // First, find or create the chapter
          let chapterId = null;
          if (lifeStoryData.data.chapterName) {
            // Try to find existing chapter
            const { data: existingChapters } = await supabase
              .from("nervi_life_chapters")
              .select("id")
              .eq("user_id", effectiveUserId)
              .eq("name", lifeStoryData.data.chapterName)
              .limit(1);

            if (existingChapters && existingChapters.length > 0) {
              chapterId = existingChapters[0].id;
            } else {
              // Create new chapter
              const ageRangeStart = Math.max(0, (lifeStoryData.data.age || 0) - 5);
              const ageRangeEnd = (lifeStoryData.data.age || 0) + 5;

              const { data: newChapter } = await supabase
                .from("nervi_life_chapters")
                .insert({
                  user_id: effectiveUserId,
                  name: lifeStoryData.data.chapterName,
                  age_range_start: ageRangeStart,
                  age_range_end: ageRangeEnd,
                  dominant_state: lifeStoryData.data.nervousSystemState || "mixed",
                })
                .select()
                .single();

              if (newChapter) chapterId = newChapter.id;
            }
          }

          // Add the event
          await supabase.from("nervi_life_events").insert({
            user_id: effectiveUserId,
            chapter_id: chapterId,
            title: lifeStoryData.data.title,
            age: lifeStoryData.data.age,
            description: lifeStoryData.data.description,
            nervous_system_state: lifeStoryData.data.nervousSystemState,
            emotion_tags: lifeStoryData.data.emotionTags || [],
            key_beliefs: lifeStoryData.data.keyBeliefs || [],
          });

          lifeStoryUpdated = true;
        } else if (lifeStoryData.action === "add_thread" && lifeStoryData.data) {
          // Add a new thread/pattern
          await supabase.from("nervi_life_threads").insert({
            user_id: effectiveUserId,
            name: lifeStoryData.data.name,
            description: lifeStoryData.data.description,
            color: lifeStoryData.data.color || "#a855f7",
          });

          lifeStoryUpdated = true;
        } else if (lifeStoryData.action === "delete_event" && lifeStoryData.data?.eventId) {
          // Delete an event
          await supabase
            .from("nervi_life_events")
            .delete()
            .eq("id", lifeStoryData.data.eventId)
            .eq("user_id", effectiveUserId);

          lifeStoryUpdated = true;
        } else if (lifeStoryData.action === "delete_thread" && lifeStoryData.data?.threadId) {
          // Delete a thread
          await supabase
            .from("nervi_life_threads")
            .delete()
            .eq("id", lifeStoryData.data.threadId)
            .eq("user_id", effectiveUserId);

          lifeStoryUpdated = true;
        } else if (lifeStoryData.action === "delete_chapter" && lifeStoryData.data?.chapterId) {
          // Delete a chapter
          await supabase
            .from("nervi_life_chapters")
            .delete()
            .eq("id", lifeStoryData.data.chapterId)
            .eq("user_id", effectiveUserId);

          lifeStoryUpdated = true;
        } else if (lifeStoryData.action === "update_event" && lifeStoryData.data?.eventId) {
          // Update an event
          const updates = {};
          if (lifeStoryData.data.title) updates.title = lifeStoryData.data.title;
          if (lifeStoryData.data.age !== undefined) updates.age = lifeStoryData.data.age;
          if (lifeStoryData.data.description) updates.description = lifeStoryData.data.description;
          if (lifeStoryData.data.nervousSystemState) updates.nervous_system_state = lifeStoryData.data.nervousSystemState;
          if (lifeStoryData.data.emotionTags) updates.emotion_tags = lifeStoryData.data.emotionTags;
          if (lifeStoryData.data.keyBeliefs) updates.key_beliefs = lifeStoryData.data.keyBeliefs;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("nervi_life_events")
              .update(updates)
              .eq("id", lifeStoryData.data.eventId)
              .eq("user_id", effectiveUserId);

            lifeStoryUpdated = true;
          }
        } else if (lifeStoryData.action === "update_chapter" && lifeStoryData.data?.chapterId) {
          // Update a chapter
          const updates = {};
          if (lifeStoryData.data.name) updates.name = lifeStoryData.data.name;
          if (lifeStoryData.data.ageRangeStart !== undefined) updates.age_range_start = lifeStoryData.data.ageRangeStart;
          if (lifeStoryData.data.ageRangeEnd !== undefined) updates.age_range_end = lifeStoryData.data.ageRangeEnd;
          if (lifeStoryData.data.dominantState) updates.dominant_state = lifeStoryData.data.dominantState;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("nervi_life_chapters")
              .update(updates)
              .eq("id", lifeStoryData.data.chapterId)
              .eq("user_id", effectiveUserId);

            lifeStoryUpdated = true;
          }
        }
      } catch (e) {
        console.error("Failed to process life story data:", e);
      }

      // Remove the life story markers from the reply
      reply = reply.replace(/<<<LIFE_STORY_DATA>>>.*?<<<END_LIFE_STORY>>>/gs, "").trim();

      // Add user notification if something was saved
      if (lifeStoryUpdated) {
        reply += "\n\n✨ I've added this to your Life Story Map. You can view it on the Life Story page.";
      }
    }

    // 4) Save messages to this user + session + program
    if (supabase) {
      const { error: insertError } = await supabase
        .from("nervi_memories")
        .insert([
          {
            user_id: effectiveUserId,
            session_id: effectiveSessionId,
            program_type: effectiveProgramType,
            role: "user",
            content: message,
          },
          {
            user_id: effectiveUserId,
            session_id: effectiveSessionId,
            program_type: effectiveProgramType,
            role: "assistant",
            content: reply,
          },
        ]);

      if (insertError) {
        console.error("Error saving memories to Supabase:", insertError);
      }
    } else {
      console.warn("Supabase client not initialized, skipping memory save.");
    }

    return NextResponse.json({ reply, scheduleIntent });
  } catch (err) {
    console.error("Unexpected error in /api/nervi POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

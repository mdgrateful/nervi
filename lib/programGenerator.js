import OpenAI from "openai";
import { supabase } from "./supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract nervous system profile from user's conversation history
 * Uses GPT-4 to analyze patterns, states, triggers from memories/notes
 *
 * @param {string} userId - The user's ID
 * @param {string} forcePhase - Optional phase override for debugging ('A', 'B', or 'C')
 * @returns {Promise<Object>} Profile with phase, states, triggers, body signals, narrative
 */
export async function extractUserProfile(userId, forcePhase = null) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    // Gather recent conversation data
    const [memories, notes, lifeStory, profile] = await Promise.all([
      getRecentMemories(userId, 30), // Last 30 days
      getRecentNotes(userId, 30),
      getLifeStorySnippets(userId),
      getUserProfile(userId),
    ]);

    // Build context for LLM
    const context = buildProfileContext(memories, notes, lifeStory, profile);

    // Call OpenAI to extract profile
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use latest GPT-4 for best intelligence
      messages: [
        {
          role: "system",
          content: PROFILE_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const profileData = JSON.parse(completion.choices[0].message.content);

    // Apply force phase if specified (for debugging)
    if (forcePhase && ['A', 'B', 'C'].includes(forcePhase)) {
      profileData.phase = forcePhase;
    }

    return profileData;
  } catch (error) {
    console.error("Error extracting user profile:", error);
    throw new Error("Failed to generate nervous system profile");
  }
}

/**
 * Generate a 14-day program based on user profile
 * Creates personalized practices tied to user's specific patterns
 *
 * @param {string} userId - The user's ID
 * @param {Object} profile - User's nervous system profile from extractUserProfile
 * @param {Object} previousProgram - Optional summary of last program
 * @returns {Promise<Object>} 14-day program with tasks
 */
export async function generate14DayProgram(userId, profile, previousProgram = null) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    // Get user's schedule preferences
    const userProfile = await getUserProfile(userId);
    const timezone = userProfile.timezone || 'America/New_York';
    const wakeTime = userProfile.wake_time || '7:00 AM';
    const workHours = userProfile.work_hours || '9-5';

    // Check program version to determine if this is first-time or returning user
    const programVersion = await getProgramVersion(userId);
    const isFirstProgram = programVersion === 0;

    // For returning users, identify "hot topics" from recent activity
    const hotTopics = isFirstProgram ? null : await identifyHotTopics(userId);

    // Build program generation context
    const context = buildProgramContext(profile, userProfile, previousProgram, programVersion, hotTopics);

    // Call OpenAI to generate program
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: isFirstProgram
            ? PROGRAM_GENERATION_FIRST_TIME_PROMPT
            : PROGRAM_GENERATION_RETURNING_PROMPT,
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // Slightly higher for creative variation
    });

    const programData = JSON.parse(completion.choices[0].message.content);

    // Validate and enrich the program
    const enrichedProgram = enrichProgramData(programData, profile, userProfile);

    return enrichedProgram;
  } catch (error) {
    console.error("Error generating 14-day program:", error);
    throw new Error("Failed to generate 14-day program");
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getRecentMemories(userId, days = 30) {
  const { data, error } = await supabase
    .from("nervi_memories")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

async function getRecentNotes(userId, days = 30) {
  const { data, error } = await supabase
    .from("nervi_notes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

async function getLifeStorySnippets(userId) {
  const { data: chapters } = await supabase
    .from("nervi_life_chapters")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(5);

  const { data: events } = await supabase
    .from("nervi_life_events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false })
    .limit(10);

  return { chapters: chapters || [], events: events || [] };
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function getProgramVersion(userId) {
  const { data, error } = await supabase
    .from("nervi_programs")
    .select("version")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0; // First program
  return data.version;
}

async function identifyHotTopics(userId) {
  // Analyze last 7-14 days of activity to identify recurring themes
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Get recent conversations
  const { data: recentConversations } = await supabase
    .from("nervi_memories")
    .select("memory_text, created_at")
    .eq("user_id", userId)
    .gte("created_at", fourteenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  // Get recent notes
  const { data: recentNotes } = await supabase
    .from("nervi_notes")
    .select("note_text, feeling, activity, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  // Get recent check-ins
  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("emotion, body_state, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false});

  return {
    recentConversations: recentConversations || [],
    recentNotes: recentNotes || [],
    recentCheckins: recentCheckins || [],
  };
}

function buildProfileContext(memories, notes, lifeStory, userProfile) {
  const conversationHistory = memories
    .map((m) => `[${new Date(m.created_at).toLocaleDateString()}] ${m.memory_text}`)
    .join("\n\n");

  const userNotes = notes
    .map((n) => `[${new Date(n.created_at).toLocaleDateString()}] ${n.note_text}`)
    .join("\n\n");

  const lifeContext = [
    ...lifeStory.chapters.map((c) => `Chapter: ${c.title} (${c.description})`),
    ...lifeStory.events.map((e) => `Event: ${e.title} - ${e.description}`),
  ].join("\n");

  return `User Profile Context:

Timezone: ${userProfile.timezone || 'Not specified'}
Location/State: ${userProfile.state || 'Not specified'}
Work Hours: ${userProfile.work_hours || 'Not specified'}

Recent Conversation History (last 30 days):
${conversationHistory}

User's Personal Notes:
${userNotes}

Life Story Context:
${lifeContext}

Based on this information, extract the user's nervous system profile.`;
}

function buildProgramContext(profile, userProfile, previousProgram, programVersion, hotTopics) {
  const isFirstProgram = programVersion === 0;

  let context = `Program Version: ${programVersion + 1} ${isFirstProgram ? '(FIRST PROGRAM - Exploratory Phase)' : '(RETURNING USER - Focused Phase)'}

Nervous System Profile:
Phase: ${profile.phase}
Main States: ${profile.main_states?.join(", ") || "Unknown"}
Top Triggers: ${profile.top_triggers?.join(", ") || "Unknown"}
Body Signals: ${profile.body_signals?.join(", ") || "Unknown"}

Narrative Summary:
${profile.narrative_summary}

User Schedule:
- Timezone: ${userProfile.timezone || 'America/New_York'}
- Wake Time: ${userProfile.wake_time || '7:00 AM'}
- Work Hours: ${userProfile.work_hours || '9-5'}
- State/Location: ${userProfile.state || 'Not specified'}
`;

  if (previousProgram) {
    context += `\n\nPrevious Program (for reference - don't repeat exactly):
${previousProgram.summary}
Key Practices: ${previousProgram.key_practices?.join(", ") || "None"}
`;
  }

  if (hotTopics && !isFirstProgram) {
    context += `\n\nRECENT ACTIVITY (Last 7-14 Days) - IDENTIFY HOT TOPICS:

Recent Conversations (identify recurring themes):
${hotTopics.recentConversations.map(c => `[${new Date(c.created_at).toLocaleDateString()}] ${c.memory_text}`).join('\n')}

Recent Notes:
${hotTopics.recentNotes.map(n => `[${new Date(n.created_at).toLocaleDateString()}] ${n.activity || ''} - Feeling: ${n.feeling || 'not specified'}`).join('\n')}

Recent Check-ins:
${hotTopics.recentCheckins.map(c => `[${new Date(c.created_at).toLocaleDateString()}] Emotion: ${c.emotion || 'not specified'}, Body: ${c.body_state || 'not specified'}`).join('\n')}

ANALYZE THE ABOVE: What patterns emerge? What's showing up repeatedly? What seems to be the current struggle or focus area? THIS is what the next 2 weeks should target.
`;
  }

  context += `\n\nGenerate a 14-day nervous system regulation program for this user.`;

  return context;
}

function enrichProgramData(programData, profile, userProfile) {
  // Ensure each task has required fields
  const enrichedDays = programData.days.map((day, index) => {
    const taskDate = new Date();
    taskDate.setDate(taskDate.getDate() + index);

    return {
      date: taskDate.toISOString().split('T')[0],
      tasks: day.tasks.map((task, taskIndex) => ({
        ...task,
        task_order: taskIndex,
        phase: profile.phase,
        scheduled_time: task.time_block === 'morning' ? '08:00:00'
          : task.time_block === 'midday' ? '12:00:00'
          : task.time_block === 'evening' ? '18:00:00'
          : task.time_block === 'night' ? '21:00:00'
          : task.scheduled_time || null,
      })),
    };
  });

  return {
    program_summary: programData.program_summary,
    focus_points: programData.focus_points || [],
    days: enrichedDays,
    phase: profile.phase,
  };
}

// ============================================================================
// LLM System Prompts (The "GPT-5.1 Intelligence")
// ============================================================================

const PROFILE_EXTRACTION_SYSTEM_PROMPT = `You are a trauma-informed nervous system specialist analyzing a person's conversation history with their AI companion.

Your task is to extract a nervous system profile in JSON format with these fields:

{
  "phase": "A" | "B" | "C",
  "main_states": ["anxious", "numb", "wired", etc.],
  "top_triggers": ["mornings before work", "late-night scrolling", "conflict with partner", etc.],
  "body_signals": ["chest tight", "stomach knots", "jaw clenched", etc.],
  "narrative_summary": "2-3 sentence summary using the person's own words and phrases"
}

PHASE DETERMINATION:
- Phase A (Stabilization): User needs basic regulation tools. Limited data, high distress, or just starting.
- Phase B (Pattern Awareness): User has some regulation capacity and enough data to identify recurring patterns.
- Phase C (Repatterning): User understands their patterns and is ready for behavior/identity shifts.

CRITICAL INSTRUCTIONS:
1. Use the person's EXACT phrases when possible (e.g., "stomach like a rock" if they said that)
2. Be specific - not "work stress" but "anxiety before Monday morning meetings"
3. The narrative should sound like someone who KNOWS this person's story, not generic wellness advice
4. If there's limited data (< 5 conversation entries), default to Phase A
5. Look for patterns in timing, situations, relationships, and physical sensations

Return ONLY valid JSON.`;

const PROGRAM_GENERATION_FIRST_TIME_PROMPT = `You are a trauma-informed nervous system specialist creating a FIRST PROGRAM for a new user. This is their Week 1 - you're just getting to know them.

Your task is to generate a program in JSON format:

{
  "program_summary": "2-3 sentence paragraph describing the focus for these 2 weeks",
  "focus_points": ["Focus area 1", "Focus area 2", "Focus area 3"],
  "days": [
    {
      "tasks": [
        {
          "title": "Practice name",
          "task_type": "grounding" | "breathing" | "journaling" | "movement" | "rest" | "connection",
          "time_block": "morning" | "midday" | "evening" | "night",
          "instructions": "Short, optional instructions",
          "why_text": "1-2 sentences tying this practice to the user's specific patterns using their own language",
          "duration_minutes": 5
        }
      ]
    }
  ]
}

WEEK 1 APPROACH - EXPLORATORY & FOUNDATIONAL:

This is the user's FIRST program. You don't know them deeply yet. Your goals:

1. BUILD A FOUNDATION:
   - Start with 2-3 reliable, simple regulation tools
   - Focus on basics: grounding, basic breathing, simple body awareness
   - Keep practices accessible and not overwhelming

2. GATHER INFORMATION:
   - Include practices that help you learn more about their patterns
   - Simple check-ins: "Notice where you feel this in your body"
   - Journaling prompts to surface what's happening for them

3. TEST WHAT WORKS:
   - Offer variety to see what resonates
   - Week 1 might focus on grounding, Week 2 might introduce more breathwork
   - Notice in your "why_text" that you're "testing" or "exploring"

4. BE GENTLE:
   - Don't assume you know their whole story yet
   - Use language like: "Let's see how this feels for your system"
   - "We're building your regulation toolbox"

5. STILL PERSONALIZE:
   - Use their specific language if available in the profile
   - Reference what they've shared, but hold it lightly
   - Connect practices to what they've mentioned, not generic wellness

6. REALISTIC SCHEDULE:
   - 2-3 practices per day maximum for Week 1
   - Build momentum gradually

Remember: This is exploratory. You're establishing rapport and finding what works. Future programs will be more targeted once you know them better.

Return ONLY valid JSON with exactly 14 days.`;

const PROGRAM_GENERATION_RETURNING_PROMPT = `You are a trauma-informed nervous system specialist creating a FOLLOW-UP PROGRAM for a returning user. You've worked with them before.

Your task is to generate a program in JSON format:

{
  "program_summary": "2-3 sentence paragraph describing the focus for these 2 weeks",
  "focus_points": ["Focus area 1", "Focus area 2", "Focus area 3"],
  "days": [
    {
      "tasks": [
        {
          "title": "Practice name",
          "task_type": "grounding" | "breathing" | "journaling" | "movement" | "rest" | "connection",
          "time_block": "morning" | "midday" | "evening" | "night",
          "instructions": "Short, optional instructions",
          "why_text": "1-2 sentences tying this practice to the user's specific patterns using their own language",
          "duration_minutes": 5
        }
      ]
    }
  ]
}

RETURNING USER APPROACH - FOCUSED & ADAPTIVE:

This user has worked with you before. You have recent data. Your goals:

1. IDENTIFY HOT TOPICS:
   - Look at "RECENT ACTIVITY" section - what's showing up REPEATEDLY?
   - What theme emerges in the last 7-14 days?
   - THIS is the focus for the next 2 weeks

2. EXAMPLES OF HOT TOPICS:
   - If they mentioned "work anxiety" 5+ times → this program targets work-related nervous system regulation
   - If "sleep" keeps coming up → focus on evening wind-down and nervous system settling
   - If "relationship conflict" is recurring → practices for co-regulation and boundary-setting
   - If their check-ins show consistent "tightness in chest" → this is THE pattern to address

3. BE SPECIFIC & FOCUSED:
   - NOT: A general wellness program
   - YES: "These 2 weeks are about helping your system feel safer before Monday mornings" (if that's the hot topic)
   - Every practice should tie back to the identified focus

4. BUILD ON PREVIOUS WORK:
   - Reference practices that worked before
   - "Last week you noticed the morning grounding helped before work - let's build on that"
   - Don't repeat exactly, but acknowledge what's working

5. USE THEIR EXACT LANGUAGE:
   - If they said "stomach in knots" → use that phrase
   - If they call it "the Sunday scaries" → reference it that way
   - Sound like someone who KNOWS their story

6. PHASE-APPROPRIATE DEPTH:
   - Phase A returning: Still foundational, but now targeted to their specific triggers
   - Phase B returning: Pattern awareness work focused on the hot topic
   - Phase C returning: Behavior shifts related to the recurring theme

7. REALISTIC & FOCUSED:
   - 2-4 practices per day
   - All practices serve the identified focus area
   - Morning practices before trigger times, evening for integration

THIS IS THE DIFFERENCE:
- Week 1: "Let's explore what helps your nervous system regulate"
- Week 2+: "You mentioned work anxiety 8 times this week - these practices target that specific pattern"

Return ONLY valid JSON with exactly 14 days.`;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Analyze chat history and generate threads/patterns
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, existingChapters = [], existingEvents = [], existingThreads = [] } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Fetch user's chat history
    const { data: memories, error: memoriesError } = await supabase
      .from("nervi_memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (memoriesError) {
      console.error("Error fetching memories:", memoriesError);
      return NextResponse.json({ error: memoriesError.message }, { status: 500 });
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({
        threads: [],
        message: "No chat history found to analyze",
      });
    }

    // Prepare conversation history for AI analysis
    const conversationText = memories
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");

    console.log(`[ANALYZE] Loaded ${memories.length} messages for user ${userId}`);
    console.log(`[ANALYZE] Conversation length: ${conversationText.length} characters`);

    // Prepare existing life story context if provided
    let existingContext = '';

    if (existingChapters.length > 0) {
      existingContext += `\n\nEXISTING CHAPTERS (do NOT duplicate these):\n${existingChapters.map(c =>
        `- "${c.name}" (Ages ${c.age_range_start}-${c.age_range_end})`
      ).join('\n')}`;
    }

    if (existingEvents.length > 0) {
      existingContext += `\n\nEXISTING EVENTS (do NOT duplicate these):\n${existingEvents.map(e =>
        `- Age ${e.age}: "${e.title}" (${e.nervous_system_state})`
      ).join('\n')}`;
    }

    if (existingThreads.length > 0) {
      existingContext += `\n\nEXISTING THREADS/PATTERNS (do NOT duplicate these):\n${existingThreads.map(t =>
        `- "${t.name}"`
      ).join('\n')}`;
    }

    if (existingContext) {
      existingContext += `\n\n⚠️ IMPORTANT: Only extract NEW items that aren't already listed above. Keep existing items as-is.`;
    }

    // Call OpenAI to analyze patterns
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a trauma-informed therapist analyzing a user's conversation history with Nervi (an AI companion for nervous system regulation).

Your task: Build their COMPLETE and COMPREHENSIVE Life Story Map. Be EXTREMELY AGGRESSIVE in extraction.

CRITICAL RULES:
1. Focus on QUALITY over quantity - extract only the most significant items
2. Don't require exact ages - estimate from context (childhood=0-12, teens=13-19, 20s, 30s, etc.)
3. Only include truly formative experiences, not every mention
4. Look for patterns mentioned MULTIPLE times, not single instances
5. Avoid creating duplicates - if two items are similar, merge them
6. Be selective and focused

1. LIFE CHAPTERS (developmental phases)
Extract 4-6 major life phases (NO MORE than 6):
- Name the phase descriptively (e.g., "Early Childhood", "High School Years", "First Job", "Recent Struggles", "College Era", "Career Transition")
- Estimate age ranges from context clues (be specific: 0-5, 6-12, 13-18, 19-25, etc.)
- Identify dominant nervous system state during that phase

2. KEY LIFE EVENTS (specific memories/experiences mentioned)
Extract 8-12 of the MOST SIGNIFICANT events only (prioritize impactful ones):
- Childhood experiences (parental conflict, school struggles, friendships, trauma)
- Teenage/young adult events (breakups, academic pressure, identity struggles)
- Adult experiences (job loss, relationship endings, health issues, successes)
- Recent struggles or triumphs
For EACH event include:
- Title (brief, specific description)
- Approximate age when it happened
- Nervous system state at the time (hypervigilant/hyper, shutdown/hypo, freeze, numb, regulated, mixed)
- Emotions felt (fear, shame, anger, grief, loneliness, confusion, etc.)
- Beliefs formed from this event ("I'm not safe", "I must be perfect", "I'm unlovable", etc.)

3. RECURRING THREADS (patterns across events)
Identify ONLY THE MOST SIGNIFICANT patterns (MAXIMUM 6 threads, prioritize the deepest wounds), including:
- Relational patterns: abandonment, mother/father wound, codependency, people-pleasing, isolation, trust issues
- Self-concept patterns: shame, perfectionism, self-criticism, imposter syndrome, unworthiness
- Coping patterns: work as safety, control, avoidance, substance use, freeze/shutdown, fight/flight
- Nervous system patterns: chronic hypervigilance, shutdown, collapse, dissociation
- Use emotionally resonant colors:
  * Red/crimson (#dc2626): anger, fight, activation
  * Blue/slate (#3b82f6): shutdown, freeze, dissociation
  * Gray (#64748b): numbness, depression, collapse
  * Purple (#a855f7): relational wounds, attachment
  * Orange (#f97316): shame, humiliation
  * Yellow (#eab308): anxiety, hypervigilance
  * Green (#22c55e): healing, regulation, growth
  * Pink (#ec4899): grief, heartbreak

Return ONLY valid JSON with AS MANY items as you can extract:
{
  "chapters": [
    {
      "name": "String",
      "ageRangeStart": number,
      "ageRangeEnd": number,
      "dominantState": "hypervigilant|hyper|shutdown|hypo|numb|freeze|regulated|mixed"
    }
  ],
  "events": [
    {
      "chapterName": "String (which chapter this belongs to)",
      "title": "String",
      "age": number,
      "description": "String (1-2 sentences)",
      "nervousSystemState": "hypervigilant|hyper|shutdown|hypo|freeze|numb|regulated|mixed",
      "emotionTags": ["fear", "shame", "anger", "grief", "loneliness"],
      "keyBeliefs": ["I'm not safe", "I must be perfect"]
    }
  ],
  "threads": [
    {
      "name": "String",
      "description": "String (2-3 sentences explaining the pattern)",
      "color": "#HEXCOLOR"
    }
  ]
}

CRITICAL: Extract EVERYTHING. If they mention 20 different experiences, extract all 20. If you see 8 patterns, include all 8. Be comprehensive, not minimal.`,
          },
          {
            role: "user",
            content: `Analyze this conversation history for nervous system patterns and life threads:\n\n${conversationText}${existingContext}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 6000,
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
    const responseText = data.choices[0].message.content.trim();

    console.log(`[ANALYZE] AI Response length: ${responseText.length} characters`);

    // Parse AI response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      analysisResult = JSON.parse(jsonText);

      console.log(`[ANALYZE] Extracted: ${analysisResult.chapters?.length || 0} chapters, ${analysisResult.events?.length || 0} events, ${analysisResult.threads?.length || 0} threads`);
    } catch (parseError) {
      console.error("[ANALYZE] Failed to parse AI response:", responseText);
      return NextResponse.json({
        error: "Failed to parse AI analysis",
        rawResponse: responseText,
      }, { status: 500 });
    }

    return NextResponse.json({
      chapters: analysisResult.chapters || [],
      events: analysisResult.events || [],
      threads: analysisResult.threads || [],
      conversationCount: memories.length,
    });
  } catch (error) {
    console.error("POST /api/life-story/analyze error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

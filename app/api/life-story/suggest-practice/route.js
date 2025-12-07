import { NextResponse } from "next/server";

// POST - Generate practice suggestions based on event or thread
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, type, data } = body; // type: 'event' or 'thread'

    if (!userId || !type || !data) {
      return NextResponse.json(
        { error: "userId, type, and data required" },
        { status: 400 }
      );
    }

    let systemPrompt, userPrompt;

    if (type === "event") {
      // Event-specific practice suggestions
      const { title, age, nervousSystemState, keyBeliefs, description } = data;

      systemPrompt = `You are a trauma-informed somatic therapist creating micro-practices (1-10 minutes) for nervous system healing.

Based on a life event, suggest 3-5 SHORT practices to address the nervous system pattern from that event.

PRACTICE TYPES:
- Somatic: body awareness, grounding, movement
- Breathwork: specific patterns for regulation
- Cognitive: gentle belief reframes
- Relational: boundary work, self-compassion

Return ONLY valid JSON:
{
  "practices": [
    {
      "title": "Short title (e.g., '3-Minute Body Scan')",
      "duration": "1-10 min",
      "type": "somatic|breathwork|cognitive|relational",
      "description": "Brief how-to (2-3 sentences)",
      "targetState": "hypervigilant|shutdown|dysregulated"
    }
  ]
}`;

      userPrompt = `Event: "${title}" (Age ${age})
Nervous System State: ${nervousSystemState}
Key Beliefs: ${keyBeliefs ? keyBeliefs.join(', ') : 'none'}
Description: ${description || 'none'}

Suggest practices to heal this pattern.`;
    } else if (type === "thread") {
      // Thread-specific practice suggestions
      const { name, description, eventCount } = data;

      systemPrompt = `You are a trauma-informed somatic therapist creating micro-practices (1-10 minutes) for nervous system healing.

Based on a recurring LIFE PATTERN (thread), suggest 3-5 SHORT practices to heal this pattern over time.

PRACTICE TYPES:
- Somatic: body awareness, grounding, movement
- Breathwork: specific patterns for regulation
- Cognitive: gentle belief reframes, parts work
- Relational: boundary work, self-compassion, reparenting

Return ONLY valid JSON:
{
  "practices": [
    {
      "title": "Short title (e.g., 'Inner Child Check-In')",
      "duration": "1-10 min",
      "type": "somatic|breathwork|cognitive|relational",
      "description": "Brief how-to (2-3 sentences)",
      "targetPattern": "Brief explanation of how this helps the pattern"
    }
  ]
}`;

      userPrompt = `Thread/Pattern: "${name}"
Description: ${description}
Connected to ${eventCount || 'multiple'} life events

Suggest practices to heal this recurring pattern.`;
    }

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

    const openAiData = await openAiRes.json();
    const responseText = openAiData.choices[0].message.content.trim();

    // Parse AI response
    let practiceResult;
    try {
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      practiceResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({
        error: "Failed to parse AI suggestions",
        rawResponse: responseText,
      }, { status: 500 });
    }

    return NextResponse.json({
      practices: practiceResult.practices || [],
    });
  } catch (error) {
    console.error("POST /api/life-story/suggest-practice error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

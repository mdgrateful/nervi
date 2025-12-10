import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

async function getEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI embeddings error:", data);
    throw new Error("OpenAI embeddings request failed");
  }

  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("No embedding returned from OpenAI");
  }

  return embedding;
}

export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, sourceType, sourceId, content, tags = [] } = body || {};

    if (!userId || !sourceType || !sourceId || !content) {
      return NextResponse.json(
        { error: "Missing userId, sourceType, sourceId, or content" },
        { status: 400 }
      );
    }

    const embedding = await getEmbedding(content);

    const { error } = await supabase.from("nervi_embeddings").insert({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      content,
      tags,
      embedding,
    });

    if (error) {
      console.error("Error inserting nervi_embeddings:", error);
      return NextResponse.json(
        { error: "Error inserting embedding" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/deep-memory/index:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

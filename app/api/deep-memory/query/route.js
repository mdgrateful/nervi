import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

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
    const { userId, query, topK = 5, filterSourceTypes = [] } = body || {};

    if (!userId || !query) {
      return NextResponse.json(
        { error: "Missing userId or query" },
        { status: 400 }
      );
    }

    const queryEmbedding = await getEmbedding(query);

    // Build a SQL similarity search
    // Using raw SQL because supabase-js doesn't natively support vector operators yet
    const params = [userId, topK, queryEmbedding];
    let sourceTypeFilter = "";
    if (Array.isArray(filterSourceTypes) && filterSourceTypes.length > 0) {
      sourceTypeFilter = "and source_type = any($4)";
      params.push(filterSourceTypes);
    }

    const { data, error } = await supabase.rpc("nervi_embeddings_search", {
      p_user_id: userId,
      p_top_k: topK,
      p_embedding: queryEmbedding,
      p_source_types: filterSourceTypes,
    });

    if (error) {
      console.error("Error in nervi_embeddings_search RPC:", error);
      return NextResponse.json(
        { error: "Error running search" },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: data || [] });
  } catch (err) {
    console.error("Unexpected error in /api/deep-memory/query:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

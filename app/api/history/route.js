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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

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

    // 1) If no sessionId → return list of sessions for that user
    if (!sessionId) {
      const { data, error } = await supabase
        .from("nervi_memories")
        .select("session_id, program_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading sessions from nervi_memories:", error);
        return NextResponse.json(
          { error: "Error loading history sessions" },
          { status: 500 }
        );
      }

      const sessionMap = new Map();

      for (const row of data || []) {
        const id = row.session_id || "default-session";
        const existing = sessionMap.get(id);
        if (!existing) {
          sessionMap.set(id, {
            session_id: id,
            program_type: row.program_type || null,
            first_created_at: row.created_at,
            last_created_at: row.created_at,
            message_count: 1,
          });
        } else {
          existing.last_created_at = row.created_at;
          existing.message_count += 1;
        }
      }

      const sessions = Array.from(sessionMap.values()).sort(
        (a, b) =>
          new Date(b.first_created_at).getTime() -
          new Date(a.first_created_at).getTime()
      );

      return NextResponse.json({
        mode: "sessions",
        sessions,
      });
    }

    // 2) If sessionId is provided → return messages for that session
    const { data: messages, error: msgError } = await supabase
      .from("nervi_memories")
      .select("id, role, content, created_at, program_type")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Error loading messages for session:", msgError);
      return NextResponse.json(
        { error: "Error loading session messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mode: "messages",
      sessionId,
      messages: messages || [],
    });
  } catch (err) {
    console.error("Unexpected error in /api/history GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body || {};

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "Missing userId or sessionId" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Delete all messages for this session
    const { error } = await supabase
      .from("nervi_memories")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error deleting session:", error);
      return NextResponse.json(
        { error: "Error deleting conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted conversation ${sessionId}`,
    });
  } catch (err) {
    console.error("Unexpected error in /api/history DELETE:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

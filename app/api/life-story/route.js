import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch all life story data for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action"); // 'chapters', 'events', 'threads', or 'all'

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Fetch chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from("nervi_life_chapters")
      .select("*")
      .eq("user_id", userId)
      .order("order_index", { ascending: true });

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    if (chapters && chapters.length > 0) {
      console.log("[API] First chapter columns:", Object.keys(chapters[0]));
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from("nervi_life_events")
      .select("*")
      .eq("user_id", userId)
      .order("age", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Fetch threads
    const { data: threads, error: threadsError } = await supabase
      .from("nervi_life_threads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return NextResponse.json({ error: threadsError.message }, { status: 500 });
    }

    return NextResponse.json({
      chapters: chapters || [],
      events: events || [],
      threads: threads || [],
    });
  } catch (error) {
    console.error("GET /api/life-story error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or update chapters, events, or threads
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "upsert-chapter": {
        const { id, name, ageRangeStart, ageRangeEnd, dominantState, orderIndex } = data;

        if (id) {
          // Update existing chapter
          const { data: updated, error } = await supabase
            .from("nervi_life_chapters")
            .update({
              name,
              age_range_start: ageRangeStart,
              age_range_end: ageRangeEnd,
              dominant_state: dominantState,
              order_index: orderIndex,
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw error;
          result = updated;
        } else {
          // Create new chapter (let database auto-generate ID)
          const { data: created, error } = await supabase
            .from("nervi_life_chapters")
            .insert({
              user_id: userId,
              name,
              age_range_start: ageRangeStart,
              age_range_end: ageRangeEnd,
              dominant_state: dominantState,
              order_index: orderIndex,
            })
            .select()
            .single();

          if (error) throw error;
          result = created;
        }
        break;
      }

      case "upsert-event": {
        const { id, chapterId, title, age, description, nervousSystemState, emotionTags, keyBeliefs } = data;

        if (id) {
          // Update existing event
          const { data: updated, error } = await supabase
            .from("nervi_life_events")
            .update({
              chapter_id: chapterId,
              title,
              age,
              description,
              nervous_system_state: nervousSystemState,
              emotion_tags: emotionTags,
              key_beliefs: keyBeliefs,
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw error;
          result = updated;
        } else {
          // Create new event (let database auto-generate ID)
          const { data: created, error } = await supabase
            .from("nervi_life_events")
            .insert({
              user_id: userId,
              chapter_id: chapterId,
              title,
              age,
              description,
              nervous_system_state: nervousSystemState,
              emotion_tags: emotionTags,
              key_beliefs: keyBeliefs,
            })
            .select()
            .single();

          if (error) throw error;
          result = created;
        }
        break;
      }

      case "upsert-thread": {
        const { id, name, description, color, eventIds } = data;

        if (id) {
          // Update existing thread
          const { data: updated, error } = await supabase
            .from("nervi_life_threads")
            .update({
              name,
              description,
              color,
              event_ids: eventIds,
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw error;
          result = updated;
        } else {
          // Create new thread (let database auto-generate ID)
          const { data: created, error } = await supabase
            .from("nervi_life_threads")
            .insert({
              user_id: userId,
              name,
              description,
              color,
              event_ids: eventIds,
            })
            .select()
            .single();

          if (error) throw error;
          result = created;
        }
        break;
      }

      case "delete-all-user-data": {
        // Delete all life story data for this user
        const { error: chaptersError } = await supabase
          .from("nervi_life_chapters")
          .delete()
          .eq("user_id", userId);

        const { error: eventsError } = await supabase
          .from("nervi_life_events")
          .delete()
          .eq("user_id", userId);

        const { error: threadsError } = await supabase
          .from("nervi_life_threads")
          .delete()
          .eq("user_id", userId);

        if (chaptersError) {
          console.error("Error deleting chapters:", chaptersError);
        }
        if (eventsError) {
          console.error("Error deleting events:", eventsError);
        }
        if (threadsError) {
          console.error("Error deleting threads:", threadsError);
        }

        result = { success: true, deleted: { chapters: !chaptersError, events: !eventsError, threads: !threadsError } };
        break;
      }

      case "delete-chapter": {
        const { id } = data;
        const { error } = await supabase
          .from("nervi_life_chapters")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "delete-event": {
        const { id } = data;
        const { error } = await supabase
          .from("nervi_life_events")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case "delete-thread": {
        const { id } = data;
        const { error} = await supabase
          .from("nervi_life_threads")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/life-story error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET: Fetch all triggers/buffers for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'trigger' or 'buffer' or null for both

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

    let query = supabase
      .from("user_triggers_buffers")
      .select("*")
      .eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("confidence_score", { ascending: false });

    if (error) {
      console.error("Error fetching triggers/buffers:", error);
      return NextResponse.json(
        { error: "Error fetching triggers/buffers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error("Unexpected error in /api/triggers-buffers GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// POST: Add or update a trigger/buffer
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, type, name, context, action } = body || {};

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

    // Handle delete action
    if (action === "delete" && body.id) {
      const { error: deleteError } = await supabase
        .from("user_triggers_buffers")
        .delete()
        .eq("id", body.id)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting trigger/buffer:", deleteError);
        return NextResponse.json(
          { error: "Error deleting trigger/buffer" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle increment confidence (when pattern is observed again)
    if (action === "increment" && name && type) {
      // Check if it exists
      const { data: existing, error: fetchError } = await supabase
        .from("user_triggers_buffers")
        .select("*")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("name", name)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching existing trigger/buffer:", fetchError);
        return NextResponse.json(
          { error: "Error fetching existing trigger/buffer" },
          { status: 500 }
        );
      }

      if (existing) {
        // Increment confidence score
        const { error: updateError } = await supabase
          .from("user_triggers_buffers")
          .update({
            confidence_score: existing.confidence_score + 1,
            last_observed: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Error updating confidence score:", updateError);
          return NextResponse.json(
            { error: "Error updating confidence score" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, updated: true });
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from("user_triggers_buffers")
          .insert([
            {
              user_id: userId,
              type,
              name,
              context: context || [],
              confidence_score: 1,
              last_observed: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error("Error creating trigger/buffer:", insertError);
          return NextResponse.json(
            { error: "Error creating trigger/buffer" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, created: true });
      }
    }

    // Create new trigger/buffer
    if (!type || !name) {
      return NextResponse.json(
        { error: "Missing required fields: type and name" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("user_triggers_buffers")
      .insert([
        {
          user_id: userId,
          type,
          name,
          context: context || [],
          confidence_score: 1,
        },
      ]);

    if (insertError) {
      console.error("Error creating trigger/buffer:", insertError);
      return NextResponse.json(
        { error: "Error creating trigger/buffer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/triggers-buffers POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

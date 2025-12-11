import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import webPush from "web-push";
import { logError, logInfo } from "../../../../lib/logger";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:you@example.com";

// Only set VAPID details if all keys are available (skip during build)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (error) {
    console.error('[VAPID] Failed to set VAPID details:', error.message);
  }
}

// reuse your time parser
function getMinutesFromLine(line) {
  if (!line) return Number.POSITIVE_INFINITY;
  const match = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (!period) hours = Math.max(0, Math.min(23, hours));
  return hours * 60 + minutes;
}

function normalizeDayShort(key, label) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const k = (key || "").toLowerCase();
  const l = (label || "").toLowerCase();
  for (const short of map) {
    if (k.startsWith(short) || l.startsWith(short)) return short;
  }
  return null;
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Convert server time (UTC) to Eastern Time (America/New_York)
    // This is where most users are (Washington DC timezone)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short'
    });

    const parts = formatter.formatToParts(now);
    const etHour = parseInt(parts.find(p => p.type === 'hour').value);
    const etMinute = parseInt(parts.find(p => p.type === 'minute').value);
    const weekdayShort = parts.find(p => p.type === 'weekday').value.toLowerCase();

    const nowMinutes = etHour * 60 + etMinute;
    const windowMinutes = 2; // look ahead 2 minutes (cron runs every 1 minute)

    // 1) get all subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("nervi_push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subsError) {
      logError("Error loading subscriptions", subsError, { operation: "push_send_due" });
      return NextResponse.json(
        { error: "Error loading subscriptions" },
        { status: 500 }
      );
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, message: "No subscriptions." });
    }

    // 2) for each user with subs, load their schedule AND daily tasks
    const uniqueUsers = [...new Set(subs.map((s) => s.user_id))];
    const notifications = [];

    for (const userId of uniqueUsers) {
      // Check master schedule blocks
      const { data: schedData, error: schedError } = await supabase
        .from("nervi_master_schedules")
        .select("schedule")
        .eq("user_id", userId)
        .maybeSingle();

      if (!schedError && schedData && schedData.schedule) {
        const schedule = schedData.schedule;
        const day = schedule.days?.find(
          (d) => normalizeDayShort(d.key, d.label) === weekdayShort
        );
        const blocks = day?.blocks || [];

        for (const block of blocks) {
          const minutes = getMinutesFromLine(block);
          if (
            minutes >= nowMinutes &&
            minutes <= nowMinutes + windowMinutes
          ) {
            notifications.push({ userId, block, source: 'schedule' });
          }
        }
      }

      // Check daily tasks - use Eastern Time date
      const etFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const etDateParts = etFormatter.formatToParts(now);
      const etYear = etDateParts.find(p => p.type === 'year').value;
      const etMonth = etDateParts.find(p => p.type === 'month').value;
      const etDay = etDateParts.find(p => p.type === 'day').value;
      const today = `${etYear}-${etMonth}-${etDay}`;

      const { data: tasksData, error: tasksError } = await supabase
        .from("nervi_daily_tasks")
        .select("time, activity, completed")
        .eq("user_id", userId)
        .eq("task_date", today)
        .eq("completed", false);

      if (!tasksError && tasksData && tasksData.length > 0) {
        for (const task of tasksData) {
          const minutes = getMinutesFromLine(task.time);
          if (
            minutes >= nowMinutes &&
            minutes <= nowMinutes + windowMinutes
          ) {
            notifications.push({
              userId,
              block: `${task.time}: ${task.activity}`,
              source: 'daily_task'
            });
          }
        }
      }
    }

    // 3) send notifications
    // (for demo: send one notification per (userId, block) pair)
    const sendPromises = [];

    for (const note of notifications) {
      const userSubs = subs.filter((s) => s.user_id === note.userId);
      const payload = JSON.stringify({
        title: "Nervi reminder",
        body: note.block,
        url: "/dashboard",
      });

      for (const s of userSubs) {
        const pushSub = {
          endpoint: s.endpoint,
          keys: {
            p256dh: s.p256dh,
            auth: s.auth,
          },
        };

        sendPromises.push(
          webPush
            .sendNotification(pushSub, payload)
            .catch((err) => {
              logError("Push notification send failed", err, {
                operation: "push_send_due",
                endpoint: s.endpoint
              });
            })
        );
      }
    }

    await Promise.all(sendPromises);

    return NextResponse.json({
      ok: true,
      notificationsSent: notifications.length,
    });
  } catch (err) {
    logError("Unexpected error in push send-due endpoint", err, {
      endpoint: "/api/push/send-due"
    });
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

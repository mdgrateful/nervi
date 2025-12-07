"use client";

import { useState, useEffect } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents
} from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { useTheme } from "../hooks/useTheme";

// --- nervous-system–oriented quotes ---
// You can add more here over time.
const nervousSystemQuotes = [
  {
    text:
      "You don’t have to fix everything today. You just have to give your nervous system one small moment of safety.",
    author: "Unknown",
  },
  {
    text:
      "Your body isn’t the enemy. It’s the part of you that has been trying to keep you alive the longest.",
    author: "Somatic wisdom",
  },
  {
    text:
      "Regulation is not about feeling good. It’s about feeling safe enough to be present with what is.",
    author: "Nervi",
  },
  {
    text:
      "Every exhale is a chance to tell your body: we made it here, we are still alive, you can soften a little.",
    author: "Nervi",
  },
  {
    text:
      "Tiny, consistent nervous-system practices beat heroic, once-a-year attempts at self-care.",
    author: "Nervi",
  },
];


// Parse first time in a line like "7:00 PM – ..." into minutes since midnight
function getMinutesFromLine(line) {
  if (!line) return Number.POSITIVE_INFINITY;

  const match = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return Number.POSITIVE_INFINITY;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  if (!period) {
    hours = Math.max(0, Math.min(23, hours));
  }

  return hours * 60 + minutes;
}

export default function SchedulePage() {
  // --- Theme ---
  const { theme, toggleTheme } = useTheme();

  // --- Component styles ---
  const components = getComponents(theme);

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "960px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const smallBadge = {
    fontSize: typography.fontSizes.xs,
    color: theme.textMuted,
  };

  const inputStyle = {
    ...components.input,
    borderRadius: borderRadius.full,
  };

  const buttonStyle = (disabled) => ({
    ...components.button,
    ...components.buttonPrimary,
    backgroundColor: disabled ? theme.surfaceHover : theme.accent,
    cursor: disabled ? "default" : "pointer",
  });

  const subtleButtonStyle = (disabled) => ({
    borderRadius: borderRadius.full,
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surface,
    color: disabled ? theme.textMuted : colors.info,
    cursor: disabled ? "default" : "pointer",
    fontSize: typography.fontSizes.xs,
  });

  const dayHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  };

  const arrowButtonStyle = {
    borderRadius: borderRadius.full,
    border: `1px solid ${theme.border}`,
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
    color: theme.textPrimary,
    cursor: "pointer",
    fontSize: "16px",
  };

  const dayCardStyle = {
    borderRadius: borderRadius.lg,
    border: `1px solid ${theme.border}`,
    padding: spacing.md,
    backgroundColor: theme.surface,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  };

  const itemRowStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: spacing.sm,
    fontSize: typography.fontSizes.sm,
    color: theme.textPrimary,
  };

  const checkboxStyle = {
    marginTop: "2px",
  };

  const editTextareaStyle = {
    width: "100%",
    minHeight: "90px",
    borderRadius: borderRadius.md,
    border: `1px solid ${theme.border}`,
    padding: spacing.sm,
    backgroundColor: theme.surface,
    color: theme.textPrimary,
    outline: "none",
    fontSize: typography.fontSizes.sm,
    resize: "vertical",
  };

  const quoteCardStyle = {
    borderRadius: borderRadius.lg,
    border: `1px solid ${theme.border}`,
    padding: spacing.md,
    backgroundColor: theme.surface,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  };

  // --- State ---
  const [userId, setUserId] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [completed, setCompleted] = useState({});
  const [quote, setQuote] = useState(null);

  // Load user id + quote + schedule on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("nerviUserId");
    if (saved && saved.trim()) {
      setUserId(saved);
      // auto-load schedule for this user
      loadScheduleInternal(saved);
    }

    // load next quote
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadQuote() {
    try {
      if (typeof window === "undefined") return;
      const rawIndex = window.localStorage.getItem("nerviQuoteIndex");
      let idx = rawIndex ? parseInt(rawIndex, 10) : 0;
      if (!Number.isFinite(idx) || idx < 0 || idx >= nervousSystemQuotes.length) {
        idx = 0;
      }
      const q = nervousSystemQuotes[idx];
      setQuote(q);
      const nextIdx = (idx + 1) % nervousSystemQuotes.length;
      window.localStorage.setItem("nerviQuoteIndex", String(nextIdx));
    } catch {
      setQuote(nervousSystemQuotes[0]);
    }
  }

  async function loadScheduleInternal(idToUse) {
    if (!idToUse || !idToUse.trim()) return;

    setLoading(true);
    setStatus("");
    setSchedule(null);

    try {
      const res = await fetch(
        `/api/master-schedule?userId=${encodeURIComponent(idToUse.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load schedule");
      }

      setSchedule(data.schedule);
      setStatus(
        data.exists
          ? "Loaded your existing schedule."
          : "Started a new empty schedule."
      );
      setCurrentDayIndex(0);
      setCompleted({});
    } catch (err) {
      console.error(err);
      setStatus("Error loading schedule. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function loadScheduleButton() {
    if (!userId.trim()) {
      alert("Enter the same user id you use on the main Nervi page.");
      return;
    }
    await loadScheduleInternal(userId);
  }

  async function saveSchedule() {
    if (!userId.trim() || !schedule) return;

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/master-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          schedule,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save schedule");
      }

      setStatus("Master Schedule saved.");
    } catch (err) {
      console.error(err);
      setStatus("Error saving schedule. See console for details.");
    } finally {
      setSaving(false);
    }
  }

  function handleDayChangeText(dayKey, text) {
    if (!schedule) return;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    setSchedule((prev) => {
      if (!prev) return prev;
      const newDays = prev.days.map((day) =>
        day.key === dayKey ? { ...day, blocks: lines } : day
      );
      return { ...prev, days: newDays };
    });
  }

  function getDayBlocks(dayKey) {
    if (!schedule || !schedule.days) return [];
    const day = schedule.days.find((d) => d.key === dayKey);
    if (!day || !Array.isArray(day.blocks)) return [];
    const copy = [...day.blocks];
    copy.sort((a, b) => getMinutesFromLine(a) - getMinutesFromLine(b));
    return copy;
  }

  function goDay(delta) {
    if (!schedule || !schedule.days || schedule.days.length === 0) return;
    setCurrentDayIndex((prev) => {
      const len = schedule.days.length;
      return (prev + delta + len) % len;
    });
  }

  function toggleCompleted(dayKey, index) {
    const key = `${dayKey}:${index}`;
    setCompleted((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  const currentDay =
    schedule && schedule.days && schedule.days.length > 0
      ? schedule.days[currentDayIndex]
      : null;

  const currentBlocks = currentDay ? getDayBlocks(currentDay.key) : [];
  const currentEditText = currentBlocks.join("\n");

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{
          fontSize: typography.fontSizes.xl,
          fontWeight: typography.fontWeights.semibold,
          textAlign: "center",
          color: theme.textPrimary
        }}>
          Nervi – Master Schedule
        </h1>

        <SharedNav currentPage="/schedule" theme={theme} onToggleTheme={toggleTheme} />

        {/* Inspiration quote */}
        <div style={quoteCardStyle}>
          <div style={{
            fontSize: typography.fontSizes.xs,
            color: theme.textMuted
          }}>Inspiration</div>
          <div style={{
            fontSize: typography.fontSizes.md,
            lineHeight: "1.5",
            color: theme.textPrimary
          }}>
            "{quote?.text || "Every small regulation practice is a message of safety to your body."}"
          </div>
          <div
            style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textSecondary,
              textAlign: "right",
              marginTop: spacing.xs,
            }}
          >
            — {quote?.author || "Nervi"}
          </div>
        </div>

        {/* User id + buttons row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={smallBadge}>Nervi user id</div>
            <input
              style={inputStyle}
              placeholder="Same id you use on the main Nervi page"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={loadScheduleButton}
            style={subtleButtonStyle(loading)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh schedule"}
          </button>
          <button
            type="button"
            onClick={saveSchedule}
            style={buttonStyle(saving || !schedule)}
            disabled={saving || !schedule}
          >
            {saving ? "Saving…" : "Save Master Schedule"}
          </button>
        </div>

        {status && (
          <div style={{ ...smallBadge, marginTop: "4px" }}>{status}</div>
        )}

        <p style={{ ...smallBadge, textAlign: "center", marginTop: "8px" }}>
          Focus on one day at a time. Nervi’s applied changes (when you answer
          “Yes” in chat) are merged into this schedule. Activities are shown
          from earliest time at the top to latest at the bottom.
        </p>

        {/* Day view */}
        <div style={dayCardStyle}>
          {currentDay ? (
            <>
              <div style={dayHeaderStyle}>
                <button
                  type="button"
                  onClick={() => goDay(-1)}
                  style={arrowButtonStyle}
                >
                  ‹
                </button>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "2px",
                    }}
                  >
                    {currentDay.label}
                  </div>
                  <div style={smallBadge}>
                    {currentBlocks.length}{" "}
                    {currentBlocks.length === 1 ? "activity" : "activities"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goDay(1)}
                  style={arrowButtonStyle}
                >
                  ›
                </button>
              </div>

              {/* Activities list with checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {currentBlocks.length === 0 && (
                  <div style={{ ...smallBadge, marginTop: "4px" }}>
                    No activities scheduled for this day yet.
                  </div>
                )}

                {currentBlocks.map((block, idx) => {
                  const key = `${currentDay.key}:${idx}`;
                  const done = !!completed[key];
                  return (
                    <div key={key} style={itemRowStyle}>
                      <input
                        type="checkbox"
                        style={checkboxStyle}
                        checked={done}
                        onChange={() => toggleCompleted(currentDay.key, idx)}
                      />
                      <span
                        style={{
                          textDecoration: done ? "line-through" : "none",
                          color: done ? "#6b7280" : "#e5e7eb",
                        }}
                      >
                        {block}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Edit toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                <span style={smallBadge}>
                  Edit the text version of this day’s schedule:
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  style={subtleButtonStyle(false)}
                >
                  {editMode ? "Hide editor" : "Edit day text"}
                </button>
              </div>

              {editMode && (
                <textarea
                  style={editTextareaStyle}
                  value={currentEditText}
                  onChange={(e) =>
                    handleDayChangeText(currentDay.key, e.target.value)
                  }
                  placeholder="One item per line, e.g. 7:30 AM – Wake, water, 5 deep breaths"
                />
              )}
            </>
          ) : (
            <div style={{ ...smallBadge, textAlign: "center" }}>
              Set your user id and load your schedule to see daily activities.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

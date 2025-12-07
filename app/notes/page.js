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
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const year = d.getFullYear();
    const month = monthNames[d.getMonth()];
    const day = d.getDate();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

export default function NotesPage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [userId, setUserId] = useState("");
  const [activity, setActivity] = useState("");
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState([]);
  const [patterns, setPatterns] = useState({ totalNotes: 0, patterns: [], insights: [] });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("nerviUserId");
      if (saved && saved.trim()) {
        setUserId(saved);
        loadNotes(saved);
      }
    }
  }, []);

  async function loadNotes(idToUse) {
    if (!idToUse || !idToUse.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/nervi-notes?userId=${encodeURIComponent(idToUse.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load notes");
      }

      setNotes(data.notes || []);
      setPatterns(data.patterns || { totalNotes: 0, patterns: [], insights: [] });
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Error loading notes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!userId.trim()) {
      alert("Set your user id on the Chat page first.");
      return;
    }

    if (!activity.trim() && !feeling.trim() && !location.trim()) {
      alert("Please fill in at least one field.");
      return;
    }

    setLoading(true);
    setStatus("Saving note...");

    try {
      const res = await fetch("/api/nervi-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          activity: activity.trim(),
          feeling: feeling.trim(),
          location: location.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      setStatus("Note saved!");
      setActivity("");
      setFeeling("");
      setLocation("");

      // Reload notes
      loadNotes(userId);
    } catch (err) {
      console.error(err);
      setStatus("Error saving note.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setActivity("");
    setFeeling("");
    setLocation("");
    setStatus("");
  }

  async function deleteNote(noteId) {
    if (!confirm("Delete this note?")) return;

    try {
      const res = await fetch("/api/nervi-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          action: "delete",
          noteId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      loadNotes(userId);
    } catch (err) {
      console.error(err);
      alert("Error deleting note");
    }
  }

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "140px", // Account for fixed header
    paddingBottom: "100px", // Account for fixed bottom nav
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "960px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "80px",
    padding: spacing.sm,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.md,
    background: theme.background,
    color: theme.textPrimary,
    fontSize: typography.fontSizes.sm,
    resize: "vertical",
    outline: "none",
  };

  const noteCardStyle = {
    padding: spacing.md,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  };

  const patternCardStyle = {
    padding: spacing.md,
    background: theme.surfaceHover,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  };

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        <SharedNav currentPage="/notes" theme={theme} onToggleTheme={toggleTheme} />

        <p style={{
          fontSize: typography.fontSizes.xs,
          color: theme.textMuted,
          textAlign: "center"
        }}>
          Track your nervous system states. Notes help identify patterns and inform your Life Story Map.
        </p>

        {/* Input Form */}
        <div style={{
          padding: spacing.lg,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: borderRadius.lg,
        }}>
          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              display: "block",
              marginBottom: spacing.xs
            }}>
              What are you up to?
            </label>
            <textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Working on a project, talking with a friend, scrolling social media..."
              style={textareaStyle}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              display: "block",
              marginBottom: spacing.xs
            }}>
              How are you feeling overall?
            </label>
            <textarea
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder="e.g., Anxious, calm, overwhelmed, activated, shut down, safe..."
              style={textareaStyle}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              display: "block",
              marginBottom: spacing.xs
            }}>
              Where are you feeling it?
            </label>
            <textarea
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Chest tight, shoulders tense, stomach knots, jaw clenched..."
              style={textareaStyle}
            />
          </div>

          <div style={{ display: "flex", gap: spacing.sm }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...components.button,
                ...components.buttonPrimary,
                flex: 1,
              }}
            >
              {loading ? "Saving..." : "Submit Note"}
            </button>
            <button
              onClick={handleClear}
              style={{
                ...components.button,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
              }}
            >
              Clear
            </button>
          </div>

          {status && (
            <div style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              marginTop: spacing.sm,
              textAlign: "center"
            }}>
              {status}
            </div>
          )}
        </div>

        {/* Patterns Section */}
        {patterns.totalNotes > 0 && (
          <div style={{
            padding: spacing.lg,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.lg,
          }}>
            <h2 style={{
              fontSize: typography.fontSizes.lg,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.md
            }}>
              Patterns Noticed ({patterns.totalNotes} notes)
            </h2>

            {patterns.patterns.length > 0 ? (
              <>
                {patterns.patterns.map((p, idx) => (
                  <div key={idx} style={patternCardStyle}>
                    <div style={{
                      fontSize: typography.fontSizes.sm,
                      fontWeight: typography.fontWeights.medium,
                      color: theme.textPrimary,
                      marginBottom: spacing.xs
                    }}>
                      {p.pattern}
                    </div>
                    <div style={{
                      fontSize: typography.fontSizes.xs,
                      color: theme.textMuted
                    }}>
                      Frequency: {p.frequency} times
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  background: theme.background,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${theme.border}`
                }}>
                  <div style={{
                    fontSize: typography.fontSizes.xs,
                    fontWeight: typography.fontWeights.semibold,
                    color: colors.info,
                    marginBottom: spacing.xs
                  }}>
                    Insights:
                  </div>
                  {patterns.insights.map((insight, idx) => (
                    <div key={idx} style={{
                      fontSize: typography.fontSizes.xs,
                      color: theme.textSecondary,
                      marginBottom: spacing.xs
                    }}>
                      • {insight}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                fontSize: typography.fontSizes.sm,
                color: theme.textMuted
              }}>
                {patterns.insights[0]}
              </div>
            )}
          </div>
        )}

        {/* Notes History */}
        <div style={{
          padding: spacing.lg,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: borderRadius.lg,
        }}>
          <h2 style={{
            fontSize: typography.fontSizes.lg,
            fontWeight: typography.fontWeights.semibold,
            color: theme.textPrimary,
            marginBottom: spacing.md
          }}>
            Your Notes ({notes.length})
          </h2>

          {notes.length === 0 ? (
            <div style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
              textAlign: "center",
              padding: spacing.xl
            }}>
              No notes yet. Submit your first note above to start tracking patterns.
            </div>
          ) : (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {notes.map((note) => (
                <div key={note.id} style={noteCardStyle}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: spacing.sm
                  }}>
                    <div style={{
                      fontSize: typography.fontSizes.xs,
                      color: theme.textMuted
                    }}>
                      {formatDate(note.created_at)}
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: theme.textMuted,
                        cursor: "pointer",
                        fontSize: typography.fontSizes.sm
                      }}
                      title="Delete note"
                    >
                      ✕
                    </button>
                  </div>

                  {note.activity && (
                    <div style={{ marginBottom: spacing.xs }}>
                      <span style={{
                        fontSize: typography.fontSizes.xs,
                        fontWeight: typography.fontWeights.semibold,
                        color: theme.textSecondary
                      }}>
                        Activity:
                      </span>
                      <span style={{
                        fontSize: typography.fontSizes.sm,
                        color: theme.textPrimary,
                        marginLeft: spacing.xs
                      }}>
                        {note.activity}
                      </span>
                    </div>
                  )}

                  {note.feeling && (
                    <div style={{ marginBottom: spacing.xs }}>
                      <span style={{
                        fontSize: typography.fontSizes.xs,
                        fontWeight: typography.fontWeights.semibold,
                        color: theme.textSecondary
                      }}>
                        Feeling:
                      </span>
                      <span style={{
                        fontSize: typography.fontSizes.sm,
                        color: theme.textPrimary,
                        marginLeft: spacing.xs
                      }}>
                        {note.feeling}
                      </span>
                    </div>
                  )}

                  {note.body_location && (
                    <div>
                      <span style={{
                        fontSize: typography.fontSizes.xs,
                        fontWeight: typography.fontWeights.semibold,
                        color: theme.textSecondary
                      }}>
                        Body:
                      </span>
                      <span style={{
                        fontSize: typography.fontSizes.sm,
                        color: theme.textPrimary,
                        marginLeft: spacing.xs
                      }}>
                        {note.body_location}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav currentPage="/notes" theme={theme} />
    </main>
  );
}

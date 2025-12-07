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

// --- helpers ---

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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

export default function HistoryPage() {
  // --- Theme ---
  const { theme, toggleTheme } = useTheme();

  // --- Component styles ---
  const components = getComponents(theme);

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "140px", // Account for fixed header
    paddingBottom: "140px", // Account for fixed bottom nav
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "960px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
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

  const layoutStyle = {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: spacing.sm,
    minHeight: "360px",
  };

  const sessionListStyle = {
    borderRadius: borderRadius.lg,
    border: `1px solid ${theme.border}`,
    padding: spacing.sm,
    backgroundColor: theme.surface,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
    overflowY: "auto",
  };

  const sessionItemStyle = (selected) => ({
    borderRadius: borderRadius.md,
    border: selected ? `1px solid ${colors.info}` : `1px solid ${theme.border}`,
    padding: `${spacing.sm} ${spacing.sm}`,
    backgroundColor: selected ? theme.surfaceHover : theme.surface,
    cursor: "pointer",
    fontSize: typography.fontSizes.xs,
  });

  const messagePanelStyle = {
    borderRadius: borderRadius.lg,
    border: `1px solid ${theme.border}`,
    padding: spacing.sm,
    backgroundColor: theme.surface,
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
    maxHeight: "420px",
    overflowY: "auto",
  };

  const bubbleUser = {
    alignSelf: "flex-end",
    backgroundColor: theme.accent,
    color: theme.textInverse,
    borderRadius: borderRadius.lg,
    padding: `${spacing.sm} ${spacing.sm}`,
    margin: `${spacing.xs} 0`,
    maxWidth: "80%",
    fontSize: typography.fontSizes.xs,
    whiteSpace: "pre-wrap",
  };

  const bubbleNervi = {
    alignSelf: "flex-start",
    backgroundColor: theme.surfaceHover,
    color: theme.textPrimary,
    borderRadius: borderRadius.lg,
    padding: `${spacing.sm} ${spacing.sm}`,
    margin: `${spacing.xs} 0`,
    maxWidth: "80%",
    fontSize: typography.fontSizes.xs,
    whiteSpace: "pre-wrap",
  };

  // --- State ---
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("nerviUserId");
      if (saved && saved.trim()) {
        setUserId(saved);
      }
    }
  }, []);

  async function loadSessions() {
    if (!userId.trim()) {
      alert("Enter the same user id you use on the main Nervi page.");
      return;
    }

    setLoadingSessions(true);
    setStatus("Loading sessions…");
    setSessions([]);
    setSelectedSessionId(null);
    setMessages([]);

    try {
      const res = await fetch(
        `/api/history?userId=${encodeURIComponent(userId.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load sessions");
      }
      setSessions(data.sessions || []);
      setStatus(
        (data.sessions || []).length
          ? `Loaded ${data.sessions.length} sessions.`
          : "No sessions found for this user yet."
      );
    } catch (err) {
      console.error(err);
      setStatus("Error loading sessions. See console for details.");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadMessages(sessionId) {
    if (!userId.trim()) return;
    setLoadingMessages(true);
    setMessages([]);
    setStatus("Loading messages…");

    try {
      const res = await fetch(
        `/api/history?userId=${encodeURIComponent(
          userId.trim()
        )}&sessionId=${encodeURIComponent(sessionId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load messages");
      }
      setMessages(data.messages || []);
      setStatus(
        (data.messages || []).length
          ? `Loaded ${data.messages.length} messages.`
          : "No messages in this session."
      );
    } catch (err) {
      console.error(err);
      setStatus("Error loading messages. See console for details.");
    } finally {
      setLoadingMessages(false);
    }
  }

  function handleSelectSession(session) {
    setSelectedSessionId(session.session_id);
    loadMessages(session.session_id);
  }

  function toggleSessionSelection(sessionId) {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  }

  function selectAllSessions() {
    const allIds = sessions.map(s => s.session_id);
    setSelectedSessions(new Set(allIds));
  }

  function deselectAllSessions() {
    setSelectedSessions(new Set());
  }

  async function handleDeleteSelected() {
    if (selectedSessions.size === 0) {
      alert("No sessions selected to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSessions.size} conversation(s)? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setStatus("Deleting conversations...");

    try {
      const sessionsToDelete = Array.from(selectedSessions);

      // Delete each session
      for (const sessionId of sessionsToDelete) {
        const res = await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId.trim(),
            sessionId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to delete session ${sessionId}`);
        }
      }

      // Clear selection and reload
      setSelectedSessions(new Set());
      if (selectedSessions.has(selectedSessionId)) {
        setSelectedSessionId(null);
        setMessages([]);
      }

      await loadSessions();
      setStatus(`Successfully deleted ${sessionsToDelete.length} conversation(s)`);
    } catch (err) {
      console.error(err);
      setStatus("Error deleting conversations. See console for details.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        <h1 style={{
          fontSize: typography.fontSizes.xl,
          fontWeight: typography.fontWeights.semibold,
          textAlign: "center",
          color: theme.textPrimary
        }}>
          Nervi – History Inspector
        </h1>

        <SharedNav currentPage="/history" theme={theme} onToggleTheme={toggleTheme} />

        <p style={{ ...smallBadge, textAlign: "center" }}>
          Browse past Nervi sessions for a single user id. Use this to review
          patterns and how your nervous system has been over time.
        </p>

        {/* User id row */}
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
            onClick={loadSessions}
            style={buttonStyle(loadingSessions)}
            disabled={loadingSessions}
          >
            {loadingSessions ? "Loading…" : "Load history"}
          </button>
        </div>

        {status && (
          <div style={{ ...smallBadge, marginTop: "4px" }}>{status}</div>
        )}

        <div style={layoutStyle}>
          {/* Sessions list */}
          <div style={sessionListStyle}>
            <div style={{ ...smallBadge, marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Sessions ({sessions.length})</span>
              {sessions.length > 0 && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={selectAllSessions}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      background: theme.surfaceHover,
                      border: `1px solid ${theme.border}`,
                      borderRadius: borderRadius.sm,
                      cursor: "pointer",
                      color: theme.textSecondary,
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllSessions}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      background: theme.surfaceHover,
                      border: `1px solid ${theme.border}`,
                      borderRadius: borderRadius.sm,
                      cursor: "pointer",
                      color: theme.textSecondary,
                    }}
                  >
                    Deselect
                  </button>
                </div>
              )}
            </div>
            {sessions.length === 0 && (
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                No sessions loaded yet.
              </div>
            )}
            {sessions.map((s) => (
              <div
                key={s.session_id}
                style={{
                  ...sessionItemStyle(s.session_id === selectedSessionId),
                  display: "flex",
                  gap: spacing.xs,
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSessions.has(s.session_id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSessionSelection(s.session_id);
                  }}
                  style={{
                    marginTop: "2px",
                    cursor: "pointer",
                    width: "16px",
                    height: "16px",
                  }}
                />
                <div
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => handleSelectSession(s)}
                >
                  <div style={{ fontSize: "12px", fontWeight: 500 }}>
                    {formatDate(s.first_created_at)}
                  </div>
                  <div style={{ ...smallBadge }}>
                    {s.program_type || "unknown program"} • {s.message_count} msgs
                  </div>
                </div>
              </div>
            ))}

            {/* Delete button */}
            {selectedSessions.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                style={{
                  ...components.button,
                  marginTop: spacing.sm,
                  background: colors.danger,
                  color: "#fff",
                  fontSize: typography.fontSizes.xs,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting..." : `Delete Selected (${selectedSessions.size})`}
              </button>
            )}
          </div>

          {/* Messages viewer */}
          <div style={messagePanelStyle}>
            {selectedSessionId ? (
              <>
                <div
                  style={{
                    ...smallBadge,
                    marginBottom: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Session: {selectedSessionId}</span>
                  {loadingMessages && <span>Loading…</span>}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={
                        m.role === "assistant" ? bubbleNervi : bubbleUser
                      }
                    >
                      {m.content}
                    </div>
                  ))}
                  {!messages.length && !loadingMessages && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      No messages loaded for this session yet.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Select a session from the left to view its messages.
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav currentPage="/history" theme={theme} />
    </main>
  );
}

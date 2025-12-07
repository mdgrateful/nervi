"use client";

import { useState, useEffect, useRef } from "react";
import {
  lightTheme,
  colors,
  spacing,
  borderRadius,
  typography,
  getComponents
} from "./design-system";
import { SharedNav } from "./components/SharedNav";
import { BottomNav } from "./components/BottomNav";
import { NerviHeader } from "./components/NerviHeader";
import { useTheme } from "./hooks/useTheme";

// --- Master Schedule helpers (proposal -> schedule) ---

function saveLastScheduleProposal(proposalText) {
  try {
    if (typeof window === "undefined") return;
    const payload = {
      proposalText,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      "nerviLastScheduleProposal",
      JSON.stringify(payload)
    );
    return payload;
  } catch {
    return null;
  }
}

function extractScheduleProposal(replyText) {
  if (!replyText || typeof replyText !== "string") return "";

  const marker = "Proposed additions to your schedule";
  const idx = replyText.toLowerCase().indexOf(marker.toLowerCase());
  if (idx === -1) return "";

  const tail = replyText.slice(idx + marker.length);

  const lines = tail
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•*]\s*/, ""));

  const keep = lines.filter((l) => l.includes("–") || l.includes("-"));

  return keep.map((l) => l.replace(/\s-\s/g, " – ")).join("\n");
}

function normalizeDayToken(token) {
  const t = (token || "")
    .toLowerCase()
    .trim()
    .replace(/^[-•*]\s*/, "");

  if (t.startsWith("mon")) return "mon";
  if (t.startsWith("tue")) return "tue";
  if (t.startsWith("wed")) return "wed";
  if (t.startsWith("thu")) return "thu";
  if (t.startsWith("fri")) return "fri";
  if (t.startsWith("sat")) return "sat";
  if (t.startsWith("sun")) return "sun";
  if (t.startsWith("daily")) return "daily";
  return null;
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

function parseProposalLines(proposalText) {
  const lines = (proposalText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const byDay = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  const daily = [];

  for (const line of lines) {
    const m = line.match(/^([A-Za-z]+)\s*[–-]\s*(.+)$/);
    if (!m) continue;
    const dayToken = m[1];
    const rest = m[2].trim();
    const key = normalizeDayToken(dayToken);
    if (!key || !rest) continue;

    if (key === "daily") {
      daily.push(rest);
    } else {
      byDay[key].push(rest);
    }
  }

  if (daily.length) {
    Object.keys(byDay).forEach((k) => {
      byDay[k] = [...byDay[k], ...daily];
    });
  }

  Object.keys(byDay).forEach((k) => {
    byDay[k] = byDay[k].filter((v, i, a) => a.indexOf(v) === i);
  });

  return byDay;
}

async function applyProposalToMasterSchedule(proposalText, effectiveUserId) {
  if (!proposalText || !effectiveUserId) return false;

  const res = await fetch(
    `/api/master-schedule?userId=${encodeURIComponent(effectiveUserId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load master schedule");

  const current = data.schedule;
  if (!current || !Array.isArray(current.days)) {
    throw new Error("Master schedule shape is missing days[]");
  }

  const additions = parseProposalLines(proposalText);

  const next = {
    ...current,
    days: current.days.map((day) => {
      const short = normalizeDayShort(day.key, day.label);
      const add = short ? additions[short] || [] : [];

      const existing = Array.isArray(day.blocks) ? day.blocks : [];
      const merged = [...existing, ...add].filter(
        (v, i, a) => a.indexOf(v) === i
      );

      return { ...day, blocks: merged };
    }),
  };

  const saveRes = await fetch("/api/master-schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: effectiveUserId,
      schedule: next,
    }),
  });

  const saveData = await saveRes.json();
  if (!saveRes.ok) {
    throw new Error(saveData.error || "Failed to save master schedule");
  }

  return true;
}

export default function Home() {
  // --- Theme ---
  const { theme, toggleTheme } = useTheme();

  // --- Chat state & schedule-related state ---

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("F");

  const [userId, setUserId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [sessionStartedAt, setSessionStartedAt] = useState(null);

  const [program, setProgram] = useState("free"); // "free" | "daily-checkin" | "somatic-reset"

  // --- Mic state ---

  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Load saved userId, initialize session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("nerviUserId");
      if (saved && saved.trim()) {
        setUserId(saved);
        setIsRegistered(true);
      }
    }
  }, []);

  // Load messages from localStorage when userId is available
  useEffect(() => {
    if (typeof window !== "undefined" && userId && userId.trim()) {
      const storageKey = `nerviChatMessages_${userId}`;
      const savedMessages = window.localStorage.getItem(storageKey);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved messages:", e);
        }
      }
    }
  }, [userId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && userId && userId.trim() && messages.length > 0) {
      const storageKey = `nerviChatMessages_${userId}`;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save messages:", e);
      }
    }
  }, [messages, userId]);

  useEffect(() => {
    if (!sessionId) {
      const now = new Date();
      const newId = `s-${now.getTime()}`;
      setSessionId(newId);
      setSessionStartedAt(now);
    }
  }, [sessionId]);

  // Set up browser SpeechRecognition once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false; // final results only

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();

      if (!transcript) return;

      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  function toggleRecording() {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech-to-text is not supported in this browser yet.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  function getProgramIntroText(currentProgram, currentMode) {
    const voiceLabel = currentMode === "M" ? "Nervi-M" : "Nervi-F";

    if (currentProgram === "daily-checkin") {
      return (
        `${voiceLabel}: This is your Daily Check-In.\n` +
        `Let’s keep it simple. First, in a sentence or two, tell me:\n` +
        `• How does your body feel right now?\n` +
        `• What’s the main emotion or thought on your mind?\n` +
        `Then we’ll pick 1–2 tiny, realistic actions or comforts for the rest of today.`
      );
    }

    if (currentProgram === "somatic-reset") {
      return (
        `${voiceLabel}: This is a Somatic Reset.\n` +
        `We’ll go slowly and stay close to your body.\n` +
        `Start by telling me where you feel the tension or discomfort in your body right now.\n` +
        `I’ll guide you through a few simple grounding steps.`
      );
    }

    return (
      `${voiceLabel}: This is open, free-form space.\n` +
      `You can tell me what’s on your mind or what your nervous system feels like right now,\n` +
      `and we’ll explore it together at your pace.`
    );
  }

  function saveUserId() {
    const trimmed = userId.trim();
    if (!trimmed) {
      alert("Please enter a name or email so Nervi can remember you.");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nerviUserId", trimmed);
    }
    setUserId(trimmed);
    setIsRegistered(true);
  }

  function resetUserId() {
    if (typeof window !== "undefined") {
      // Clear messages for current user before resetting
      if (userId && userId.trim()) {
        const storageKey = `nerviChatMessages_${userId}`;
        window.localStorage.removeItem(storageKey);
      }
      window.localStorage.removeItem("nerviUserId");
    }
    setUserId("");
    setIsRegistered(false);
    setMessages([]);
  }

  function startNewSession() {
    const now = new Date();
    const newId = `s-${now.getTime()}`;
    setSessionId(newId);
    setSessionStartedAt(now);

    const introText = getProgramIntroText(program, mode);
    setMessages([
      {
        from: "nervi",
        text: introText,
      },
    ]);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      alert("Please set your name at the top so Nervi can remember you.");
      return;
    }

    if (!sessionId) {
      alert("Session not initialized yet. Try again in a moment.");
      return;
    }

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setLoading(true);

    try {
      const text = userText.toLowerCase();

      // Explicit schedule keywords that ALWAYS trigger schedule intent
      const explicitScheduleKeywords = [
        "update my schedule",
        "update master schedule",
        "change my schedule",
        "modify my schedule",
        "add to my schedule",
        "add to schedule",
        "schedule this",
        "put this on my schedule",
      ];

      // General keywords that only trigger if cooldown has passed
      const generalScheduleKeywords = [
        "schedule",
        "routine",
        "master schedule",
        "daily plan",
        "weekly plan",
        "change my routine",
        "change my days",
        "exercise",
        "exercises",
        "somatic",
        "somatic exercise",
        "emdr",
        "eft",
        "yoga",
        "practice",
        "practices",
        "add exercises",
        "add more exercise",
        "add more exercises",
        "workout",
        "walk",
        "walking",
        "gym",
        "training",
        "event",
        "presentation",
        "interview",
        "meeting",
      ];

      // Check if user explicitly wants schedule changes
      const isExplicitScheduleRequest = explicitScheduleKeywords.some((kw) =>
        text.includes(kw.toLowerCase())
      );

      // Check cooldown: 24 hours since last schedule proposal
      let cooldownPassed = true;
      if (typeof window !== "undefined") {
        const lastProposal = window.localStorage.getItem("nerviLastScheduleProposalTime");
        if (lastProposal) {
          const hoursSince = (Date.now() - parseInt(lastProposal)) / (1000 * 60 * 60);
          cooldownPassed = hoursSince >= 24;
        }
      }

      // Determine schedule intent
      let scheduleIntent = false;
      if (isExplicitScheduleRequest) {
        // Always allow explicit requests
        scheduleIntent = true;
      } else if (cooldownPassed) {
        // Only check general keywords if cooldown has passed
        scheduleIntent = generalScheduleKeywords.some((kw) =>
          text.includes(kw.toLowerCase())
        );
      }

      const res = await fetch("/api/nervi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          mode,
          userId: trimmedUserId,
          sessionId,
          programType: program,
          scheduleIntent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [...prev, { from: "nervi", text: data.reply }]);

      const proposalText = extractScheduleProposal(data.reply);

      if (proposalText) {
        saveLastScheduleProposal(proposalText);

        // Save timestamp to prevent frequent schedule suggestions (24h cooldown)
        if (typeof window !== "undefined") {
          window.localStorage.setItem("nerviLastScheduleProposalTime", Date.now().toString());
        }

        const ok = window.confirm(
          "Nervi proposed additions to your Master Schedule.\n\nUpdate your Master Schedule now?"
        );

        if (ok) {
          try {
            await applyProposalToMasterSchedule(proposalText, trimmedUserId);
            setMessages((prev) => [
              ...prev,
              {
                from: "nervi",
                text:
                  "✅ I updated your Master Schedule with those additions. You can review them in the Schedule tab.",
              },
            ]);
          } catch (e) {
            console.error(e);
            setMessages((prev) => [
              ...prev,
              {
                from: "nervi",
                text:
                  "I tried to update your Master Schedule automatically, but something failed. The proposal is saved and you can still import it from the Schedule tab.",
              },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              from: "nervi",
              text:
                "No problem. I saved the proposal so you can import it later from the Schedule tab.",
            },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          from: "nervi",
          text:
            "I ran into a technical issue trying to respond, but your message still matters. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatSessionStarted() {
    if (!sessionStartedAt) return "";
    try {
      const d =
        sessionStartedAt instanceof Date
          ? sessionStartedAt
          : new Date(sessionStartedAt);

      if (isNaN(d.getTime())) return "";

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
      return "";
    }
  }

  // --- layout styles ---

  const components = getComponents(theme);

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "140px", // Account for fixed header
    paddingBottom: "180px", // Extra space for bottom nav and input on mobile
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "640px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  };

  const chatBoxStyle = {
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: "400px",
    overflowY: "auto",
    background: theme.surface,
    fontSize: typography.fontSizes.md,
  };

  const inputRowStyle = {
    display: "flex",
    gap: spacing.md,
    marginTop: spacing.sm,
  };

  const inputStyle = {
    ...components.input,
    flex: 1,
    borderRadius: borderRadius.full,
    outline: "none",
  };

  const buttonStyle = {
    ...components.button,
    ...components.buttonPrimary,
    borderRadius: borderRadius.full,
    backgroundColor: loading ? theme.border : theme.accent,
    cursor: loading ? "default" : "pointer",
  };

  const bubbleUser = {
    alignSelf: "flex-end",
    backgroundColor: theme.accent,
    color: theme.textInverse,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    margin: "4px 0",
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
  };

  const bubbleNervi = {
    alignSelf: "flex-start",
    backgroundColor: theme.surfaceHover,
    color: theme.textPrimary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    margin: "4px 0",
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
  };

  const modeButtonBase = {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSizes.sm,
    cursor: "pointer",
    backgroundColor: theme.surface,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
  };

  const programButtonBase = {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSizes.xs,
    cursor: "pointer",
    backgroundColor: theme.surface,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
  };

  const smallBadge = {
    fontSize: typography.fontSizes.xs,
    color: theme.textMuted,
  };

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        <SharedNav currentPage="/" theme={theme} onToggleTheme={toggleTheme} />


        {/* User identity row */}
        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            marginBottom: spacing.xs,
            background: theme.surface,
          }}
        >
          {!isRegistered ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={smallBadge}>
                Who are you? (A name or email — Nervi uses this to remember your
                journey on this device.)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{ ...inputStyle, borderRadius: "8px" }}
                  placeholder="e.g. Brandon, or brandon@email.com"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <button
                  style={{
                    ...buttonStyle,
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: typography.fontSizes.sm,
                    backgroundColor: colors.success,
                  }}
                  type="button"
                  onClick={saveUserId}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <span style={{
                fontSize: typography.fontSizes.sm,
                color: theme.textMuted
              }}>
                Chatting as:
              </span>
              <span style={{
                fontSize: typography.fontSizes.sm,
                fontWeight: typography.fontWeights.semibold,
                color: theme.textPrimary
              }}>
                {userId}
              </span>
            </div>
          )}
        </div>

        {/* Session info + New Session */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <div style={smallBadge}>
            Current session: {formatSessionStarted() || "initializing…"}
          </div>
          <button
            type="button"
            onClick={startNewSession}
            style={{
              ...buttonStyle,
              padding: `${spacing.xs} ${spacing.md}`,
              fontSize: typography.fontSizes.xs,
              backgroundColor: theme.accent,
            }}
          >
            New Session
          </button>
        </div>

        {/* Removed program selection - using default free chat mode */}
        <div style={{ display: "none" }}>
          <div style={smallBadge}>
            {program === "free" &&
              "Open-ended conversation. Nervi just meets you where you are."}
            {program === "daily-checkin" &&
              "Short, structured check-in to track how you’re doing over time."}
            {program === "somatic-reset" &&
              "Gently guides you back into your body and nervous system when you feel spun up."}
          </div>
        </div>

        <p
          style={{
            fontSize: typography.fontSizes.sm,
            color: theme.textMuted,
            textAlign: "center",
            marginBottom: spacing.xs,
          }}
        >
          Tell Nervi how your body and heart feel right now. This is a safe,
          non-judgmental space.
        </p>

        {/* Chat box */}
        <div style={chatBoxStyle}>
          {messages.length === 0 && (
            <p style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary
            }}>
              You can start by saying something like "My chest feels tight and I
              can't stop worrying about money."
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={msg.from === "user" ? bubbleUser : bubbleNervi}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <p
                style={{
                  fontSize: typography.fontSizes.xs,
                  color: theme.textMuted,
                  fontStyle: "italic",
                  marginTop: spacing.xs,
                }}
              >
                Nervi is thinking with you…
              </p>
            )}
          </div>
        </div>

        {/* Input row with mic */}
        <div style={inputRowStyle}>
          <input
            style={inputStyle}
            placeholder={
              speechSupported
                ? "Type or tap the mic to speak…"
                : "Type what’s happening for you right now…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Mic button */}
          <button
            type="button"
            onClick={toggleRecording}
            style={{
              borderRadius: borderRadius.full,
              padding: `${spacing.sm} ${spacing.md}`,
              border: isRecording ? `2px solid ${colors.warning}` : `1px solid ${theme.border}`,
              backgroundColor: isRecording ? theme.surfaceHover : theme.surface,
              color: colors.warning,
              cursor: "pointer",
              fontSize: typography.fontSizes.md,
              fontWeight: typography.fontWeights.medium,
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
              boxShadow: isRecording
                ? `0 0 0 4px ${theme.background === lightTheme.background ? 'rgba(245, 158, 11, 0.2)' : 'rgba(251, 146, 60, 0.3)'}`
                : "none",
              transition: "all 0.15s ease-out",
            }}
          >
            <span style={{ fontSize: "18px" }}>🎙️</span>
            <span>{isRecording ? "Listening…" : "Speak"}</span>
          </button>

          {/* Send button - Animated focal point */}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              position: "relative",
              padding: `${spacing.md} ${spacing.xl}`,
              borderRadius: borderRadius.full,
              border: "none",
              background: loading
                ? theme.surfaceHover
                : !input.trim()
                ? theme.surface
                : `linear-gradient(135deg, ${colors.info} 0%, ${colors.success} 100%)`,
              color: !input.trim() ? theme.textMuted : "#FFFFFF",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: typography.fontSizes.md,
              fontWeight: typography.fontWeights.bold,
              boxShadow:
                !loading && input.trim()
                  ? "0 8px 24px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(16, 185, 129, 0.3)"
                  : "none",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: loading ? "scale(0.98)" : "scale(1)",
              opacity: loading || !input.trim() ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
              overflow: "hidden",
            }}
            onMouseDown={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.transform = "scale(0.95)";
              }
            }}
            onMouseUp={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            className="send-button"
          >
            {loading ? (
              <>
                <span className="spinner" style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <span>Sending</span>
              </>
            ) : (
              <>
                <span>{input.trim() ? "Send" : "Type to start"}</span>
                {input.trim() && <span style={{ fontSize: "18px" }}>→</span>}
              </>
            )}
            {!loading && input.trim() && (
              <div
                className="button-glow"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 70%)",
                  animation: "pulse 2s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
          </button>
        </div>

        {/* Add BottomNav and animations */}
        <BottomNav currentPage="/" theme={theme} />

        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }

          .send-button:hover:not(:disabled) {
            transform: scale(1.05) !important;
            box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5),
              0 6px 16px rgba(16, 185, 129, 0.4) !important;
          }

          .send-button:active:not(:disabled) {
            transform: scale(0.98) !important;
          }
        `}</style>
      </div>
    </main>
  );
}

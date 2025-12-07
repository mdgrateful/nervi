"use client";

import { useState, useEffect } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
} from "../design-system";

export function NerviDailyReadCard({ theme, userId }) {
  const [dailyRead, setDailyRead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intensity, setIntensity] = useState("honest-kind");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedIntensity = window.localStorage.getItem("nerviReadIntensity");
      if (savedIntensity) {
        setIntensity(savedIntensity);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadDailyRead();
    }
  }, [userId, intensity]);

  async function loadDailyRead() {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/nervi-daily-read?userId=${encodeURIComponent(userId)}&intensity=${intensity}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load daily read");
      }

      setDailyRead(data);
    } catch (err) {
      console.error("Error loading daily read:", err);
      setDailyRead(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleMicroAction(actionType) {
    if (actionType === "reset-flow") {
      // Could open a modal with guided reset flow
      alert("3-minute reset flow coming soon!");
    } else if (actionType === "schedule-checkin") {
      // Could open a time picker for scheduling
      alert("Check-in scheduling coming soon!");
    }
  }

  if (!userId) return null;
  if (loading) {
    return (
      <div
        style={{
          padding: spacing.xl,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: borderRadius.xl,
          textAlign: "center",
          color: theme.textMuted,
        }}
      >
        Loading your daily read...
      </div>
    );
  }

  if (!dailyRead) return null;

  return (
    <div
      style={{
        padding: spacing.xl,
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        borderRight: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`,
        borderLeft: `4px solid ${colors.info}`,
        borderRadius: borderRadius.xl,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSizes.lg,
          fontWeight: typography.fontWeights.semibold,
          color: theme.textPrimary,
          marginBottom: spacing.md,
        }}
      >
        Nervi's Read on Today
      </h2>

      {/* Today's Theme */}
      <p
        style={{
          fontSize: typography.fontSizes.md,
          color: theme.textSecondary,
          marginBottom: spacing.lg,
          fontStyle: "italic",
          lineHeight: "1.6",
        }}
      >
        {dailyRead.todaysTheme}
      </p>

      {/* Watch For */}
      {dailyRead.watchFor && dailyRead.watchFor.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <h3
            style={{
              fontSize: typography.fontSizes.sm,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Things to watch for today
          </h3>
          <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
            {dailyRead.watchFor.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: theme.textSecondary,
                  marginBottom: spacing.xs,
                  lineHeight: "1.5",
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What Helps */}
      {dailyRead.whatHelps && dailyRead.whatHelps.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <h3
            style={{
              fontSize: typography.fontSizes.sm,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Protective moves that usually help you
          </h3>
          <ul style={{ paddingLeft: spacing.lg, margin: 0 }}>
            {dailyRead.whatHelps.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: theme.textSecondary,
                  marginBottom: spacing.xs,
                  lineHeight: "1.5",
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tiny Pact */}
      {dailyRead.tinyPact && (
        <div
          style={{
            padding: spacing.md,
            background: theme.background,
            borderRadius: borderRadius.md,
            border: `1px solid ${theme.border}`,
            marginBottom: spacing.md,
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSizes.sm,
              fontWeight: typography.fontWeights.semibold,
              color: colors.info,
              marginBottom: spacing.xs,
            }}
          >
            One tiny pact for today
          </h3>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textPrimary,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            <strong>{dailyRead.tinyPact.condition}</strong> →{" "}
            {dailyRead.tinyPact.action}
          </p>
        </div>
      )}

      {/* Micro Action Button */}
      {dailyRead.microAction && (
        <button
          onClick={() => handleMicroAction(dailyRead.microAction.action)}
          style={{
            width: "100%",
            padding: spacing.md,
            background: colors.info,
            color: "#fff",
            border: "none",
            borderRadius: borderRadius.md,
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          {dailyRead.microAction.text}
        </button>
      )}
    </div>
  );
}

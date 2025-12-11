"use client";

import { useState, useEffect } from "react";
import { lightTheme, spacing, borderRadius, typography } from "../design-system";

export function DisclaimerModal({ theme = lightTheme, onAccept }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    if (typeof window !== "undefined") {
      const hasAccepted = window.localStorage.getItem("nervi_disclaimer_accepted");
      if (!hasAccepted) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nervi_disclaimer_accepted", "true");

      // Check if user is already authenticated
      const userId = window.localStorage.getItem("nerviUserId");
      if (!userId || !userId.trim()) {
        // Not authenticated - redirect to login page
        window.location.href = "/login";
        return;
      }
    }
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Modal */}
        <div
          style={{
            background: theme.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <div
              style={{
                fontSize: "32px",
                lineHeight: "1",
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: typography.fontSizes.xl,
                fontWeight: typography.fontWeights.bold,
                color: theme.textPrimary,
                margin: 0,
              }}
            >
              Important Information
            </h2>
          </div>

          {/* Content */}
          <div
            style={{
              fontSize: typography.fontSizes.base,
              color: theme.textSecondary,
              lineHeight: "1.6",
              marginBottom: spacing.xl,
            }}
          >
            <p style={{ marginTop: 0 }}>
              <strong style={{ color: theme.textPrimary }}>
                Nervi is an AI nervous system companion, not a doctor or therapist.
              </strong>
            </p>

            <ul style={{ paddingLeft: spacing.lg, margin: `${spacing.md} 0` }}>
              <li style={{ marginBottom: spacing.sm }}>
                Nervi does <strong>not</strong> provide medical care, diagnosis, or psychotherapy.
              </li>
              <li style={{ marginBottom: spacing.sm }}>
                Nervi does <strong>not</strong> replace professional mental health treatment.
              </li>
            </ul>

            <p
              style={{
                background: theme.background,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                border: `1px solid ${theme.border}`,
                marginBottom: spacing.md,
              }}
            >
              If you are in crisis, thinking about harming yourself or others, or in immediate
              danger, <strong style={{ color: theme.textPrimary }}>do not use Nervi for help.</strong>{" "}
              Call your local emergency number (such as 911 in the U.S.), go to the nearest
              emergency room, or contact a crisis hotline in your area.
            </p>

            <p style={{ marginBottom: spacing.md }}>
              By using Nervi, you agree to our{" "}
              <a
                href="/terms"
                target="_blank"
                style={{
                  color: theme.accent,
                  textDecoration: "none",
                  fontWeight: typography.fontWeights.medium,
                }}
              >
                Terms of Use
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                style={{
                  color: theme.accent,
                  textDecoration: "none",
                  fontWeight: typography.fontWeights.medium,
                }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            style={{
              width: "100%",
              padding: `${spacing.md} ${spacing.lg}`,
              background: theme.accent,
              color: theme.textInverse,
              border: "none",
              borderRadius: borderRadius.lg,
              fontSize: typography.fontSizes.base,
              fontWeight: typography.fontWeights.semibold,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            I Understand and Accept
          </button>
        </div>
      </div>
    </>
  );
}

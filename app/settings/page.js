"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { lightTheme, darkTheme, spacing, borderRadius, typography } from "../design-system";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState(lightTheme);
  const [userId, setUserId] = useState(null);

  // Load theme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("nervi_theme");
      if (savedTheme === "dark") {
        setTheme(darkTheme);
      }
    }
  }, []);

  // Get userId
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    } else if (typeof window !== "undefined") {
      const storedUserId = window.localStorage.getItem("nerviUserId");
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const toggleTheme = () => {
    const newTheme = theme.background === lightTheme.background ? darkTheme : lightTheme;
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "nervi_theme",
        newTheme.background === darkTheme.background ? "dark" : "light"
      );
    }
  };

  if (status === "loading") {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", padding: spacing.xl }}>
        <div style={{ color: theme.textSecondary }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.background, minHeight: "100vh", paddingBottom: "120px" }}>
      <SharedNav
        currentPage="/settings"
        theme={theme}
        onToggleTheme={toggleTheme}
        userId={userId}
      />

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: spacing.xl,
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: typography.fontSizes["3xl"],
            fontWeight: typography.fontWeights.bold,
            color: theme.textPrimary,
            marginBottom: spacing.xl,
          }}
        >
          Settings & About
        </h1>

        {/* About Nervi Section */}
        <section
          style={{
            background: theme.surface,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            border: `1px solid ${theme.border}`,
            marginBottom: spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            About Nervi
          </h2>
          <p
            style={{
              fontSize: typography.fontSizes.base,
              color: theme.textSecondary,
              lineHeight: "1.6",
              marginBottom: spacing.md,
            }}
          >
            Nervi is a trauma-aware, nervous-system-focused AI companion designed to help you feel
            less overwhelmed and more grounded in daily life.
          </p>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
              lineHeight: "1.6",
            }}
          >
            Version 1.0.0
          </p>
        </section>

        {/* Important Disclaimer Section */}
        <section
          style={{
            background: theme.surface,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            border: `2px solid ${theme.warning || "#f59e0b"}`,
            marginBottom: spacing.xl,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <div style={{ fontSize: "24px" }}>⚠️</div>
            <h2
              style={{
                fontSize: typography.fontSizes.xl,
                fontWeight: typography.fontWeights.semibold,
                color: theme.textPrimary,
                margin: 0,
              }}
            >
              Important: Medical Disclaimer
            </h2>
          </div>

          <div
            style={{
              fontSize: typography.fontSizes.base,
              color: theme.textSecondary,
              lineHeight: "1.6",
            }}
          >
            <p>
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

            <div
              style={{
                background: theme.background,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                border: `1px solid ${theme.border}`,
                marginBottom: spacing.md,
              }}
            >
              <p style={{ margin: 0 }}>
                If you are in crisis, thinking about harming yourself or others, or in immediate
                danger,{" "}
                <strong style={{ color: theme.textPrimary }}>do not use Nervi for help.</strong>{" "}
                Call your local emergency number (such as 911 in the U.S.), go to the nearest
                emergency room, or contact a crisis hotline in your area.
              </p>
            </div>

            <p style={{ marginBottom: 0, fontSize: typography.fontSizes.sm }}>
              <strong>Crisis Resources:</strong>
              <br />
              • National Suicide Prevention Lifeline: 988
              <br />
              • Crisis Text Line: Text HOME to 741741
              <br />• SAMHSA National Helpline: 1-800-662-4357
            </p>
          </div>
        </section>

        {/* Legal Links Section */}
        <section
          style={{
            background: theme.surface,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            border: `1px solid ${theme.border}`,
            marginBottom: spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Legal & Privacy
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
            }}
          >
            <a
              href="/terms"
              target="_blank"
              style={{
                padding: spacing.md,
                background: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: borderRadius.md,
                color: theme.accent,
                textDecoration: "none",
                fontSize: typography.fontSizes.base,
                fontWeight: typography.fontWeights.medium,
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              Terms of Use →
            </a>

            <a
              href="/privacy"
              target="_blank"
              style={{
                padding: spacing.md,
                background: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: borderRadius.md,
                color: theme.accent,
                textDecoration: "none",
                fontSize: typography.fontSizes.base,
                fontWeight: typography.fontWeights.medium,
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              Privacy Policy →
            </a>

            <a
              href="/support"
              target="_blank"
              style={{
                padding: spacing.md,
                background: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: borderRadius.md,
                color: theme.accent,
                textDecoration: "none",
                fontSize: typography.fontSizes.base,
                fontWeight: typography.fontWeights.medium,
                transition: "all 0.2s ease",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              Support & Contact →
            </a>
          </div>
        </section>

        {/* Account Section */}
        <section
          style={{
            background: theme.surface,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            border: `1px solid ${theme.border}`,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Account
          </h2>

          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
              marginBottom: spacing.md,
            }}
          >
            User ID: {userId || session?.user?.username || "Not logged in"}
          </p>

          <a
            href="/profile"
            style={{
              display: "inline-block",
              padding: `${spacing.sm} ${spacing.lg}`,
              background: theme.accent,
              color: theme.textInverse,
              borderRadius: borderRadius.md,
              textDecoration: "none",
              fontSize: typography.fontSizes.base,
              fontWeight: typography.fontWeights.medium,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Manage Account →
          </a>
        </section>
      </div>

      <BottomNav currentPage="/settings" theme={theme} />
    </div>
  );
}

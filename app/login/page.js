"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents
} from "../design-system";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

export default function LoginPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = window.localStorage.getItem("nerviUserId");
      if (userId && userId.trim()) {
        // Already logged in, redirect to dashboard
        router.push("/dashboard");
      }
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Please enter your name or email");
      return;
    }

    // Basic email validation if it looks like an email
    if (normalized.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        setError("Please enter a valid email address");
        return;
      }
    }

    setLoading(true);

    try {
      // Save to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem("nerviUserId", normalized);
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const components = getComponents(theme);

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: spacing.xl,
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "480px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    padding: spacing.xxl,
  };

  const inputStyle = {
    ...components.input,
    fontSize: typography.fontSizes.base,
  };

  const buttonStyle = {
    ...components.button,
    ...components.buttonPrimary,
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    width: "100%",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        {/* Logo/Icon */}
        <div style={{ textAlign: "center", marginBottom: spacing.md }}>
          <div style={{ fontSize: "48px", marginBottom: spacing.sm }}>🧠</div>
          <h1
            style={{
              fontSize: typography.fontSizes.xxl,
              fontWeight: typography.fontWeights.bold,
              color: theme.textPrimary,
              margin: 0,
              marginBottom: spacing.xs,
            }}
          >
            Welcome to Nervi
          </h1>
          <p
            style={{
              fontSize: typography.fontSizes.base,
              color: theme.textSecondary,
              margin: 0,
              lineHeight: "1.6",
            }}
          >
            Your AI nervous system companion
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: typography.fontSizes.sm,
                fontWeight: typography.fontWeights.medium,
                color: theme.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Enter your name or email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., sarah@example.com"
              style={inputStyle}
              autoFocus
              disabled={loading}
            />
            <p
              style={{
                fontSize: typography.fontSizes.xs,
                color: theme.textMuted,
                marginTop: spacing.xs,
                marginBottom: 0,
              }}
            >
              This helps Nervi remember you and personalize your experience
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: spacing.sm,
                background: `${colors.error}20`,
                border: `1px solid ${colors.error}`,
                borderRadius: borderRadius.md,
                fontSize: typography.fontSizes.sm,
                color: colors.error,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={buttonStyle}
            disabled={loading || !email.trim()}
          >
            {loading ? "Starting..." : "Get Started"}
          </button>
        </form>

        {/* Info */}
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            background: theme.surfaceHover,
            borderRadius: borderRadius.md,
            border: `1px solid ${theme.border}`,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              margin: 0,
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              style={{
                color: theme.accent,
                textDecoration: "none",
                fontWeight: typography.fontWeights.medium,
              }}
            >
              Terms
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
          </p>
        </div>
      </div>
    </main>
  );
}

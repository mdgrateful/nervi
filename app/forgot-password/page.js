"use client";

import { useState } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents,
} from "../design-system";
import { useTheme } from "../hooks/useTheme";

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  function goToLogin() {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "440px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const inputStyle = {
    width: "100%",
    padding: spacing.md,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.md,
    background: theme.background,
    color: theme.textPrimary,
    fontSize: typography.fontSizes.md,
    outline: "none",
  };

  const labelStyle = {
    fontSize: typography.fontSizes.sm,
    color: theme.textSecondary,
    display: "block",
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  };

  if (success) {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: spacing.md,
              }}
            >
              ✉️
            </div>
            <h1
              style={{
                fontSize: typography.fontSizes["2xl"],
                fontWeight: typography.fontWeights.bold,
                color: theme.textPrimary,
                marginBottom: spacing.xs,
              }}
            >
              Check Your Email
            </h1>
            <p
              style={{
                fontSize: typography.fontSizes.sm,
                color: theme.textMuted,
                marginBottom: spacing.lg,
              }}
            >
              If an account exists with that email, you will receive password
              reset instructions shortly.
            </p>
          </div>

          <button
            type="button"
            onClick={goToLogin}
            style={{
              ...components.button,
              ...components.buttonPrimary,
              padding: spacing.md,
              fontSize: typography.fontSizes.md,
            }}
          >
            Back to Login
          </button>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: "none",
                color: theme.textMuted,
                cursor: "pointer",
                fontSize: typography.fontSizes.sm,
              }}
            >
              {theme.background === "#FFFFFF" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: typography.fontSizes["2xl"],
              fontWeight: typography.fontWeights.bold,
              color: theme.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Forgot Password?
          </h1>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
            }}
          >
            Enter your email and we'll send you instructions to reset your
            password
          </p>
        </div>

        {/* Reset Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
        >
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                padding: spacing.sm,
                background: `${colors.error}15`,
                border: `1px solid ${colors.error}`,
                borderRadius: borderRadius.md,
                color: colors.error,
                fontSize: typography.fontSizes.sm,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...components.button,
              ...components.buttonPrimary,
              padding: spacing.md,
              fontSize: typography.fontSizes.md,
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to login */}
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={goToLogin}
            style={{
              background: "transparent",
              border: "none",
              color: theme.textSecondary,
              cursor: "pointer",
              fontSize: typography.fontSizes.sm,
              textDecoration: "underline",
            }}
          >
            Back to Login
          </button>
        </div>

        {/* Theme toggle */}
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: "transparent",
              border: "none",
              color: theme.textMuted,
              cursor: "pointer",
              fontSize: typography.fontSizes.sm,
            }}
          >
            {theme.background === "#FFFFFF" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>
      </div>
    </main>
  );
}

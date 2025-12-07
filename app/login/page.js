"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents,
} from "../design-system";
import { useTheme } from "../hooks/useTheme";

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Store userId in localStorage for legacy compatibility
      if (typeof window !== "undefined") {
        window.localStorage.setItem("nerviUserId", username);
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  function goToSignup() {
    if (typeof window !== "undefined") {
      window.location.href = "/signup";
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
            Welcome to Nervi
          </h1>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
            }}
          >
            Your nervous system companion
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...inputStyle, paddingRight: "40px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  color: theme.textMuted,
                  fontSize: "18px",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <div style={{ marginTop: spacing.xs, textAlign: "right" }}>
              <a
                href="/forgot-password"
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: theme.textSecondary,
                  textDecoration: "none",
                }}
              >
                Forgot Password?
              </a>
            </div>
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ position: "relative", textAlign: "center" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: "1px",
              background: theme.border,
            }}
          />
          <span
            style={{
              position: "relative",
              background: theme.surface,
              padding: `0 ${spacing.md}`,
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
            }}
          >
            or
          </span>
        </div>

        {/* Sign up link */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Don't have an account?
          </p>
          <button
            type="button"
            onClick={goToSignup}
            style={{
              ...components.button,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
              width: "100%",
            }}
          >
            Create Account
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

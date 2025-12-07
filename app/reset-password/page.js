"use client";

import { useState, useEffect } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents,
} from "../design-system";
import { useTheme } from "../hooks/useTheme";

export default function ResetPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setError("Invalid or missing reset token");
      }
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
              ✅
            </div>
            <h1
              style={{
                fontSize: typography.fontSizes["2xl"],
                fontWeight: typography.fontWeights.bold,
                color: theme.textPrimary,
                marginBottom: spacing.xs,
              }}
            >
              Password Reset Successful
            </h1>
            <p
              style={{
                fontSize: typography.fontSizes.sm,
                color: theme.textMuted,
                marginBottom: spacing.lg,
              }}
            >
              Your password has been reset. Redirecting to login...
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
            Go to Login
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
            Reset Your Password
          </h1>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
            }}
          >
            Enter your new password below
          </p>
        </div>

        {/* Reset Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
        >
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                style={{ ...inputStyle, paddingRight: "40px" }}
                required
                autoFocus
                minLength={8}
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
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ ...inputStyle, paddingRight: "40px" }}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
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
            disabled={loading || !token}
            style={{
              ...components.button,
              ...components.buttonPrimary,
              padding: spacing.md,
              fontSize: typography.fontSizes.md,
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
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

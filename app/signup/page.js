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

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

export default function SignupPage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [allowWorkNotifications, setAllowWorkNotifications] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
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
      // Handle profile picture
      let pictureUrl = "";
      if (profilePictureFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(profilePictureFile);
        });
        pictureUrl = dataUrl;
      }

      // Create account
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          state,
          workStartTime,
          workEndTime,
          allowWorkNotifications,
          profilePictureUrl: pictureUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Store userId in localStorage
      if (typeof window !== "undefined" && data.user?.userId) {
        window.localStorage.setItem("nerviUserId", data.user.userId);
      }

      // Auto-login after signup
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setProfilePictureFile(file);
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
    padding: `${spacing.xl} 0`,
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "640px",
    ...components.card,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const inputStyle = {
    width: "100%",
    padding: spacing.sm,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.md,
    background: theme.background,
    color: theme.textPrimary,
    fontSize: typography.fontSizes.sm,
    outline: "none",
  };

  const labelStyle = {
    fontSize: typography.fontSizes.xs,
    color: theme.textMuted,
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
            Create Your Account
          </h1>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textMuted,
            }}
          >
            Join Nervi and start your journey
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {/* Profile Picture */}
          <div>
            <label style={labelStyle}>Profile Picture (optional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
              {profilePictureFile && (
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: borderRadius.full,
                    overflow: "hidden",
                    border: `2px solid ${theme.border}`,
                  }}
                >
                  <img
                    src={URL.createObjectURL(profilePictureFile)}
                    alt="Profile preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ fontSize: typography.fontSizes.sm, color: theme.textPrimary }}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              style={inputStyle}
              required
              minLength={3}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              style={inputStyle}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
              required
              minLength={8}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              style={inputStyle}
              required
            />
          </div>

          {/* State */}
          <div>
            <label style={labelStyle}>State (optional)</label>
            <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
              <option value="">Select your state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Hours */}
          <div
            style={{
              padding: spacing.md,
              background: theme.surface,
              borderRadius: borderRadius.lg,
              border: `1px solid ${theme.border}`,
            }}
          >
            <h3
              style={{
                fontSize: typography.fontSizes.sm,
                fontWeight: typography.fontWeights.semibold,
                color: theme.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Work Schedule (optional)
            </h3>

            <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.md }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Start Time</label>
                <input
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>End Time</label>
                <input
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                cursor: "pointer",
                fontSize: typography.fontSizes.xs,
                color: theme.textSecondary,
              }}
            >
              <input
                type="checkbox"
                checked={allowWorkNotifications}
                onChange={(e) => setAllowWorkNotifications(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Allow notifications during work hours
            </label>
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Already have an account?
          </p>
          <button
            type="button"
            onClick={goToLogin}
            style={{
              ...components.button,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
              width: "100%",
            }}
          >
            Sign In
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

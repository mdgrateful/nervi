"use client";

import { useState, useEffect } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents,
} from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
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

export default function EditProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [allowWorkNotifications, setAllowWorkNotifications] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("nerviUserId");
      if (saved && saved.trim()) {
        setUserId(saved);
        loadProfile(saved);
      }
    }
  }, []);

  async function loadProfile(idToUse) {
    if (!idToUse || !idToUse.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/profile?userId=${encodeURIComponent(idToUse.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load profile");
      }

      if (data.profile) {
        setUsername(data.profile.username || "");
        setEmail(data.profile.email || "");
        setState(data.profile.state || "");
        setWorkStartTime(data.profile.work_start_time || "");
        setWorkEndTime(data.profile.work_end_time || "");
        setAllowWorkNotifications(data.profile.allow_work_notifications || false);
        setProfilePictureUrl(data.profile.profile_picture_url || "");
      }

      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Error loading profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userId.trim()) {
      alert("Set your user id on the Chat page first.");
      return;
    }

    setLoading(true);
    setStatus("Saving profile...");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          username: username.trim(),
          email: email.trim(),
          state: state,
          workStartTime: workStartTime,
          workEndTime: workEndTime,
          allowWorkNotifications: allowWorkNotifications,
          profilePictureUrl: profilePictureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setStatus("Profile saved successfully!");
      setTimeout(() => {
        // Redirect back to profile page
        if (typeof window !== "undefined") {
          window.location.href = "/profile";
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("Error saving profile.");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (typeof window !== "undefined") {
      window.location.href = "/profile";
    }
  }

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

  const sectionStyle = {
    marginBottom: spacing.md,
  };

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        <h1
          style={{
            fontSize: typography.fontSizes.xl,
            fontWeight: typography.fontWeights.semibold,
            textAlign: "center",
            color: theme.textPrimary,
          }}
        >
          Edit Profile
        </h1>

        <SharedNav currentPage="/profile" theme={theme} onToggleTheme={toggleTheme} />

        {/* Username */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={inputStyle}
            disabled
          />
          <div
            style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              marginTop: spacing.xs,
            }}
          >
            Username cannot be changed
          </div>
        </div>

        {/* Email */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            style={inputStyle}
          />
        </div>

        {/* State */}
        <div style={sectionStyle}>
          <label style={labelStyle}>State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={inputStyle}
          >
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
              fontSize: typography.fontSizes.md,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Work Schedule
          </h3>

          <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.md }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Work Start Time</label>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Work End Time</label>
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
              fontSize: typography.fontSizes.sm,
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
          <div
            style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              marginTop: spacing.xs,
              marginLeft: "24px",
            }}
          >
            We'll adjust your daily schedule and notification timing based on your work hours
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            ...components.button,
            ...components.buttonPrimary,
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {/* Cancel Button */}
        <button
          onClick={goBack}
          disabled={loading}
          style={{
            ...components.button,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
          }}
        >
          Cancel
        </button>

        {/* Status Message */}
        {status && (
          <div
            style={{
              fontSize: typography.fontSizes.sm,
              color: status.includes("Error") ? colors.error : colors.success,
              textAlign: "center",
            }}
          >
            {status}
          </div>
        )}
      </div>
      <BottomNav currentPage="/profile" theme={theme} />
    </main>
  );
}

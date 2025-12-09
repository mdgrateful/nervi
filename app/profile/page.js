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
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export default function ProfilePage() {
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
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [avatarColor, setAvatarColor] = useState("#6366F1"); // Default avatar background color
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);
  const [promoCodeUsed, setPromoCodeUsed] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromoCode, setApplyingPromoCode] = useState(false);
  const [promoCodeStatus, setPromoCodeStatus] = useState("");

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
        setSubscriptionStatus(data.profile.subscription_status || "free");
        setSubscriptionTier(data.profile.subscription_tier || "free");
        setSubscriptionEndDate(data.profile.subscription_current_period_end || null);
        setHasLifetimeAccess(data.profile.has_lifetime_access || false);
        setPromoCodeUsed(data.profile.promo_code_used || "");
      }

      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Error loading profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Auto-upload photo immediately when selected
    setProfilePictureFile(file);
    setUploading(true);
    setStatus("Uploading photo...");

    try {
      // Convert image to data URL
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          username,
          email,
          state,
          workStartTime,
          workEndTime,
          allowWorkNotifications,
          profilePictureUrl: dataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setProfilePictureUrl(dataUrl);
      setProfilePictureFile(null);
      setStatus("Photo updated successfully!");

      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("Error uploading photo.");
      setProfilePictureFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!confirm("Are you sure you want to remove your profile photo?")) {
      return;
    }

    setUploading(true);
    setStatus("Removing photo...");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          username,
          email,
          state,
          workStartTime,
          workEndTime,
          allowWorkNotifications,
          profilePictureUrl: "", // Remove photo by setting empty string
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove photo");
      }

      setProfilePictureUrl("");
      setProfilePictureFile(null);
      setStatus("Photo removed successfully!");

      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("Error removing photo.");
    } finally {
      setUploading(false);
    }
  }

  function goToHistory() {
    if (typeof window !== "undefined") {
      window.location.href = "/history";
    }
  }

  function goToEditProfile() {
    if (typeof window !== "undefined") {
      window.location.href = "/edit-profile";
    }
  }

  async function handleExportData() {
    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    setExporting(true);
    setStatus("Preparing your data export...");

    try {
      const res = await fetch("/api/export-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to export data"}`);
        setExporting(false);
        setStatus("");
        return;
      }

      // Get the blob from the response
      const blob = await res.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nervi-data-${userId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("Data exported successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      alert("An error occurred while exporting your data.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    // First confirmation
    const firstConfirm = confirm(
      "⚠️ WARNING: This will permanently delete your entire Nervi account.\n\n" +
      "This includes:\n" +
      "• Your profile and settings\n" +
      "• All conversations with Nervi\n" +
      "• All notes and patterns\n" +
      "• Your life story map\n" +
      "• Everything associated with your account\n\n" +
      "This action CANNOT be undone.\n\n" +
      "Are you absolutely sure you want to continue?"
    );

    if (!firstConfirm) return;

    // Second confirmation
    const secondConfirm = confirm(
      "⚠️ FINAL WARNING ⚠️\n\n" +
      "This is your last chance to cancel.\n\n" +
      "Type your username to confirm deletion:\n" +
      "Expected: " + username
    );

    if (!secondConfirm) return;

    // Ask for username confirmation
    const usernameConfirm = prompt(
      "To confirm deletion, please type your username exactly:\n\n" +
      username
    );

    if (usernameConfirm !== username) {
      alert("Username did not match. Account deletion cancelled.");
      return;
    }

    setDeleting(true);
    setStatus("Deleting account...");

    try {
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          username: username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Clear local storage
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }

      alert("Your account has been permanently deleted. You will now be redirected to the login page.");

      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error(err);
      setStatus("Error deleting account: " + err.message);
      setDeleting(false);
    }
  }

  async function handleSubscribe(tier) {
    if (!userId.trim()) {
      alert("Please log in first");
      return;
    }

    setCheckingOut(true);
    setStatus("Redirecting to checkout...");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          tier: tier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
      setCheckingOut(false);
    }
  }

  async function handleManageSubscription() {
    if (!userId.trim()) {
      alert("Please log in first");
      return;
    }

    setStatus("Opening customer portal...");

    try {
      const res = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open customer portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  }

  async function handleApplyPromoCode() {
    if (!userId.trim()) {
      alert("Please log in first");
      return;
    }

    if (!promoCode.trim()) {
      setPromoCodeStatus("Please enter a promo code");
      return;
    }

    setApplyingPromoCode(true);
    setPromoCodeStatus("Applying promo code...");

    try {
      const res = await fetch("/api/apply-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          promoCode: promoCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply promo code");
      }

      // Success - reload profile to show updated access
      setPromoCodeStatus(data.message || "Promo code applied successfully!");
      setPromoCode("");

      // Reload profile after 1 second
      setTimeout(() => {
        loadProfile(userId);
        setPromoCodeStatus("");
      }, 1000);
    } catch (err) {
      console.error(err);
      setPromoCodeStatus("Error: " + err.message);
      setTimeout(() => setPromoCodeStatus(""), 5000);
    } finally {
      setApplyingPromoCode(false);
    }
  }

  const getStateName = (code) => {
    const state = US_STATES.find(s => s.code === code);
    return state ? state.name : code;
  };

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
  };

  const sectionStyle = {
    marginBottom: spacing.md,
  };

  const infoRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottom: `1px solid ${theme.border}`,
  };

  const labelTextStyle = {
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
    fontWeight: typography.fontWeights.medium,
  };

  const valueTextStyle = {
    fontSize: typography.fontSizes.sm,
    color: theme.textPrimary,
  };

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={cardStyle}>
        <SharedNav currentPage="/profile" theme={theme} onToggleTheme={toggleTheme} />

        {/* Profile Picture */}
        <div style={{ textAlign: "center", marginBottom: spacing.lg }}>
          {(profilePictureUrl || profilePictureFile) ? (
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: borderRadius.full,
                overflow: "hidden",
                border: `3px solid ${theme.border}`,
                margin: "0 auto",
                marginBottom: spacing.md,
              }}
            >
              <img
                src={
                  profilePictureFile
                    ? URL.createObjectURL(profilePictureFile)
                    : profilePictureUrl
                }
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: borderRadius.full,
                border: `3px solid ${theme.border}`,
                margin: "0 auto",
                marginBottom: spacing.md,
                background: avatarColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: typography.fontSizes["3xl"],
                color: "#FFFFFF",
                fontWeight: typography.fontWeights.bold,
              }}
            >
              {username ? username.charAt(0).toUpperCase() : "?"}
            </div>
          )}

          {/* Photo upload and remove buttons */}
          <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", marginBottom: spacing.sm }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="photo-upload"
              style={{ display: "none" }}
              disabled={uploading}
            />
            <label
              htmlFor="photo-upload"
              style={{
                ...components.button,
                background: uploading ? theme.surfaceHover : theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                display: "inline-block",
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.6 : 1,
                fontSize: typography.fontSizes.sm,
              }}
            >
              {uploading ? "Uploading..." : profilePictureUrl ? "Change Photo" : "Upload Photo"}
            </label>

            {profilePictureUrl && (
              <button
                onClick={handleRemovePhoto}
                disabled={uploading}
                style={{
                  ...components.button,
                  background: theme.surface,
                  border: `1px solid ${colors.danger}`,
                  color: colors.danger,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.6 : 1,
                  fontSize: typography.fontSizes.sm,
                }}
              >
                Remove Photo
              </button>
            )}
          </div>

          {/* Color picker for default avatar */}
          {!profilePictureUrl && (
            <div style={{ marginTop: spacing.md }}>
              <label style={{ fontSize: typography.fontSizes.xs, color: theme.textMuted, display: "block", marginBottom: spacing.xs }}>
                Avatar Background Color
              </label>
              <div style={{ display: "flex", gap: spacing.xs, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { name: "Indigo", color: "#6366F1" },
                  { name: "Purple", color: "#9333EA" },
                  { name: "Pink", color: "#EC4899" },
                  { name: "Red", color: "#EF4444" },
                  { name: "Orange", color: "#F97316" },
                  { name: "Amber", color: "#F59E0B" },
                  { name: "Green", color: "#10B981" },
                  { name: "Teal", color: "#14B8A6" },
                  { name: "Blue", color: "#3B82F6" },
                  { name: "Slate", color: "#64748B" },
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => setAvatarColor(colorOption.color)}
                    title={colorOption.name}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: borderRadius.full,
                      background: colorOption.color,
                      border: avatarColor === colorOption.color ? `3px solid ${theme.textPrimary}` : `2px solid ${theme.border}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: typography.fontSizes.xs,
              color: theme.textMuted,
              marginTop: spacing.xs,
            }}
          >
            Photo auto-saves when selected • Max size: 5MB
          </div>
        </div>

        {/* Profile Information */}
        <div
          style={{
            background: theme.surface,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.border}`,
            overflow: "hidden",
            marginBottom: spacing.lg,
          }}
        >
          <div style={infoRowStyle}>
            <span style={labelTextStyle}>Username</span>
            <span style={valueTextStyle}>{username || "Not set"}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={labelTextStyle}>Email</span>
            <span style={valueTextStyle}>{email || "Not set"}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={labelTextStyle}>State</span>
            <span style={valueTextStyle}>{state ? getStateName(state) : "Not set"}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={labelTextStyle}>Work Hours</span>
            <span style={valueTextStyle}>
              {workStartTime && workEndTime
                ? `${workStartTime} - ${workEndTime}`
                : "Not set"}
            </span>
          </div>

          <div style={{ ...infoRowStyle, borderBottom: "none" }}>
            <span style={labelTextStyle}>Work Notifications</span>
            <span style={valueTextStyle}>
              {allowWorkNotifications ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={goToEditProfile}
          style={{
            ...components.button,
            ...components.buttonPrimary,
            width: "100%",
          }}
        >
          Edit Profile
        </button>

        {/* Subscription Section */}
        <div
          style={{
            marginTop: spacing.lg,
            padding: spacing.lg,
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
              marginBottom: spacing.sm,
            }}
          >
            Subscription
          </h3>

          {/* Current subscription status */}
          <div
            style={{
              padding: spacing.md,
              background: theme.background,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: spacing.xs }}>
              <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
                Current Plan
              </span>
              <span
                style={{
                  fontSize: typography.fontSizes.sm,
                  fontWeight: typography.fontWeights.semibold,
                  color: subscriptionTier === 'free' ? theme.textMuted : colors.success,
                  textTransform: "capitalize",
                }}
              >
                {subscriptionTier === 'free' ? 'Free Tier' : `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan`}
              </span>
            </div>
            {hasLifetimeAccess && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.xs }}>
                <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
                  Access Type
                </span>
                <span
                  style={{
                    fontSize: typography.fontSizes.sm,
                    fontWeight: typography.fontWeights.semibold,
                    color: colors.success,
                  }}
                >
                  Lifetime Access
                </span>
              </div>
            )}
            {promoCodeUsed && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.xs }}>
                <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
                  Promo Code
                </span>
                <span
                  style={{
                    fontSize: typography.fontSizes.sm,
                    color: theme.textPrimary,
                    fontFamily: "monospace",
                  }}
                >
                  {promoCodeUsed}
                </span>
              </div>
            )}
            {subscriptionStatus !== 'free' && subscriptionStatus !== 'canceled' && !hasLifetimeAccess && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
                  Status
                </span>
                <span
                  style={{
                    fontSize: typography.fontSizes.sm,
                    color: subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? colors.success : colors.warning,
                    textTransform: "capitalize",
                  }}
                >
                  {subscriptionStatus}
                </span>
              </div>
            )}
            {subscriptionEndDate && !hasLifetimeAccess && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.xs }}>
                <span style={{ fontSize: typography.fontSizes.sm, color: theme.textSecondary }}>
                  Renews
                </span>
                <span style={{ fontSize: typography.fontSizes.sm, color: theme.textPrimary }}>
                  {new Date(subscriptionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Show upgrade options if on free tier */}
          {(subscriptionTier === 'free' || subscriptionStatus === 'free') && (
            <>
              <p
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: theme.textSecondary,
                  marginBottom: spacing.md,
                }}
              >
                Upgrade to unlock premium features and support Nervi's development
              </p>

              {/* Pricing cards */}
              <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.md }}>
                {/* Basic Plan */}
                <div
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    background: theme.background,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div style={{ marginBottom: spacing.sm }}>
                    <h4
                      style={{
                        fontSize: typography.fontSizes.md,
                        fontWeight: typography.fontWeights.semibold,
                        color: theme.textPrimary,
                        marginBottom: spacing.xs,
                      }}
                    >
                      Basic
                    </h4>
                    <div style={{ fontSize: typography.fontSizes["2xl"], fontWeight: typography.fontWeights.bold, color: theme.textPrimary }}>
                      $9.99<span style={{ fontSize: typography.fontSizes.xs, color: theme.textMuted }}>/month</span>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: `${spacing.md} 0`, fontSize: typography.fontSizes.xs, color: theme.textSecondary }}>
                    <li style={{ marginBottom: spacing.xs }}>✓ Unlimited conversations</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Daily care plans</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Pattern tracking</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Life story mapping</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Email support</li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe('basic')}
                    disabled={checkingOut}
                    style={{
                      ...components.button,
                      ...components.buttonPrimary,
                      width: "100%",
                      cursor: checkingOut ? "not-allowed" : "pointer",
                      opacity: checkingOut ? 0.6 : 1,
                    }}
                  >
                    {checkingOut ? "Loading..." : "Choose Basic"}
                  </button>
                </div>

                {/* Premium Plan */}
                <div
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    background: theme.background,
                    borderRadius: borderRadius.md,
                    border: `2px solid ${theme.accent}`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      right: spacing.md,
                      background: theme.accent,
                      color: theme.textInverse,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.full,
                      fontSize: typography.fontSizes.xs,
                      fontWeight: typography.fontWeights.semibold,
                    }}
                  >
                    BEST VALUE
                  </div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <h4
                      style={{
                        fontSize: typography.fontSizes.md,
                        fontWeight: typography.fontWeights.semibold,
                        color: theme.textPrimary,
                        marginBottom: spacing.xs,
                      }}
                    >
                      Premium
                    </h4>
                    <div style={{ fontSize: typography.fontSizes["2xl"], fontWeight: typography.fontWeights.bold, color: theme.textPrimary }}>
                      $19.99<span style={{ fontSize: typography.fontSizes.xs, color: theme.textMuted }}>/month</span>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: `${spacing.md} 0`, fontSize: typography.fontSizes.xs, color: theme.textSecondary }}>
                    <li style={{ marginBottom: spacing.xs }}>✓ Everything in Basic</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Advanced analytics</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Priority AI responses</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Export all data</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Priority support</li>
                    <li style={{ marginBottom: spacing.xs }}>✓ Early access features</li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe('premium')}
                    disabled={checkingOut}
                    style={{
                      ...components.button,
                      ...components.buttonPrimary,
                      background: theme.accent,
                      width: "100%",
                      cursor: checkingOut ? "not-allowed" : "pointer",
                      opacity: checkingOut ? 0.6 : 1,
                    }}
                  >
                    {checkingOut ? "Loading..." : "Choose Premium"}
                  </button>
                </div>
              </div>

              {/* Promo Code Section */}
              <div
                style={{
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  borderTop: `1px solid ${theme.border}`,
                }}
              >
                <p
                  style={{
                    fontSize: typography.fontSizes.sm,
                    color: theme.textSecondary,
                    marginBottom: spacing.md,
                    textAlign: "center",
                  }}
                >
                  Or use a promo code for instant access
                </p>
                <div style={{ display: "flex", gap: spacing.sm }}>
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={applyingPromoCode}
                    style={{
                      flex: 1,
                      padding: spacing.sm,
                      border: `1px solid ${theme.border}`,
                      borderRadius: borderRadius.md,
                      background: theme.background,
                      color: theme.textPrimary,
                      fontSize: typography.fontSizes.sm,
                      outline: "none",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    disabled={applyingPromoCode || !promoCode.trim()}
                    style={{
                      ...components.button,
                      ...components.buttonPrimary,
                      cursor: (applyingPromoCode || !promoCode.trim()) ? "not-allowed" : "pointer",
                      opacity: (applyingPromoCode || !promoCode.trim()) ? 0.6 : 1,
                    }}
                  >
                    {applyingPromoCode ? "Applying..." : "Apply"}
                  </button>
                </div>
                {promoCodeStatus && (
                  <div
                    style={{
                      fontSize: typography.fontSizes.xs,
                      color: promoCodeStatus.includes("Error") ? colors.error : colors.success,
                      textAlign: "center",
                      marginTop: spacing.sm,
                    }}
                  >
                    {promoCodeStatus}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Show manage button if subscribed */}
          {subscriptionTier !== 'free' && subscriptionStatus !== 'free' && !hasLifetimeAccess && (
            <button
              onClick={handleManageSubscription}
              style={{
                ...components.button,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                width: "100%",
              }}
            >
              Manage Subscription
            </button>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div
            style={{
              fontSize: typography.fontSizes.sm,
              color: status.includes("Error") ? colors.error : colors.success,
              textAlign: "center",
              marginTop: spacing.md,
            }}
          >
            {status}
          </div>
        )}

        {/* History Button */}
        <div
          style={{
            marginTop: spacing.lg,
            padding: spacing.lg,
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
              marginBottom: spacing.sm,
            }}
          >
            Your Data
          </h3>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            View all your past conversations and interactions with Nervi
          </p>
          <button
            onClick={goToHistory}
            style={{
              ...components.button,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
              width: "100%",
            }}
          >
            View History
          </button>
        </div>

        {/* Data & Privacy Section */}
        <div
          style={{
            marginTop: spacing.xl,
            padding: spacing.lg,
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
              marginBottom: spacing.sm,
            }}
          >
            Data & Privacy
          </h3>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            Download a copy of all your data stored in Nervi. This includes your profile, conversations, notes, and more.
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            style={{
              ...components.button,
              ...components.buttonPrimary,
              width: "100%",
              cursor: exporting ? "not-allowed" : "pointer",
              opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? "Preparing Export..." : "Download My Data (JSON)"}
          </button>
        </div>

        {/* Danger Zone - Delete Account */}
        <div
          style={{
            marginTop: spacing.xl,
            padding: spacing.lg,
            background: theme.surface,
            borderRadius: borderRadius.lg,
            border: `2px solid ${colors.danger}`,
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSizes.md,
              fontWeight: typography.fontWeights.semibold,
              color: colors.danger,
              marginBottom: spacing.sm,
            }}
          >
            Danger Zone
          </h3>
          <p
            style={{
              fontSize: typography.fontSizes.sm,
              color: theme.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            Permanently delete your Nervi account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              ...components.button,
              background: colors.danger,
              color: "#fff",
              border: "none",
              width: "100%",
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "Deleting Account..." : "Delete Account Permanently"}
          </button>
        </div>
      </div>
      <BottomNav currentPage="/profile" theme={theme} />
    </main>
  );
}

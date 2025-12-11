"use client";

import { useState, useEffect } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents
} from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { NerviDailyReadCard } from "../components/NerviDailyReadCard";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

// ----- VAPID + helper -----

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Invalid VAPID key: key is empty or not a string');
  }

  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData =
      typeof window !== "undefined"
        ? window.atob(base64)
        : Buffer.from(base64, "base64").toString("binary");

    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (err) {
    throw new Error(`Invalid VAPID key format: ${err.message}`);
  }
}

// --- nervous-system–oriented quotes ---

const nervousSystemQuotes = [
  {
    text:
      "You don’t have to fix everything today. You just have to give your nervous system one small moment of safety.",
    author: "Unknown",
  },
  {
    text:
      "Your body isn’t the enemy. It’s the part of you that has been trying to keep you alive the longest.",
    author: "Somatic wisdom",
  },
  {
    text:
      "Regulation is not about feeling good. It’s about feeling safe enough to be present with what is.",
    author: "Nervi",
  },
  {
    text:
      "Every exhale is a chance to tell your body: we made it here, we are still alive, you can soften a little.",
    author: "Nervi",
  },
  {
    text:
      "Tiny, consistent nervous-system practices beat heroic, once-a-year attempts at self-care.",
    author: "Nervi",
  },
];

function getQuoteForToday() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff =
    today.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = dayOfYear % nervousSystemQuotes.length;
  return nervousSystemQuotes[idx];
}

// Photo URLs (can be calming / nature images)
const dailyPhotos = [
  "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg", // forest path
  "https://images.pexels.com/photos/210205/pexels-photo-210205.jpeg", // ocean
  "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg", // mountains
  "https://images.pexels.com/photos/321403/pexels-photo-321403.jpeg", // field
  "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg", // sky
  "https://images.pexels.com/photos/35600/road-sun-rays-path.jpg", // sun through trees
  "https://images.pexels.com/photos/1054289/pexels-photo-1054289.jpeg", // lake
];

function getPhotoForToday() {
  const today = new Date();
  const weekday = today.getDay(); // 0 = Sun ... 6 = Sat
  return dailyPhotos[weekday % dailyPhotos.length];
}

// Parse first time from a line, e.g. "7:00 PM – ..." => minutes since midnight
function getMinutesFromLine(line) {
  if (!line) return Number.POSITIVE_INFINITY;
  const match = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return Number.POSITIVE_INFINITY;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (!period) hours = Math.max(0, Math.min(23, hours));

  return hours * 60 + minutes;
}

// normalize day key/label to "sun"..."sat"
function normalizeDayShort(key, label) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const k = (key || "").toLowerCase();
  const l = (label || "").toLowerCase();
  for (const short of map) {
    if (k.startsWith(short) || l.startsWith(short)) return short;
  }
  return null;
}

export default function DashboardPage() {
  // --- Theme ---
  const { theme, toggleTheme } = useTheme();

  // --- Component styles ---
  const components = getComponents(theme);

  const containerStyle = {
    ...components.container,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "140px", // Account for fixed header
    paddingBottom: "140px", // Account for fixed bottom nav
  };

  const layoutStyle = {
    width: "100%",
    maxWidth: "1120px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
    gap: spacing.lg,
  };

  const mobileLayoutStyle = {
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const cardStyle = {
    ...components.card,
  };

  const todayCardStyle = {
    ...cardStyle,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  };

  const smallBadge = {
    fontSize: typography.fontSizes.xs,
    color: theme.textMuted,
  };

  const quoteCardStyle = {
    ...cardStyle,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  };

  const photoCardStyle = {
    ...cardStyle,
    padding: "0",
    overflow: "hidden",
  };

  const photoBoxStyle = (url) => ({
    width: "100%",
    height: "220px",
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  });

  const todayListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
    maxHeight: "260px",
    overflowY: "auto",
  };

  const todayItemStyle = {
    fontSize: typography.fontSizes.sm,
    borderRadius: borderRadius.md,
    border: `1px solid ${theme.border}`,
    padding: `${spacing.sm} ${spacing.sm}`,
    background: theme.surface,
  };

  const headerRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const refreshButtonStyle = {
    borderRadius: borderRadius.full,
    padding: `${spacing.xs} ${spacing.md}`,
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surface,
    color: colors.info,
    cursor: "pointer",
    fontSize: typography.fontSizes.xs,
  };

  // --- State ---
  const [userId, setUserId] = useState("");
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayStatus, setTodayStatus] = useState("");
  const [quote, setQuote] = useState(getQuoteForToday());
  const [photoUrl, setPhotoUrl] = useState(getPhotoForToday());
  const [loading, setLoading] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  // Manual task entry
  const [newTaskInput, setNewTaskInput] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  // Task management
  const [visibleTaskCount, setVisibleTaskCount] = useState(4);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [editingTaskTime, setEditingTaskTime] = useState("");
  const [editingTaskText, setEditingTaskText] = useState("");

  // Explanation modal
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("nerviUserId");
    if (saved && saved.trim()) {
      setUserId(saved);
      loadTodayTasks(saved);
    } else {
      setTodayStatus("No user selected yet. Set your id on the Chat page.");
    }

    // Check if notifications are already enabled
    checkExistingNotificationSubscription();
  }, []);

  async function checkExistingNotificationSubscription() {
    try {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;

      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Check if there's an existing push subscription
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log("[Push] Found existing subscription on load");
        setNotificationsEnabled(true);
      }
    } catch (err) {
      console.error("[Push] Error checking existing subscription:", err);
      // Silent fail - don't show error to user
    }
  }

  async function enableNotifications() {
    try {
      if (typeof window === "undefined") return;
      if (!userId || !userId.trim()) {
        alert("Set your Nervi user id on the Chat page first.");
        return;
      }

      // Validate VAPID key
      if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.trim() === "") {
        setNotificationError("Push notifications are not configured. Contact support.");
        console.error('[Push] VAPID_PUBLIC_KEY is not set');
        return;
      }

      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
                                 window.navigator.standalone === true;

      // iOS-specific requirements (iOS 16.4+)
      if (isIOS && !isInStandaloneMode) {
        setNotificationError(
          "On iPhone/iPad, add Nervi to your home screen first: tap Share → Add to Home Screen."
        );
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setNotificationError("Service workers are not supported in this browser.");
        return;
      }
      if (!("PushManager" in window)) {
        if (isIOS) {
          setNotificationError("Push notifications require iOS 16.4 or later.");
        } else {
          setNotificationError("Push notifications are not supported in this browser.");
        }
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationError("Notifications were not granted.");
        return;
      }

      console.log("[Push] Permission granted, registering service worker...");

      // Register (or reuse) the service worker
      const swRegistration = await navigator.serviceWorker.register("/notifications-sw.js");
      console.log("[Push] Service worker registered:", swRegistration);

      // Wait until the service worker is active and ready
      const registration = await navigator.serviceWorker.ready;
      console.log("[Push] Service worker ready");

      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        console.log("[Push] Existing subscription found");
        setNotificationsEnabled(true);
        setNotificationError("");
        return;
      }

      console.log("[Push] Subscribing to push notifications...");
      console.log("[Push] VAPID key:", VAPID_PUBLIC_KEY ? "Present" : "Missing");

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("[Push] Subscription created:", sub);

      console.log("[Push] Saving subscription to server...");
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subscription: sub,
        }),
      });

      const data = await res.json();
      console.log("[Push] Server response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to save subscription");
      }

      console.log("[Push] Successfully enabled notifications!");
      setNotificationsEnabled(true);
      setNotificationError("");
    } catch (err) {
      console.error("[Push] Error:", err);
      console.error("[Push] Error stack:", err.stack);

      let errorMsg = "Error enabling notifications.";
      if (err.message) {
        errorMsg = `Error: ${err.message}`;
      }
      if (err.name === "NotAllowedError") {
        errorMsg = "Notification permission was denied.";
      } else if (err.name === "NotSupportedError") {
        errorMsg = "Push notifications are not supported on this device.";
      } else if (err.message && err.message.includes("subscription")) {
        errorMsg = `Failed to create push subscription: ${err.message}`;
      }

      setNotificationError(errorMsg);
    }
  }

  async function loadTodayTasks(idToUse) {
    if (!idToUse || !idToUse.trim()) return;

    setLoading(true);
    setTodayStatus("Loading your personalized plan…");
    setTodayTasks([]);

    try {
      const res = await fetch(
        `/api/daily-tasks?userId=${encodeURIComponent(idToUse.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load daily tasks");
      }

      const tasks = data.tasks || [];

      if (tasks.length === 0) {
        setTodayStatus("Let's chat first so I can learn what supports you best.");
      } else {
        setTodayStatus("");
      }

      setTodayTasks(tasks);
    } catch (err) {
      console.error(err);
      setTodayStatus("Couldn't load your plan. Let's try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  async function addManualTask() {
    if (!newTaskInput.trim() || !userId) return;

    try {
      const res = await fetch('/api/daily-tasks/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          taskInput: newTaskInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add task");
      }

      // Add the new task to the list
      setTodayTasks(prev => [...prev, data.task]);
      setNewTaskInput("");
      setShowAddTask(false);
    } catch (err) {
      console.error("Error adding custom task:", err);
      alert("Failed to add task. Please try again.");
    }
  }

  async function removeManualTask(task) {
    if (!userId || !task || !task.id) return;

    try {
      const res = await fetch(
        `/api/daily-tasks/custom?userId=${encodeURIComponent(userId)}&taskId=${encodeURIComponent(task.id)}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove task");
      }

      // Reload tasks to reflect the removal
      loadTodayTasks(userId);
    } catch (err) {
      console.error("Error removing custom task:", err);
      alert("Failed to remove task. Please try again.");
    }
  }

  function getRemovedTasksForToday() {
    if (typeof window === "undefined") return [];
    const today = new Date().toDateString();
    const saved = window.localStorage.getItem(`nerviRemovedTasks_${today}`);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  function saveRemovedTasks(tasks) {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    window.localStorage.setItem(`nerviRemovedTasks_${today}`, JSON.stringify(tasks));
  }

  function getEditedTasksForToday() {
    if (typeof window === "undefined") return {};
    const today = new Date().toDateString();
    const saved = window.localStorage.getItem(`nerviEditedTasks_${today}`);
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }

  function saveEditedTasks(tasks) {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    window.localStorage.setItem(`nerviEditedTasks_${today}`, JSON.stringify(tasks));
  }

  function removeScheduledTask(task) {
    const removed = getRemovedTasksForToday();
    removed.push(task);
    saveRemovedTasks(removed);

    // Reload tasks
    if (userId) {
      loadTodayTasks(userId);
    }
  }

  function startEditingTask(index, task) {
    setEditingTaskIndex(index);
    // Task is now an object with time and activity fields
    setEditingTaskTime(task.time || "");
    setEditingTaskText(task.activity || "");
  }

  async function saveTaskEdit(task) {
    if (!userId) return;

    try {
      const res = await fetch('/api/daily-tasks/custom', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          taskId: task.id,
          updates: {
            time: editingTaskTime,
            activity: editingTaskText,
          },
        }),
      });

      if (!res.ok) {
        console.error('Failed to update task');
        return;
      }

      setEditingTaskIndex(null);
      setEditingTaskTime("");
      setEditingTaskText("");

      // Reload tasks
      loadTodayTasks(userId);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  function cancelEdit() {
    setEditingTaskIndex(null);
    setEditingTaskTime("");
    setEditingTaskText("");
  }

  function handleManualRefresh() {
    if (!userId.trim()) {
      setTodayStatus("No user selected yet. Set your id on the Chat page.");
      return;
    }
    loadTodayTasks(userId);
  }

  return (
    <main style={containerStyle}>
      <NerviHeader theme={theme} />
      <div style={{ width: "100%", maxWidth: "1120px" }}>
        <SharedNav currentPage="/dashboard" theme={theme} onToggleTheme={toggleTheme} />

        <div style={layoutStyle} className="layout-grid">
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
            {/* Today's To-Do */}
            <div style={todayCardStyle}>
            <div style={headerRowStyle}>
              <div>
                <div style={{
                  fontSize: typography.fontSizes.md,
                  fontWeight: typography.fontWeights.semibold,
                  color: theme.textPrimary
                }}>
                  Your Plan for Today
                </div>
                <div style={smallBadge}>
                  Personalized based on what I know about you.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  style={refreshButtonStyle}
                  disabled={loading}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={enableNotifications}
                  style={{
                    ...refreshButtonStyle,
                    opacity: notificationsEnabled ? 0.6 : 1,
                  }}
                  disabled={notificationsEnabled}
                >
                  {notificationsEnabled
                    ? "Notifications enabled"
                    : "Enable reminders"}
                </button>
                {notificationError && (
                  <div
                    style={{
                      ...smallBadge,
                      color: "#f97316",
                      marginTop: "2px",
                      maxWidth: "180px",
                      textAlign: "right",
                    }}
                  >
                    {notificationError}
                  </div>
                )}
                <a
                  href="/debug"
                  style={{
                    fontSize: "10px",
                    color: theme.textMuted,
                    textDecoration: "none",
                    marginTop: "4px",
                  }}
                >
                  Debug notifications
                </a>
              </div>
            </div>

            {todayStatus && (
              <div style={{ ...smallBadge, marginTop: "4px" }}>
                {todayStatus}
              </div>
            )}

            {!todayStatus && todayTasks.length === 0 && (
              <div style={{ ...smallBadge, marginTop: "4px" }}>
                No practices scheduled for today yet.
              </div>
            )}

            <div style={todayListStyle}>
              {todayTasks.slice(0, visibleTaskCount).map((task, idx) => {
                // All tasks are now objects from the database
                const isManual = task.dataSource === 'user_added';
                const isEditing = editingTaskIndex === idx;

                const taskTime = task.time;
                const taskActivity = task.activity;
                const taskWhy = task.why;
                const taskDataSource = task.dataSource;

                if (isEditing) {
                  return (
                    <div key={idx} style={{
                      ...todayItemStyle,
                      display: "flex",
                      flexDirection: "column",
                      gap: spacing.xs,
                      padding: spacing.sm,
                    }}>
                      <div style={{ display: "flex", gap: spacing.xs }}>
                        <input
                          type="text"
                          value={editingTaskTime}
                          onChange={(e) => setEditingTaskTime(e.target.value)}
                          placeholder="Time (e.g., 7:00 AM)"
                          style={{
                            flex: "0 0 120px",
                            padding: spacing.xs,
                            border: `1px solid ${theme.border}`,
                            borderRadius: borderRadius.md,
                            background: theme.background,
                            color: theme.textPrimary,
                            fontSize: typography.fontSizes.sm,
                            outline: "none",
                          }}
                        />
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          placeholder="Task description"
                          style={{
                            flex: 1,
                            padding: spacing.xs,
                            border: `1px solid ${theme.border}`,
                            borderRadius: borderRadius.md,
                            background: theme.background,
                            color: theme.textPrimary,
                            fontSize: typography.fontSizes.sm,
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: spacing.xs, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => saveTaskEdit(task)}
                          style={{
                            ...components.button,
                            ...components.buttonPrimary,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            fontSize: typography.fontSizes.xs,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            ...components.button,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            fontSize: typography.fontSizes.xs,
                            background: theme.surface,
                            border: `1px solid ${theme.border}`,
                            color: theme.textSecondary,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} style={{
                    ...todayItemStyle,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: isManual ? theme.surfaceHover : theme.surface,
                  }}>
                    <div style={{ flex: 1, display: "flex", gap: spacing.sm, alignItems: "center" }}>
                      {taskTime && (
                        <span style={{
                          fontSize: typography.fontSizes.xs,
                          color: colors.info,
                          fontWeight: typography.fontWeights.medium,
                          minWidth: "70px",
                        }}>
                          {taskTime}
                        </span>
                      )}
                      <span style={{ flex: 1 }}>{taskActivity}</span>
                      {taskWhy && (
                        <button
                          onClick={() => {
                            setSelectedTask({ activity: taskActivity, why: taskWhy, dataSource: taskDataSource, time: taskTime });
                            setShowExplanation(true);
                          }}
                          style={{
                            background: "transparent",
                            border: `1px solid ${theme.border}`,
                            borderRadius: borderRadius.full,
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: typography.fontSizes.xs,
                            color: colors.info,
                            padding: "0",
                          }}
                          title="Why am I seeing this?"
                        >
                          ?
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: spacing.xs }}>
                      <button
                        onClick={() => startEditingTask(idx, task)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.textMuted,
                          cursor: "pointer",
                          padding: spacing.xs,
                          fontSize: typography.fontSizes.sm,
                        }}
                        title="Edit task"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => isManual ? removeManualTask(task) : removeScheduledTask(task)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.textMuted,
                          cursor: "pointer",
                          padding: spacing.xs,
                          fontSize: typography.fontSizes.sm,
                        }}
                        title="Remove task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load more button */}
              {visibleTaskCount < todayTasks.length && (
                <button
                  onClick={() => setVisibleTaskCount(prev => Math.min(prev + 4, todayTasks.length))}
                  style={{
                    ...todayItemStyle,
                    background: "transparent",
                    border: `1px dashed ${theme.border}`,
                    color: colors.info,
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: typography.fontWeights.medium,
                  }}
                >
                  + Load {Math.min(4, todayTasks.length - visibleTaskCount)} more exercises
                </button>
              )}

              {/* Add manual task button */}
              {!showAddTask ? (
                <button
                  onClick={() => setShowAddTask(true)}
                  style={{
                    ...todayItemStyle,
                    background: "transparent",
                    border: `1px dashed ${theme.border}`,
                    color: theme.textMuted,
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: typography.fontWeights.normal,
                  }}
                >
                  + Add custom task
                </button>
              ) : (
                <div style={{
                  ...todayItemStyle,
                  display: "flex",
                  gap: spacing.xs,
                  padding: spacing.sm,
                }}>
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addManualTask();
                      if (e.key === "Escape") {
                        setShowAddTask(false);
                        setNewTaskInput("");
                      }
                    }}
                    placeholder="e.g., 2:00 PM - Take a walk"
                    autoFocus
                    style={{
                      flex: 1,
                      padding: spacing.xs,
                      border: `1px solid ${theme.border}`,
                      borderRadius: borderRadius.md,
                      background: theme.background,
                      color: theme.textPrimary,
                      fontSize: typography.fontSizes.sm,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={addManualTask}
                    style={{
                      ...components.button,
                      ...components.buttonPrimary,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      fontSize: typography.fontSizes.xs,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskInput("");
                    }}
                    style={{
                      ...components.button,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      fontSize: typography.fontSizes.xs,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      color: theme.textSecondary,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            </div>

            {/* Nervi's Read on Today */}
            <NerviDailyReadCard theme={theme} userId={userId} />
          </div>

          {/* Right: quote + photo */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Inspiration */}
            <div style={quoteCardStyle}>
              <div style={{
                fontSize: typography.fontSizes.xs,
                color: theme.textMuted
              }}>
                Nervi Inspiration
              </div>
              <div
                style={{
                  fontSize: typography.fontSizes.md,
                  lineHeight: "1.5",
                  marginTop: spacing.xs,
                  color: theme.textPrimary,
                }}
              >
                "
                {quote?.text ||
                  "Every small regulation practice is a message of safety to your body."}
                "
              </div>
              <div
                style={{
                  fontSize: typography.fontSizes.xs,
                  color: theme.textSecondary,
                  textAlign: "right",
                  marginTop: spacing.xs,
                }}
              >
                — {quote?.author || "Nervi"}
              </div>
            </div>

            {/* Daily photo */}
            <div style={photoCardStyle}>
              <div style={photoBoxStyle(photoUrl)} />
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav currentPage="/dashboard" theme={theme} />

        <style jsx>{`
          @media (max-width: 768px) {
            .layout-grid {
              display: flex !important;
              flex-direction: column-reverse !important;
            }
          }
        `}</style>

        {/* Explanation Modal */}
        {showExplanation && selectedTask && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: spacing.lg,
            }}
            onClick={() => setShowExplanation(false)}
          >
            <div
              style={{
                ...components.card,
                maxWidth: "500px",
                width: "100%",
                padding: spacing.lg,
                display: "flex",
                flexDirection: "column",
                gap: spacing.md,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3
                  style={{
                    fontSize: typography.fontSizes.lg,
                    fontWeight: typography.fontWeights.semibold,
                    color: theme.textPrimary,
                  }}
                >
                  Why this practice?
                </h3>
                <button
                  onClick={() => setShowExplanation(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: theme.textMuted,
                    cursor: "pointer",
                    fontSize: typography.fontSizes.xl,
                    padding: "0",
                    lineHeight: "1",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: spacing.md,
                  background: theme.surface,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.sm }}>
                  {selectedTask.time && (
                    <span
                      style={{
                        fontSize: typography.fontSizes.xs,
                        color: colors.info,
                        fontWeight: typography.fontWeights.medium,
                      }}
                    >
                      {selectedTask.time}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: typography.fontSizes.sm,
                      fontWeight: typography.fontWeights.semibold,
                      color: theme.textPrimary,
                    }}
                  >
                    {selectedTask.activity}
                  </span>
                </div>
                {selectedTask.dataSource && (
                  <div
                    style={{
                      fontSize: typography.fontSizes.xs,
                      color: theme.textMuted,
                      marginBottom: spacing.xs,
                    }}
                  >
                    Based on: {selectedTask.dataSource}
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: typography.fontSizes.sm,
                  color: theme.textSecondary,
                  lineHeight: "1.6",
                }}
              >
                {selectedTask.why}
              </div>

              <button
                onClick={() => setShowExplanation(false)}
                style={{
                  ...components.button,
                  ...components.buttonPrimary,
                  marginTop: spacing.sm,
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

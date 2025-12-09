"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { spacing, borderRadius, typography, getComponents } from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

export default function ProgramPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();

  const [program, setProgram] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Safety check for SSR
  if (!theme) return null;

  const components = getComponents(theme);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load current program
  useEffect(() => {
    if (status === "authenticated") {
      fetchProgram();
    }
  }, [status]);

  async function fetchProgram() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/program/current");
      if (!response.ok) throw new Error("Failed to load program");

      const data = await response.json();
      setProgram(data.program);
      setDays(data.days || []);
    } catch (err) {
      console.error("Error fetching program:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateNewProgram() {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch("/api/program/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate program");
      }

      const data = await response.json();
      setProgram(data.program);
      setDays(data.days || []);
    } catch (err) {
      console.error("Error generating program:", err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function toggleTask(taskId) {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  function getTimeBlockEmoji(timeBlock) {
    switch (timeBlock) {
      case "morning":
        return "🌅";
      case "midday":
        return "☀️";
      case "evening":
        return "🌆";
      case "night":
        return "🌙";
      default:
        return "⏰";
    }
  }

  function getTaskTypeColor(taskType) {
    switch (taskType) {
      case "grounding":
        return "#10b981"; // green
      case "breathing":
        return "#3b82f6"; // blue
      case "journaling":
        return "#8b5cf6"; // purple
      case "movement":
        return "#f59e0b"; // amber
      case "rest":
        return "#ec4899"; // pink
      case "connection":
        return "#06b6d4"; // cyan
      default:
        return theme.accent;
    }
  }

  function isToday(dateString) {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ ...styles.container(theme), ...styles.centerContent }}>
        <NerviHeader theme={theme} />
        <SharedNav />
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner(theme)} />
          <p style={{ ...styles.text(theme), marginTop: spacing.md }}>
            Loading your program...
          </p>
        </div>
        <BottomNav currentPage="/program" theme={theme} />
      </div>
    );
  }

  // No program exists - show empty state
  if (!program && !loading) {
    return (
      <div style={styles.container(theme)}>
        <NerviHeader theme={theme} />
        <SharedNav />

        <div style={styles.content}>
          <div style={styles.emptyState(theme)}>
            <div style={styles.emptyIcon}>📋</div>
            <h2 style={styles.emptyTitle(theme)}>No Program Yet</h2>
            <p style={styles.emptyText(theme)}>
              We're ready to build your personalized 2-week nervous system program based on your conversations.
            </p>

            <button
              onClick={generateNewProgram}
              disabled={generating}
              style={{
                ...components.button,
                marginTop: spacing.lg,
                width: "100%",
                maxWidth: "300px",
              }}
            >
              {generating ? "Building your program..." : "Build My 2-Week Program"}
            </button>

            {generating && (
              <p style={{ ...styles.generatingText(theme), marginTop: spacing.md }}>
                This takes 20-30 seconds while we analyze your patterns...
              </p>
            )}
          </div>
        </div>

        <BottomNav currentPage="/program" theme={theme} />
      </div>
    );
  }

  // Program exists - show it
  return (
    <div style={styles.container(theme)}>
      <NerviHeader theme={theme} />
      <SharedNav />

      <div style={styles.content}>
        {/* Program Summary Card */}
        <div style={styles.summaryCard(theme)}>
          <h1 style={styles.summaryTitle(theme)}>Your Next 2 Weeks</h1>

          <p style={styles.summaryText(theme)}>{program.summary}</p>

          {program.focus_points && program.focus_points.length > 0 && (
            <div style={styles.focusPoints}>
              <h3 style={styles.focusTitle(theme)}>Focus Areas:</h3>
              <ul style={styles.focusList}>
                {program.focus_points.map((point, index) => (
                  <li key={index} style={styles.focusItem(theme)}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.metadata(theme)}>
            <span style={styles.metadataText(theme)}>
              Version {program.version} • Phase {program.phase} •{" "}
              {new Date(program.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* 14-Day View */}
        <div style={styles.daysContainer}>
          {days.map((day, dayIndex) => {
            const isCurrentDay = isToday(day.date);

            return (
              <div
                key={day.date}
                style={{
                  ...styles.dayCard(theme),
                  ...(isCurrentDay ? styles.todayCard(theme) : {}),
                }}
              >
                <div style={styles.dayHeader}>
                  <h3 style={styles.dayTitle(theme)}>
                    {isCurrentDay && <span style={styles.todayBadge(theme)}>TODAY</span>}
                    Day {dayIndex + 1}
                  </h3>
                  <span style={styles.dayDate(theme)}>
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div style={styles.tasksContainer}>
                  {day.tasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id);

                    return (
                      <div
                        key={task.id}
                        style={{
                          ...styles.taskCard(theme),
                          borderLeft: `4px solid ${getTaskTypeColor(task.task_type)}`,
                        }}
                        onClick={() => toggleTask(task.id)}
                      >
                        <div style={styles.taskHeader}>
                          <div style={styles.taskTime(theme)}>
                            <span style={styles.timeEmoji}>
                              {getTimeBlockEmoji(task.time_block)}
                            </span>
                            <span style={styles.timeText(theme)}>
                              {task.time_block || "Anytime"}
                            </span>
                          </div>
                          <span style={styles.taskType(theme, getTaskTypeColor(task.task_type))}>
                            {task.task_type}
                          </span>
                        </div>

                        <h4 style={styles.taskTitle(theme)}>{task.title}</h4>

                        <p style={styles.whyText(theme)}>{task.why_text}</p>

                        {task.instructions && isExpanded && (
                          <div style={styles.instructions(theme)}>
                            <div style={styles.instructionsDivider(theme)} />
                            <p style={styles.instructionsText(theme)}>{task.instructions}</p>
                          </div>
                        )}

                        {task.duration_minutes && (
                          <div style={styles.duration(theme)}>
                            ⏱️ {task.duration_minutes} min
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Update Program Button */}
        <div style={styles.updateSection}>
          <p style={styles.updateDescription(theme)}>
            Want to refresh your plan? We'll re-read your recent conversations and rebuild your program with new practices.
          </p>

          <button
            onClick={generateNewProgram}
            disabled={generating}
            style={{
              ...components.button,
              width: "100%",
              maxWidth: "400px",
              margin: `${spacing.md} auto`,
            }}
          >
            {generating ? "Rebuilding your program..." : "Update My 2-Week Plan"}
          </button>

          {generating && (
            <p style={{ ...styles.generatingText(theme), textAlign: "center" }}>
              Analyzing your recent patterns... (20-30 seconds)
            </p>
          )}
        </div>

        {error && (
          <div style={styles.errorBox(theme)}>
            <p style={styles.errorText(theme)}>Error: {error}</p>
          </div>
        )}
      </div>

      <BottomNav currentPage="/program" theme={theme} />
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: (theme) => ({
    minHeight: "100vh",
    backgroundColor: theme.background,
    color: theme.text,
    paddingBottom: "100px",
  }),

  centerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: spacing.lg,
  },

  loadingSpinner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },

  spinner: (theme) => ({
    width: "48px",
    height: "48px",
    border: `4px solid ${theme.border}`,
    borderTop: `4px solid ${theme.accent}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  }),

  text: (theme) => ({
    color: theme.text,
    fontSize: typography.fontSizes.base,
  }),

  // Empty State
  emptyState: (theme) => ({
    textAlign: "center",
    padding: spacing.xl,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    maxWidth: "500px",
    margin: "0 auto",
  }),

  emptyIcon: {
    fontSize: "64px",
    marginBottom: spacing.lg,
  },

  emptyTitle: (theme) => ({
    fontSize: typography.fontSizes["2xl"],
    fontWeight: typography.fontWeights.bold,
    color: theme.text,
    marginBottom: spacing.md,
  }),

  emptyText: (theme) => ({
    fontSize: typography.fontSizes.base,
    color: theme.textSecondary,
    lineHeight: "1.6",
    marginBottom: spacing.lg,
  }),

  generatingText: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
    fontStyle: "italic",
  }),

  // Summary Card
  summaryCard: (theme) => ({
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  }),

  summaryTitle: (theme) => ({
    fontSize: typography.fontSizes["2xl"],
    fontWeight: typography.fontWeights.bold,
    color: theme.accent,
    marginBottom: spacing.md,
  }),

  summaryText: (theme) => ({
    fontSize: typography.fontSizes.base,
    color: theme.text,
    lineHeight: "1.6",
    marginBottom: spacing.lg,
  }),

  focusPoints: {
    marginTop: spacing.lg,
  },

  focusTitle: (theme) => ({
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: theme.text,
    marginBottom: spacing.sm,
  }),

  focusList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  focusItem: (theme) => ({
    fontSize: typography.fontSizes.base,
    color: theme.textSecondary,
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
    position: "relative",
    ":before": {
      content: '"•"',
      position: "absolute",
      left: 0,
      color: theme.accent,
    },
  }),

  metadata: (theme) => ({
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTop: `1px solid ${theme.border}`,
  }),

  metadataText: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
    fontStyle: "italic",
  }),

  // Days
  daysContainer: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  },

  dayCard: (theme) => ({
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    border: `1px solid ${theme.border}`,
  }),

  todayCard: (theme) => ({
    border: `2px solid ${theme.accent}`,
    boxShadow: `0 0 16px ${theme.accent}40`,
  }),

  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  dayTitle: (theme) => ({
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: theme.text,
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  }),

  todayBadge: (theme) => ({
    fontSize: typography.fontSizes.xs,
    backgroundColor: theme.accent,
    color: "#ffffff",
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontWeight: typography.fontWeights.bold,
  }),

  dayDate: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
  }),

  tasksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },

  taskCard: (theme) => ({
    backgroundColor: theme.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: theme.surfaceHover,
    },
  }),

  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  taskTime: (theme) => ({
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  }),

  timeEmoji: {
    fontSize: typography.fontSizes.lg,
  },

  timeText: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textSecondary,
    textTransform: "capitalize",
  }),

  taskType: (theme, color) => ({
    fontSize: typography.fontSizes.xs,
    color: color,
    backgroundColor: `${color}20`,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontWeight: typography.fontWeights.medium,
    textTransform: "capitalize",
  }),

  taskTitle: (theme) => ({
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: theme.text,
    marginBottom: spacing.sm,
  }),

  whyText: (theme) => ({
    fontSize: typography.fontSizes.base,
    color: theme.textSecondary,
    lineHeight: "1.6",
    fontStyle: "italic",
  }),

  instructions: (theme) => ({
    marginTop: spacing.md,
  }),

  instructionsDivider: (theme) => ({
    height: "1px",
    backgroundColor: theme.border,
    marginBottom: spacing.sm,
  }),

  instructionsText: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
    lineHeight: "1.5",
  }),

  duration: (theme) => ({
    fontSize: typography.fontSizes.sm,
    color: theme.textMuted,
    marginTop: spacing.sm,
  }),

  // Update Section
  updateSection: {
    marginTop: spacing.xl,
    textAlign: "center",
  },

  updateDescription: (theme) => ({
    fontSize: typography.fontSizes.base,
    color: theme.textSecondary,
    marginBottom: spacing.md,
    lineHeight: "1.6",
  }),

  // Error
  errorBox: (theme) => ({
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  }),

  errorText: (theme) => ({
    color: "#991b1b",
    fontSize: typography.fontSizes.sm,
  }),
};

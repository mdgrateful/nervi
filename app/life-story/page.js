"use client";
import { useEffect, useState, useRef } from "react";
import {
  spacing,
  borderRadius,
  typography,
  colors,
  getComponents
} from "../design-system";
import { SharedNav } from "../components/SharedNav";
import { BottomNav } from "../components/BottomNav";
import { NerviHeader } from "../components/NerviHeader";
import { useTheme } from "../hooks/useTheme";

// Color mapping for nervous system states
const NS_COLORS = {
  hypervigilant: "#ef4444", // red
  hyper: "#f97316", // orange
  dysregulated: "#f59e0b", // amber
  shutdown: "#6b7280", // gray
  hypo: "#3b82f6", // blue
  numb: "#64748b", // slate
  regulated: "#10b981", // green
  safe: "#34d399", // emerald
};

export default function LifeStoryPage() {
  // --- Theme ---
  const { theme, toggleTheme } = useTheme();
  const components = getComponents(theme);

  // --- State ---
  const [userId, setUserId] = useState("");
  const [chapters, setChapters] = useState([]);
  const [events, setEvents] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // UI state
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [visibleThreadCount, setVisibleThreadCount] = useState(4); // Start with 4 threads
  const [editingEventId, setEditingEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // UI state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [suggestedPractices, setSuggestedPractices] = useState([]);
  const [showPractices, setShowPractices] = useState(false);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [practiceToSchedule, setPracticeToSchedule] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTime, setSelectedTime] = useState("09:00");

  // Form state for adding chapters
  const [newChapter, setNewChapter] = useState({
    name: "",
    ageRangeStart: "",
    ageRangeEnd: "",
    dominantState: "regulated",
  });

  // Form state for adding events
  const [newEvent, setNewEvent] = useState({
    chapterId: "",
    title: "",
    age: "",
    description: "",
    nervousSystemState: "regulated",
    emotionTags: "",
    keyBeliefs: "",
  });

  const timelineRef = useRef(null);

  // Load user and data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = window.localStorage.getItem("nerviUserId");
    if (storedUser && storedUser.trim()) {
      setUserId(storedUser);
      loadLifeStoryData(storedUser);
    } else {
      // No user found - redirect to chat page to register
      setLoading(false);
    }
  }, []);

  async function loadLifeStoryData(uid) {
    setLoading(true);
    try {
      const res = await fetch(`/api/life-story?userId=${encodeURIComponent(uid)}`);
      const data = await res.json();

      console.log(`[DEBUG] Loaded life story: ${data.chapters?.length || 0} chapters, ${data.events?.length || 0} events, ${data.threads?.length || 0} threads`);
      if (data.chapters && data.chapters.length > 0) {
        console.log('[DEBUG] First chapter structure:', Object.keys(data.chapters[0]));
        console.log('[DEBUG] First chapter:', data.chapters[0]);
      }
      if (data.events && data.events.length > 0) {
        console.log('[DEBUG] Events loaded:', data.events.map(e => ({ id: e.id, chapter_id: e.chapter_id, title: e.title })));
      }

      setChapters(data.chapters || []);
      setEvents(data.events || []);
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Error loading life story data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddChapter() {
    if (!newChapter.name || !newChapter.ageRangeStart || !newChapter.ageRangeEnd) {
      alert("Please fill in all chapter fields");
      return;
    }

    try {
      const res = await fetch("/api/life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "upsert-chapter",
          data: {
            name: newChapter.name,
            ageRangeStart: parseInt(newChapter.ageRangeStart),
            ageRangeEnd: parseInt(newChapter.ageRangeEnd),
            dominantState: newChapter.dominantState,
            orderIndex: chapters.length,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        loadLifeStoryData(userId);
        setNewChapter({ name: "", ageRangeStart: "", ageRangeEnd: "", dominantState: "regulated" });
        setShowAddChapter(false);
      }
    } catch (error) {
      console.error("Error adding chapter:", error);
    }
  }

  async function handleAddEvent() {
    if (!newEvent.chapterId || !newEvent.title || !newEvent.age) {
      alert("Please fill in chapter, title, and age");
      return;
    }

    try {
      const emotionTagsArray = newEvent.emotionTags
        ? newEvent.emotionTags.split(",").map((t) => t.trim())
        : [];
      const keyBeliefsArray = newEvent.keyBeliefs
        ? newEvent.keyBeliefs.split(",").map((b) => b.trim())
        : [];

      const res = await fetch("/api/life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "upsert-event",
          data: {
            chapterId: parseInt(newEvent.chapterId),
            title: newEvent.title,
            age: parseInt(newEvent.age),
            description: newEvent.description,
            nervousSystemState: newEvent.nervousSystemState,
            emotionTags: emotionTagsArray,
            keyBeliefs: keyBeliefsArray,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        loadLifeStoryData(userId);
        setNewEvent({
          chapterId: "",
          title: "",
          age: "",
          description: "",
          nervousSystemState: "regulated",
          emotionTags: "",
          keyBeliefs: "",
        });
        setShowAddEvent(false);
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  }

  async function handleAnalyzeHistory() {
    if (analyzing) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/life-story/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          existingChapters: chapters,
          existingEvents: events,
          existingThreads: threads,
        }),
      });

      const result = await res.json();

      console.log('[FRONTEND] Analysis result:', {
        chaptersCount: result.chapters?.length || 0,
        eventsCount: result.events?.length || 0,
        threadsCount: result.threads?.length || 0,
        events: result.events
      });

      let chaptersCreated = 0;
      let eventsCreated = 0;
      let threadsCreated = 0;

      // Save chapters to database
      if (result.chapters && result.chapters.length > 0) {
        const chapterMap = {}; // Map chapter names to IDs
        for (let i = 0; i < result.chapters.length; i++) {
          const chapter = result.chapters[i];
          const chapterRes = await fetch("/api/life-story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              action: "upsert-chapter",
              data: {
                name: chapter.name,
                ageRangeStart: chapter.ageRangeStart,
                ageRangeEnd: chapter.ageRangeEnd,
                dominantState: chapter.dominantState,
                orderIndex: i,
              },
            }),
          });
          const chapterData = await chapterRes.json();
          if (chapterData.success && chapterData.data) {
            chapterMap[chapter.name] = chapterData.data.id;
            chaptersCreated++;
          }
        }

        // Save events to database
        if (result.events && result.events.length > 0) {
          console.log('[FRONTEND] Attempting to save', result.events.length, 'events');
          console.log('[FRONTEND] ChapterMap:', chapterMap);
          console.log('[FRONTEND] Result chapters:', result.chapters);

          for (const event of result.events) {
            console.log('[FRONTEND] Processing event:', event);

            // Match event to chapter by AGE or NAME
            let chapterId = null;

            // First try exact chapter name match (case-insensitive)
            if (event.chapterName) {
              const matchedName = Object.keys(chapterMap).find(
                name => name.toLowerCase() === event.chapterName.toLowerCase()
              );
              if (matchedName) {
                chapterId = chapterMap[matchedName];
                console.log('[FRONTEND] ✅ Matched event by name:', event.title, '→', event.chapterName, 'ID:', chapterId);
              }
            }

            // If no name match, find chapter by age range
            if (!chapterId && event.age !== undefined && result.chapters) {
              console.log('[FRONTEND] Trying age match for event:', event.title, 'age:', event.age);
              const matchingChapter = result.chapters.find(ch =>
                event.age >= ch.ageRangeStart && event.age <= ch.ageRangeEnd
              );

              if (matchingChapter) {
                chapterId = chapterMap[matchingChapter.name];
                console.log('[FRONTEND] ✅ Matched event by age:', event.title, 'age', event.age, '→', matchingChapter.name, 'ID:', chapterId);
              } else {
                console.log('[FRONTEND] ⚠️ No age match found for:', event.title, 'age:', event.age);
              }
            }

            // Fallback: if still no match, assign to first chapter (better than not saving)
            if (!chapterId && Object.keys(chapterMap).length > 0) {
              const firstChapterName = Object.keys(chapterMap)[0];
              chapterId = chapterMap[firstChapterName];
              console.log('[FRONTEND] ⚠️ Using fallback chapter for:', event.title, '→', firstChapterName);
            }

            if (chapterId) {
              console.log('[FRONTEND] 💾 Saving event:', event.title, 'to chapter ID:', chapterId);
              await fetch("/api/life-story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  action: "upsert-event",
                  data: {
                    chapterId,
                    title: event.title,
                    age: event.age,
                    description: event.description,
                    nervousSystemState: event.nervousSystemState,
                    emotionTags: event.emotionTags || [],
                    keyBeliefs: event.keyBeliefs || [],
                  },
                }),
              });
              eventsCreated++;
            } else {
              console.warn('[FRONTEND] Could not match event to any chapter:', event.title, 'age:', event.age);
            }
          }
        }
      }

      // Save threads to database
      if (result.threads && result.threads.length > 0) {
        for (const thread of result.threads) {
          await fetch("/api/life-story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              action: "upsert-thread",
              data: {
                name: thread.name,
                description: thread.description,
                color: thread.color,
                eventIds: [], // Will be connected by AI in future iterations
              },
            }),
          });
          threadsCreated++;
        }
      }

      const totalItems = chaptersCreated + eventsCreated + threadsCreated;
      console.log(`[FRONTEND] Analysis complete: ${chaptersCreated} chapters, ${eventsCreated} events, ${threadsCreated} threads`);

      if (totalItems > 0) {
        loadLifeStoryData(userId);
      }
    } catch (error) {
      console.error("Error analyzing history:", error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleEventClick(event) {
    setSelectedEvent(event);
    setSelectedThread(null);
    setShowPractices(true);

    // Fetch practice suggestions
    try {
      const res = await fetch("/api/life-story/suggest-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "event",
          data: event,
        }),
      });

      const result = await res.json();
      setSuggestedPractices(result.practices || []);
    } catch (error) {
      console.error("Error fetching practices:", error);
    }
  }

  async function handleThreadClick(thread) {
    setSelectedThread(thread);
    setSelectedEvent(null);
    setShowPractices(true);

    // Fetch practice suggestions
    try {
      const connectedEvents = events.filter(e =>
        thread.event_ids && thread.event_ids.includes(e.id)
      );

      const res = await fetch("/api/life-story/suggest-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "thread",
          data: {
            name: thread.name,
            description: thread.description,
            eventCount: connectedEvents.length,
          },
        }),
      });

      const result = await res.json();
      setSuggestedPractices(result.practices || []);
    } catch (error) {
      console.error("Error fetching practices:", error);
    }
  }

  function handleAddPracticeToSchedule(practice) {
    setPracticeToSchedule(practice);
    setSelectedDays([]);
    setSelectedTime("09:00");
    setShowScheduleModal(true);
  }

  function toggleDay(day) {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  }

  async function confirmAddToSchedule() {
    if (selectedDays.length === 0) {
      alert("Please select at least one day");
      return;
    }

    // Get current schedule
    const scheduleRes = await fetch(`/api/master-schedule?userId=${encodeURIComponent(userId)}`);
    const scheduleData = await scheduleRes.json();
    let schedule = scheduleData.schedule;

    if (!schedule || !schedule.days) {
      alert("Please set up your Master Schedule first!");
      return;
    }

    // Convert 24h time to 12h format for display
    const [hours, minutes] = selectedTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayTime = `${displayHour}:${minutes} ${ampm}`;

    // Add practice to selected days
    for (const dayKey of selectedDays) {
      const dayObj = schedule.days.find(d => d.key.toLowerCase() === dayKey.toLowerCase());
      if (dayObj) {
        const practiceText = `${displayTime} – ${practiceToSchedule.title} (${practiceToSchedule.duration})`;
        if (!dayObj.blocks) dayObj.blocks = [];
        dayObj.blocks.push(practiceText);
      }
    }

    // Save schedule
    try {
      await fetch("/api/master-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, schedule }),
      });

      alert(`Added "${practiceToSchedule.title}" to ${selectedDays.join(', ')} at ${displayTime}!`);
      setShowScheduleModal(false);
      setPracticeToSchedule(null);
    } catch (error) {
      console.error("Error adding to schedule:", error);
      alert("Error adding to schedule");
    }
  }

  // Event editing handlers
  function startEditingEvent(event, e) {
    e.stopPropagation(); // Prevent event click handler
    setEditingEventId(event.id);
    setEditFormData({
      id: event.id,
      chapterId: event.chapter_id,
      title: event.title || '',
      age: event.age || '',
      description: event.description || '',
      nervousSystemState: event.nervous_system_state || '',
      emotionTags: event.emotion_tags || [],
      keyBeliefs: event.key_beliefs || [],
    });
  }

  function cancelEditingEvent(e) {
    e.stopPropagation();
    setEditingEventId(null);
    setEditFormData({});
  }

  async function saveEventEdit(e) {
    e.stopPropagation();
    try {
      // Find the correct chapter based on the event's age
      // age_range_end >= 999 means "present" (ongoing chapter)
      const matchingChapter = chapters.find(ch =>
        editFormData.age >= ch.age_range_start &&
        (ch.age_range_end >= 999 ? true : editFormData.age <= ch.age_range_end)
      );

      // Update the chapter_id to move the event to the correct chapter
      const updatedData = {
        ...editFormData,
        chapterId: matchingChapter ? matchingChapter.id : editFormData.chapterId,
      };

      const res = await fetch("/api/life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "upsert-event",
          data: updatedData,
        }),
      });

      if (res.ok) {
        await loadLifeStoryData(userId);
        setEditingEventId(null);
        setEditFormData({});

        if (matchingChapter && matchingChapter.id !== editFormData.chapterId) {
          alert(`Event moved to "${matchingChapter.name}" chapter`);
        }
      } else {
        alert("Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event");
    }
  }

  async function deleteEvent(eventId, e) {
    e.stopPropagation();
    if (!confirm("Delete this event?")) return;

    try {
      const res = await fetch("/api/life-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "delete-event",
          data: { id: eventId },
        }),
      });

      if (res.ok) {
        await loadLifeStoryData(userId);
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event");
    }
  }

  function getEventsForChapter(chapterId) {
    const filtered = events.filter(e => e.chapter_id === chapterId);
    if (chapterId && filtered.length === 0 && events.length > 0) {
      console.log(`[DEBUG] Chapter ${chapterId} has no events. All events:`, events.map(e => ({ id: e.id, chapter_id: e.chapter_id, title: e.title })));
    }
    return filtered;
  }

  function toggleChapter(chapterId) {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  }

  function revealMoreThreads() {
    setVisibleThreadCount(prev => Math.min(prev + 2, 15)); // Cap at 15
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.background }}>
        <SharedNav currentPage="/life-story" theme={theme} onToggleTheme={toggleTheme} />
        <div style={{ color: theme.textPrimary, textAlign: "center", padding: "3rem" }}>
          Loading your life story...
        </div>
      </div>
    );
  }

  // If no user is logged in, show registration prompt
  if (!userId) {
    return (
      <div style={{ minHeight: "100vh", background: theme.background }}>
        <SharedNav currentPage="/life-story" theme={theme} onToggleTheme={toggleTheme} />
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 100px)",
          padding: spacing.xl,
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: "500px",
            background: theme.surface,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            border: `1px solid ${theme.border}`,
          }}>
            <h2 style={{
              color: theme.textPrimary,
              fontSize: typography.fontSizes['2xl'],
              marginBottom: spacing.md
            }}>
              Welcome to Life Story Map
            </h2>
            <p style={{
              color: theme.textMuted,
              marginBottom: spacing.xl,
              lineHeight: "1.6"
            }}>
              To use the Life Story Map, you need to register first. Head to the Chat page to create your account, then come back here to start mapping your nervous system journey.
            </p>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                ...components.button,
                ...components.buttonPrimary,
                fontSize: typography.fontSizes.md,
              }}
            >
              Go to Chat Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NerviHeader theme={theme} />
      <div style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.textPrimary,
        padding: spacing.lg,
        paddingTop: "140px", // Account for fixed header
        paddingBottom: "100px", // Account for fixed bottom nav
      }}>
        <SharedNav currentPage="/life-story" theme={theme} onToggleTheme={toggleTheme} />

      {/* Header */}
      <div style={{
        padding: spacing.xl,
        textAlign: "center",
        background: theme.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
        border: `1px solid ${theme.border}`,
      }}>
        <h1 style={{
          fontSize: typography.fontSizes['3xl'],
          fontWeight: typography.fontWeights.bold,
          marginBottom: spacing.sm,
          color: theme.textPrimary,
        }}>
          Life Story Map
        </h1>
        <p style={{
          color: theme.textMuted,
          marginBottom: spacing.xl,
          fontSize: typography.fontSizes.md,
        }}>
          Map where your nervous system learned patterns + schedule practices to heal them
        </p>

        <div style={{
          display: "flex",
          gap: spacing.lg,
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setShowAddChapter(true)}
            style={{
              ...components.button,
              ...components.buttonPrimary,
              fontWeight: typography.fontWeights.semibold,
            }}
          >
            + Add Chapter
          </button>

          <button
            onClick={() => setShowAddEvent(true)}
            style={{
              ...components.button,
              background: colors.info,
              color: "#fff",
              fontWeight: typography.fontWeights.semibold,
            }}
          >
            + Add Event
          </button>

          <button
            onClick={handleAnalyzeHistory}
            disabled={analyzing}
            style={{
              ...components.button,
              background: analyzing ? theme.surfaceHover : colors.warning,
              color: theme.textInverse,
              fontWeight: typography.fontWeights.semibold,
              cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "Analyzing..." : "🤖 AI Analyze Chat History"}
          </button>

          <button
            onClick={async () => {
              if (!confirm("⚠️ This will delete ALL your life story data (chapters, events, threads). Are you sure?")) return;

              try {
                const res = await fetch("/api/life-story", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId, action: "delete-all-user-data" }),
                });

                if (res.ok) {
                  alert("✅ All life story data cleared!");
                  loadLifeStoryData(userId);
                } else {
                  throw new Error("Failed to clear data");
                }
              } catch (error) {
                console.error("Error clearing data:", error);
                alert("Error clearing data");
              }
            }}
            style={{
              ...components.button,
              background: colors.danger,
              color: theme.textInverse,
              fontWeight: typography.fontWeights.semibold,
            }}
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      {/* Add Chapter Form */}
      {showAddChapter && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1e293b",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
          }}>
            <h2 style={{ marginBottom: "1rem" }}>Add Life Chapter</h2>

            <input
              type="text"
              placeholder="Chapter name (e.g., 'Early Childhood')"
              value={newChapter.name}
              onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <input
                type="number"
                placeholder="Start age"
                value={newChapter.ageRangeStart}
                onChange={(e) => setNewChapter({ ...newChapter, ageRangeStart: e.target.value })}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />

              <input
                type="number"
                placeholder="End age"
                value={newChapter.ageRangeEnd}
                onChange={(e) => setNewChapter({ ...newChapter, ageRangeEnd: e.target.value })}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </div>

            <select
              value={newChapter.dominantState}
              onChange={(e) => setNewChapter({ ...newChapter, dominantState: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            >
              <option value="regulated">Regulated</option>
              <option value="hypervigilant">Hypervigilant</option>
              <option value="hyper">Hyper (Activated)</option>
              <option value="shutdown">Shutdown</option>
              <option value="hypo">Hypo (Low Energy)</option>
              <option value="numb">Numb/Dissociated</option>
            </select>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleAddChapter}
                style={{
                  flex: 1,
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Chapter
              </button>

              <button
                onClick={() => setShowAddChapter(false)}
                style={{
                  flex: 1,
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Form */}
      {showAddEvent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          overflowY: "auto",
        }}>
          <div style={{
            background: "#1e293b",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            marginTop: "2rem",
            marginBottom: "2rem",
          }}>
            <h2 style={{ marginBottom: "1rem" }}>Add Life Event</h2>

            <select
              value={newEvent.chapterId}
              onChange={(e) => setNewEvent({ ...newEvent, chapterId: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            >
              <option value="">Select chapter...</option>
              {chapters.map((ch, idx) => (
                <option key={ch.id || `ch-${idx}`} value={ch.id}>
                  {ch.name} (Ages {ch.age_range_start}-{ch.age_range_end >= 999 ? 'present' : ch.age_range_end})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Event title (e.g., 'Parents divorced')"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <input
              type="number"
              placeholder="Age when it happened"
              value={newEvent.age}
              onChange={(e) => setNewEvent({ ...newEvent, age: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
                resize: "vertical",
              }}
            />

            <select
              value={newEvent.nervousSystemState}
              onChange={(e) => setNewEvent({ ...newEvent, nervousSystemState: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            >
              <option value="regulated">Regulated</option>
              <option value="hypervigilant">Hypervigilant</option>
              <option value="hyper">Hyper (Activated)</option>
              <option value="shutdown">Shutdown</option>
              <option value="hypo">Hypo (Low Energy)</option>
              <option value="numb">Numb/Dissociated</option>
            </select>

            <input
              type="text"
              placeholder="Emotion tags (comma-separated: fear, shame, anger)"
              value={newEvent.emotionTags}
              onChange={(e) => setNewEvent({ ...newEvent, emotionTags: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <textarea
              placeholder="Key beliefs formed (comma-separated: I'm not safe, I must be perfect)"
              value={newEvent.keyBeliefs}
              onChange={(e) => setNewEvent({ ...newEvent, keyBeliefs: e.target.value })}
              rows={2}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleAddEvent}
                style={{
                  flex: 1,
                  background: "#06b6d4",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Event
              </button>

              <button
                onClick={() => setShowAddEvent(false)}
                style={{
                  flex: 1,
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Suggestions Modal */}
      {showPractices && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          overflowY: "auto",
        }}>
          <div style={{
            background: "#1e293b",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            marginTop: "2rem",
            marginBottom: "2rem",
          }}>
            <h2 style={{ marginBottom: "0.5rem" }}>
              {selectedEvent ? `Practices for: ${selectedEvent.title}` : `Practices for: ${selectedThread?.name}`}
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {selectedEvent
                ? `Age ${selectedEvent.age} • ${selectedEvent.nervous_system_state}`
                : selectedThread?.description}
            </p>

            {suggestedPractices.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>Loading practices...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {suggestedPractices.map((practice, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#0f172a",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>{practice.title}</h3>
                      <span style={{
                        background: "#8b5cf6",
                        color: "#fff",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                      }}>
                        {practice.duration}
                      </span>
                    </div>

                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                      {practice.description}
                    </p>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{
                        background: "#1e293b",
                        color: "#a78bfa",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        border: "1px solid #8b5cf6",
                      }}>
                        {practice.type}
                      </span>

                      <button
                        onClick={() => handleAddPracticeToSchedule(practice)}
                        style={{
                          marginLeft: "auto",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        + Add to Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowPractices(false);
                setSelectedEvent(null);
                setSelectedThread(null);
                setSuggestedPractices([]);
              }}
              style={{
                width: "100%",
                marginTop: "1.5rem",
                background: "#374151",
                color: "#fff",
                border: "none",
                padding: "0.75rem",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add to Schedule Modal */}
      {showScheduleModal && practiceToSchedule && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1e293b",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
          }}>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Add to Schedule</h2>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {practiceToSchedule.title} ({practiceToSchedule.duration})
            </p>

            {/* Day Selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "600", color: "#e2e8f0" }}>
                Select Days:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label
                    key={day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      background: selectedDays.includes(day) ? "#8b5cf6" : "#0f172a",
                      border: `2px solid ${selectedDays.includes(day) ? '#a78bfa' : '#334155'}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ textTransform: "capitalize", fontSize: "0.95rem" }}>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "600", color: "#e2e8f0" }}>
                Select Time:
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#0f172a",
                  border: "2px solid #334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={confirmAddToSchedule}
                style={{
                  flex: 1,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              >
                Add to Schedule
              </button>

              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setPracticeToSchedule(null);
                }}
                style={{
                  flex: 1,
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div style={{ padding: spacing.xl }}>
        {/* Threads Legend - Progressive Reveal */}
        {threads.length > 0 && (
          <div style={{
            marginBottom: spacing.xl,
            padding: spacing.lg,
            background: theme.surface,
            borderRadius: borderRadius.xl,
            border: `1px solid ${theme.border}`,
          }}>
            <h3 style={{
              marginBottom: spacing.xs,
              fontSize: typography.fontSizes.lg,
              fontWeight: typography.fontWeights.semibold,
              color: theme.textPrimary,
            }}>
              Patterns & Threads ({Math.min(visibleThreadCount, threads.length)} of {threads.length} visible)
            </h3>
            <p style={{
              color: theme.textMuted,
              fontSize: typography.fontSizes.xs,
              marginBottom: spacing.md
            }}>
              Core patterns discovered from your life story. Click to explore healing practices.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              {threads.slice(0, visibleThreadCount).map((thread, idx) => (
                <div
                  key={thread.id || `thread-${idx}`}
                  onClick={() => handleThreadClick(thread)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    background: theme.surfaceHover,
                    border: `2px solid ${thread.color}`,
                    borderRadius: borderRadius.full,
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <span style={{ color: thread.color, fontWeight: typography.fontWeights.semibold, marginRight: spacing.xs }}>
                    ●
                  </span>
                  <span style={{ color: theme.textPrimary }}>{thread.name}</span>
                </div>
              ))}
            </div>
            {visibleThreadCount < threads.length && (
              <button
                onClick={revealMoreThreads}
                style={{
                  ...components.button,
                  ...components.buttonPrimary,
                  fontSize: typography.fontSizes.sm,
                }}
              >
                Reveal 2 More Patterns ({threads.length - visibleThreadCount} remaining)
              </button>
            )}
          </div>
        )}

        {/* Chapters Timeline */}
        {chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: spacing.xl, color: theme.textMuted }}>
            <p style={{
              fontSize: typography.fontSizes.lg,
              marginBottom: spacing.md,
              color: theme.textPrimary,
            }}>
              No chapters yet. Start building your life story!
            </p>
            <button
              onClick={() => setShowAddChapter(true)}
              style={{
                ...components.button,
                ...components.buttonPrimary,
                padding: `${spacing.md} ${spacing.xl}`,
                fontSize: typography.fontSizes.md,
              }}
            >
              Add Your First Chapter
            </button>
          </div>
        ) : (
          <div
            ref={timelineRef}
            style={{
              display: "flex",
              gap: "2rem",
              overflowX: "auto",
              paddingBottom: "2rem",
            }}
          >
            {chapters.map((chapter, chapterIdx) => {
              const chapterEvents = getEventsForChapter(chapter.id);
              const stateColor = NS_COLORS[chapter.dominant_state] || "#64748b";
              const isExpanded = expandedChapters.has(chapter.id);

              return (
                <div
                  key={chapter.id || `chapter-${chapterIdx}`}
                  style={{
                    minWidth: isExpanded ? "400px" : "280px",
                    background: theme.surface,
                    borderRadius: borderRadius.xl,
                    padding: spacing.lg,
                    borderTop: `4px solid ${stateColor}`,
                    border: `1px solid ${theme.border}`,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  {/* Chapter Summary */}
                  <div style={{ marginBottom: isExpanded ? spacing.md : "0" }}>
                    <h3 style={{
                      fontSize: typography.fontSizes.xl,
                      fontWeight: typography.fontWeights.bold,
                      marginBottom: spacing.xs,
                      color: theme.textPrimary,
                    }}>
                      {chapter.name}
                    </h3>
                    <p style={{
                      color: theme.textMuted,
                      fontSize: typography.fontSizes.sm
                    }}>
                      Ages {chapter.age_range_start}-{chapter.age_range_end >= 999 ? 'present' : chapter.age_range_end}
                    </p>
                    <div style={{ marginTop: spacing.sm, display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
                      <div style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        background: stateColor + "22",
                        border: `1px solid ${stateColor}`,
                        borderRadius: borderRadius.lg,
                        fontSize: typography.fontSizes.xs,
                        color: stateColor,
                      }}>
                        {chapter.dominant_state}
                      </div>
                      <div style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        background: theme.surfaceHover,
                        borderRadius: borderRadius.lg,
                        fontSize: typography.fontSizes.xs,
                        color: theme.textSecondary,
                      }}>
                        {chapterEvents.length} {chapterEvents.length === 1 ? 'event' : 'events'}
                      </div>
                    </div>
                  </div>

                  {/* Events - Only Shown When Expanded */}
                  {isExpanded && (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: spacing.sm,
                      marginTop: spacing.md,
                      paddingTop: spacing.md,
                      borderTop: `1px solid ${theme.border}`
                    }} onClick={(e) => e.stopPropagation()}>
                      {chapterEvents.length === 0 ? (
                        <p style={{
                          color: theme.textMuted,
                          fontSize: typography.fontSizes.sm,
                          fontStyle: "italic"
                        }}>
                          No events yet. Chat with Nervi to add memories from this period.
                        </p>
                      ) : (
                        chapterEvents.map(event => {
                        const eventColor = NS_COLORS[event.nervous_system_state] || "#64748b";
                        const isEditing = editingEventId === event.id;

                        return (
                          <div
                            key={event.id}
                            style={{
                              background: "#0f172a",
                              padding: "1rem",
                              borderRadius: "8px",
                              borderLeft: `4px solid ${eventColor}`,
                            }}
                          >
                            {isEditing ? (
                              // EDIT MODE
                              <div onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editFormData.title}
                                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                                  placeholder="Event title"
                                  style={{
                                    width: "100%",
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "4px",
                                    padding: "0.5rem",
                                    color: "#fff",
                                    marginBottom: "0.5rem",
                                    fontSize: "1rem",
                                  }}
                                />
                                <input
                                  type="number"
                                  value={editFormData.age || ''}
                                  onChange={(e) => setEditFormData({...editFormData, age: e.target.value ? parseInt(e.target.value) : ''})}
                                  placeholder="Age"
                                  style={{
                                    width: "80px",
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "4px",
                                    padding: "0.5rem",
                                    color: "#fff",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                  }}
                                />
                                <textarea
                                  value={editFormData.description}
                                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                  placeholder="Description"
                                  rows={3}
                                  style={{
                                    width: "100%",
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "4px",
                                    padding: "0.5rem",
                                    color: "#fff",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                    resize: "vertical",
                                  }}
                                />
                                <select
                                  value={editFormData.nervousSystemState}
                                  onChange={(e) => setEditFormData({...editFormData, nervousSystemState: e.target.value})}
                                  style={{
                                    width: "100%",
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "4px",
                                    padding: "0.5rem",
                                    color: "#fff",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <option value="">Select state...</option>
                                  <option value="hypervigilant">Hypervigilant</option>
                                  <option value="hyper">Hyper</option>
                                  <option value="shutdown">Shutdown</option>
                                  <option value="hypo">Hypo</option>
                                  <option value="freeze">Freeze</option>
                                  <option value="numb">Numb</option>
                                  <option value="regulated">Regulated</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                                  <button
                                    onClick={saveEventEdit}
                                    style={{
                                      flex: 1,
                                      background: "#10b981",
                                      color: "#fff",
                                      border: "none",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingEvent}
                                    style={{
                                      flex: 1,
                                      background: "#64748b",
                                      color: "#fff",
                                      border: "none",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // VIEW MODE
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                  <span style={{ fontWeight: "600", fontSize: "1rem", flex: 1 }}>
                                    {event.title}
                                  </span>
                                  <div style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem" }}>
                                    <button
                                      onClick={(e) => startEditingEvent(event, e)}
                                      style={{
                                        background: "#3b82f6",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => deleteEvent(event.id, e)}
                                      style={{
                                        background: "#ef4444",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                  Age {event.age}
                                </span>

                                {event.description && (
                                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                                    {event.description}
                                  </p>
                                )}

                                {event.emotion_tags && event.emotion_tags.length > 0 && (
                                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                    {event.emotion_tags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          background: "#1e293b",
                                          color: "#94a3b8",
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {event.key_beliefs && event.key_beliefs.length > 0 && (
                                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#fbbf24" }}>
                                    💭 {event.key_beliefs[0]}
                                    {event.key_beliefs.length > 1 && ` +${event.key_beliefs.length - 1} more`}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav currentPage="/life-story" theme={theme} />
    </div>
    </>
  );
}

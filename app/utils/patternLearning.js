/**
 * Pattern Learning Utilities
 * Automatically detect triggers and buffers from user notes
 */

// Common trigger keywords and phrases
const TRIGGER_PATTERNS = {
  "last-minute-changes": ["plans changed", "last minute", "cancelled", "rescheduled"],
  "criticism": ["criticized", "judged", "criticized", "told me", "said I"],
  "being-ignored": ["ignored", "didn't respond", "no reply", "ghosted"],
  "conflict": ["argument", "fight", "disagreement", "tension"],
  "overwhelm": ["too much", "overwhelmed", "can't handle", "drowning"],
  "rejection": ["rejected", "turned down", "said no", "declined"],
  "money-stress": ["money", "bills", "debt", "financial", "afford"],
  "family-tension": ["family", "mom", "dad", "sibling", "relative"],
  "work-pressure": ["deadline", "boss", "work", "meeting", "project"],
  "social-anxiety": ["social", "people", "crowd", "party", "event"],
};

// Common buffer/coping strategy keywords
const BUFFER_PATTERNS = {
  "walking": ["walk", "walked", "walking", "stroll"],
  "breathing-exercises": ["breath", "breathing", "deep breath", "exhale"],
  "music": ["music", "listened", "song", "playlist"],
  "talking-to-friend": ["talked to", "called", "texted", "friend"],
  "journaling": ["wrote", "journal", "writing"],
  "rest": ["nap", "rest", "lay down", "sleep"],
  "nature": ["outside", "nature", "park", "trees", "sky"],
  "movement": ["stretch", "yoga", "exercise", "moved"],
  "water": ["shower", "bath", "water", "swim"],
  "alone-time": ["alone", "solitude", "quiet", "space"],
};

/**
 * Analyze a note and detect potential triggers
 * @param {Object} note - The note object with activity, feeling, body_location
 * @returns {Array} - Array of detected trigger names
 */
export function detectTriggers(note) {
  const triggers = [];
  const text = [note.activity, note.feeling, note.body_location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [triggerName, keywords] of Object.entries(TRIGGER_PATTERNS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      triggers.push(triggerName);
    }
  }

  return triggers;
}

/**
 * Analyze a note and detect potential buffers/coping strategies
 * @param {Object} note - The note object with activity, feeling, body_location
 * @returns {Array} - Array of detected buffer names
 */
export function detectBuffers(note) {
  const buffers = [];
  const text = [note.activity, note.feeling, note.body_location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [bufferName, keywords] of Object.entries(BUFFER_PATTERNS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      buffers.push(bufferName);
    }
  }

  return buffers;
}

/**
 * Analyze if a note indicates improvement/regulation
 * Used to determine if a buffer was effective
 * @param {Object} note - The note object
 * @returns {boolean} - True if note indicates positive state
 */
export function isRegulatedState(note) {
  const positiveWords = [
    "calm",
    "better",
    "good",
    "relaxed",
    "safe",
    "okay",
    "fine",
    "grounded",
    "present",
    "regulated",
  ];

  const feeling = note.feeling?.toLowerCase() || "";
  return positiveWords.some((word) => feeling.includes(word));
}

/**
 * Analyze a sequence of notes to find effective buffer patterns
 * Looks for: stress note -> buffer note -> calm note
 * @param {Array} notes - Array of notes sorted by created_at descending
 * @returns {Array} - Array of {buffer, effectiveness} objects
 */
export function analyzeBufferEffectiveness(notes) {
  const effectiveness = {};

  for (let i = 0; i < notes.length - 2; i++) {
    const beforeNote = notes[i + 1]; // Earlier note (stressed)
    const actionNote = notes[i]; // Current note (action taken)
    const afterNote = notes[i - 1]; // Later note (result)

    // Check if this is a stress -> action -> calm sequence
    const wasStressed = detectTriggers(beforeNote).length > 0;
    const tookAction = detectBuffers(actionNote).length > 0;
    const becameCalm = afterNote && isRegulatedState(afterNote);

    if (wasStressed && tookAction && becameCalm) {
      const buffers = detectBuffers(actionNote);
      buffers.forEach((buffer) => {
        if (!effectiveness[buffer]) {
          effectiveness[buffer] = { count: 0, successes: 0 };
        }
        effectiveness[buffer].count++;
        effectiveness[buffer].successes++;
      });
    } else if (tookAction) {
      // Track attempts even if not successful
      const buffers = detectBuffers(actionNote);
      buffers.forEach((buffer) => {
        if (!effectiveness[buffer]) {
          effectiveness[buffer] = { count: 0, successes: 0 };
        }
        effectiveness[buffer].count++;
      });
    }
  }

  return Object.entries(effectiveness).map(([buffer, stats]) => ({
    buffer,
    effectiveness: stats.count > 0 ? stats.successes / stats.count : 0,
    totalAttempts: stats.count,
  }));
}

/**
 * Analyze day-of-week patterns from notes
 * @param {Array} notes - Array of notes with created_at timestamps
 * @param {number} dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns {Object} - Pattern analysis for that day
 */
export function analyzeDayOfWeekPattern(notes, dayOfWeek) {
  // Filter notes for this day of week
  const dayNotes = notes.filter((note) => {
    const noteDate = new Date(note.created_at);
    return noteDate.getDay() === dayOfWeek;
  });

  if (dayNotes.length < 3) {
    return null; // Not enough data
  }

  // Analyze common triggers
  const triggerCounts = {};
  const bufferCounts = {};
  const feelingCounts = {};

  dayNotes.forEach((note) => {
    detectTriggers(note).forEach((trigger) => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });

    detectBuffers(note).forEach((buffer) => {
      bufferCounts[buffer] = (bufferCounts[buffer] || 0) + 1;
    });

    if (note.feeling) {
      feelingCounts[note.feeling.toLowerCase()] =
        (feelingCounts[note.feeling.toLowerCase()] || 0) + 1;
    }
  });

  // Get most common items
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger);

  const topBuffers = Object.entries(bufferCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([buffer]) => buffer);

  const topFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    commonTriggers: topTriggers,
    effectiveBuffers: topBuffers,
    commonTheme: topFeeling ? topFeeling[0] : null,
    sampleSize: dayNotes.length,
  };
}

/**
 * Auto-increment trigger/buffer confidence based on note analysis
 * @param {string} userId - User ID
 * @param {Object} note - Note to analyze
 * @returns {Promise<void>}
 */
export async function autoLearnFromNote(userId, note) {
  const triggers = detectTriggers(note);
  const buffers = detectBuffers(note);

  // Increment confidence for detected triggers
  for (const trigger of triggers) {
    try {
      await fetch("/api/triggers-buffers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "trigger",
          name: trigger,
          action: "increment",
        }),
      });
    } catch (err) {
      console.error("Error auto-learning trigger:", err);
    }
  }

  // Increment confidence for detected buffers
  for (const buffer of buffers) {
    try {
      await fetch("/api/triggers-buffers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "buffer",
          name: buffer,
          action: "increment",
        }),
      });
    } catch (err) {
      console.error("Error auto-learning buffer:", err);
    }
  }
}

"use client";

import { useState, useEffect } from "react";
import { lightTheme, darkTheme } from "../design-system";

// Get current time in Eastern Time and determine if dark mode should be active
function shouldUseDarkMode() {
  const now = new Date();

  // Convert to Eastern Time
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);

  const hours = etDate.getHours();
  const minutes = etDate.getMinutes();
  const month = etDate.getMonth(); // 0-11 (0 = January, 11 = December)

  // Convert time to minutes for easier comparison
  const currentTimeInMinutes = hours * 60 + minutes;

  // Light mode starts at 6:15 AM (375 minutes)
  const lightModeStart = 6 * 60 + 15; // 6:15 AM = 375 minutes

  // Dark mode start time depends on the month
  // November (10) to March (2): 5:30 PM (17:30)
  // April (3) to October (9): 7:00 PM (19:00)
  let darkModeStart;
  if (month >= 10 || month <= 2) {
    // November, December, January, February, March
    darkModeStart = 17 * 60 + 30; // 5:30 PM = 1050 minutes
  } else {
    // April through October
    darkModeStart = 19 * 60; // 7:00 PM = 1140 minutes
  }

  // Dark mode is active if time is after dark mode start OR before light mode start
  return currentTimeInMinutes >= darkModeStart || currentTimeInMinutes < lightModeStart;
}

export function useTheme() {
  const [theme, setTheme] = useState(lightTheme);
  const [manualOverride, setManualOverride] = useState(false);

  // Initialize theme based on time or saved preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOverride = window.localStorage.getItem("nerviThemeManualOverride");
      const savedTheme = window.localStorage.getItem("nerviTheme");

      if (savedOverride === "true" && savedTheme) {
        // User has manually set a preference
        setManualOverride(true);
        setTheme(savedTheme === "dark" ? darkTheme : lightTheme);
      } else {
        // Use automatic time-based theme
        setManualOverride(false);
        setTheme(shouldUseDarkMode() ? darkTheme : lightTheme);
      }
    }
  }, []);

  // Auto-update theme every minute if no manual override
  useEffect(() => {
    if (!manualOverride && typeof window !== "undefined") {
      const interval = setInterval(() => {
        setTheme(shouldUseDarkMode() ? darkTheme : lightTheme);
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [manualOverride]);

  // Toggle theme function - enables manual override
  function toggleTheme() {
    if (typeof window !== "undefined") {
      const newTheme = theme.background === lightTheme.background ? darkTheme : lightTheme;
      setTheme(newTheme);
      setManualOverride(true);
      window.localStorage.setItem("nerviTheme", newTheme.background === darkTheme.background ? "dark" : "light");
      window.localStorage.setItem("nerviThemeManualOverride", "true");
    }
  }

  // Reset to automatic mode
  function resetToAutoTheme() {
    if (typeof window !== "undefined") {
      setManualOverride(false);
      window.localStorage.removeItem("nerviThemeManualOverride");
      window.localStorage.removeItem("nerviTheme");
      setTheme(shouldUseDarkMode() ? darkTheme : lightTheme);
    }
  }

  return { theme, toggleTheme, resetToAutoTheme, isAutoMode: !manualOverride };
}

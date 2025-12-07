"use client";

import { useState, useEffect } from "react";
import { lightTheme, darkTheme } from "../design-system";

export function useTheme() {
  const [theme, setTheme] = useState(lightTheme);

  // Load saved theme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("nerviTheme");
      if (savedTheme === "dark") {
        setTheme(darkTheme);
      } else {
        setTheme(lightTheme);
      }
    }
  }, []);

  // Toggle theme function
  function toggleTheme() {
    if (typeof window !== "undefined") {
      const newTheme = theme.background === lightTheme.background ? darkTheme : lightTheme;
      setTheme(newTheme);
      window.localStorage.setItem("nerviTheme", newTheme.background === darkTheme.background ? "dark" : "light");
    }
  }

  return { theme, toggleTheme };
}

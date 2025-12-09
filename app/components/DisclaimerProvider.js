"use client";

import { useState, useEffect } from "react";
import { DisclaimerModal } from "./DisclaimerModal";
import { lightTheme, darkTheme } from "../design-system";

export function DisclaimerProvider({ children }) {
  const [theme, setTheme] = useState(lightTheme);

  // Load theme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("nervi_theme");
      if (savedTheme === "dark") {
        setTheme(darkTheme);
      }
    }
  }, []);

  return (
    <>
      {children}
      <DisclaimerModal theme={theme} />
    </>
  );
}

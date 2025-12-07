"use client";

import { useState } from "react";
import { spacing, borderRadius, typography, colors } from "../design-system";

export function BottomNav({ currentPage = "/", theme }) {
  const [activeRipple, setActiveRipple] = useState(null);

  function go(path) {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  }

  const navItems = [
    { path: "/", icon: "💬", label: "Chat" },
    { path: "/dashboard", icon: "🏠", label: "Home" },
    { path: "/notes", icon: "📝", label: "Notes" },
    { path: "/life-story", icon: "🌱", label: "Story" },
    { path: "/profile", icon: "👤", label: "You" },
  ];

  const handleTap = (path) => {
    setActiveRipple(path);
    setTimeout(() => {
      go(path);
    }, 200);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: spacing.lg,
          left: spacing.md,
          right: spacing.md,
          background: theme.surface,
          borderRadius: borderRadius.full,
          padding: `${spacing.sm} ${spacing.md}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)`,
          border: `1px solid ${theme.border}`,
          backdropFilter: "blur(20px)",
          zIndex: 900,
        }}
        className="bottom-nav"
      >
        {navItems.map((item) => {
          const isActive = currentPage === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item.path)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: `${spacing.xs} ${spacing.sm}`,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: borderRadius.lg,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isActive ? "translateY(-4px)" : "translateY(0)",
              }}
              className={`nav-item ${isActive ? "active" : ""} ${
                activeRipple === item.path ? "ripple" : ""
              }`}
            >
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: "1",
                  filter: isActive
                    ? "drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4))"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {item.icon}
              </div>
              <span
                style={{
                  fontSize: typography.fontSizes.xs,
                  color: isActive ? colors.info : theme.textMuted,
                  fontWeight: isActive
                    ? typography.fontWeights.semibold
                    : typography.fontWeights.normal,
                  transition: "all 0.3s ease",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: colors.info,
                    boxShadow: `0 0 12px ${colors.info}`,
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        .bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .bottom-nav {
            display: flex;
          }

          .nav-item:active {
            transform: scale(0.95) !important;
          }

          .nav-item.ripple {
            animation: ripple 0.3s ease;
          }

          .nav-item.active {
            background: ${theme.background};
          }
        }

        /* Hide bottom nav in landscape orientation for better mobile UX */
        @media (orientation: landscape) and (max-height: 600px) {
          .bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

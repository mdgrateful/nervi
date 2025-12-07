"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  lightTheme,
  darkTheme,
  spacing,
  borderRadius,
  typography,
  getNav
} from "../design-system";

export function SharedNav({ currentPage = "/", theme = lightTheme, onToggleTheme, userId: userIdProp, profilePictureUrl: profilePictureUrlProp }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [localUserId, setLocalUserId] = useState(null);
  const menuRef = useRef(null);

  // Get userId from localStorage if not provided as prop
  useEffect(() => {
    if (!userIdProp && typeof window !== "undefined") {
      const storedUserId = window.localStorage.getItem("nerviUserId");
      if (storedUserId) {
        setLocalUserId(storedUserId);
      }
    }
  }, [userIdProp]);

  const userId = userIdProp || localUserId;
  const profilePictureUrl = profilePictureUrlProp;

  // Fetch user profile if we have userId
  useEffect(() => {
    if (userId && !profilePictureUrl && status === "authenticated") {
      fetch(`/api/profile?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setUserProfile(data.profile);
          }
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [userId, profilePictureUrl, status]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isMobileMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        const mobileMenuButton = document.querySelector('.mobile-menu-button');
        if (mobileMenuButton && !mobileMenuButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  function go(path) {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  const nav = getNav(theme || lightTheme);

  const getButtonStyle = (path) => ({
    ...nav.button,
    ...(currentPage === path ? nav.buttonActive : {}),
  });

  const themeToggleStyle = {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.full,
    border: `1px solid ${theme.border}`,
    background: theme.accent,
    color: theme.textInverse,
    cursor: 'pointer',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    transition: 'all 0.2s ease',
    marginLeft: spacing.md,
  };

  const authButtonStyle = {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.textPrimary,
    cursor: 'pointer',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    transition: 'all 0.2s ease',
    marginLeft: spacing.sm,
  };

  const mobileMenuButtonStyle = {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            animation: 'fadeIn 0.3s ease',
          }}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          display: 'none',
          position: 'absolute',
          top: spacing.md,
          left: spacing.md,
          padding: spacing.md,
          background: theme.surface,
          border: `2px solid ${theme.border}`,
          borderRadius: borderRadius.lg,
          cursor: 'pointer',
          zIndex: 1001,
          fontSize: '32px',
          lineHeight: '1',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        className="mobile-menu-button"
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ☰
      </button>

      {/* Auth Links - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: spacing.md,
          right: spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          zIndex: 1000,
        }}
        className="auth-links"
      >
        {status === "loading" ? null : status === "authenticated" ? (
          <>
            {/* User Info Display */}
            <div
              onClick={() => go("/profile")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                background: theme.surface,
                borderRadius: borderRadius.full,
                border: `1px solid ${theme.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.surfaceHover;
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.surface;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Profile Photo */}
              {(profilePictureUrl || userProfile?.profile_picture_url) ? (
                <img
                  src={profilePictureUrl || userProfile.profile_picture_url}
                  alt="Profile"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${theme.border}`,
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: typography.fontSizes.sm,
                  fontWeight: typography.fontWeights.semibold,
                }}>
                  {session.user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              {/* User ID */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <span style={{
                  fontSize: typography.fontSizes.xs,
                  color: theme.textMuted,
                  lineHeight: '1',
                }}>
                  {userId || session.user.id || session.user.username}
                </span>
                <span style={{
                  fontSize: typography.fontSizes.xs,
                  color: theme.textSecondary,
                  lineHeight: '1',
                  fontWeight: typography.fontWeights.medium,
                }}>
                  {session.user.username}
                </span>
              </div>
            </div>

            <button type="button" onClick={handleLogout} style={authButtonStyle}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => go("/login")} style={authButtonStyle}>
              Login
            </button>
            <button
              type="button"
              onClick={() => go("/signup")}
              style={{
                ...authButtonStyle,
                background: theme.accent,
                color: theme.textInverse,
                border: 'none',
              }}
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav ref={menuRef} style={{
        ...nav.container,
        flexWrap: 'wrap',
      }} className={isMobileMenuOpen ? 'mobile-menu-open' : ''}>
        <button type="button" onClick={() => go("/")} style={getButtonStyle("/")}>
          Chat
        </button>
        <button type="button" onClick={() => go("/dashboard")} style={getButtonStyle("/dashboard")}>
          Dashboard
        </button>
        <button type="button" onClick={() => go("/notes")} style={getButtonStyle("/notes")}>
          Notes
        </button>
        <button type="button" onClick={() => go("/life-story")} style={getButtonStyle("/life-story")}>
          Life Story
        </button>
        <button type="button" onClick={() => go("/profile")} style={getButtonStyle("/profile")}>
          Profile
        </button>
        {onToggleTheme && (
          <button type="button" onClick={onToggleTheme} style={themeToggleStyle}>
            {theme.background === lightTheme.background ? '🌙' : '☀️'}
          </button>
        )}
      </nav>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .mobile-menu-button {
            display: flex !important;
          }

          nav {
            flex-direction: column !important;
            position: fixed;
            top: 0;
            left: ${isMobileMenuOpen ? '0' : '-100%'};
            width: 80%;
            max-width: 300px;
            height: 100vh;
            background: ${theme.surface};
            border-right: 1px solid ${theme.border};
            padding: ${spacing.xl} ${spacing.md};
            transition: left 0.3s ease;
            z-index: 999;
            overflow-y: auto;
          }

          nav.mobile-menu-open {
            left: 0;
          }

          nav button {
            width: 100%;
            justify-content: flex-start;
            margin: ${spacing.xs} 0;
          }

          .auth-links {
            flex-direction: column;
            align-items: flex-end;
          }
        }

        @media (max-width: 480px) {
          .auth-links span {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

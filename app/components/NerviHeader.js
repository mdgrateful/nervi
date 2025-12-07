"use client";

import { spacing, borderRadius, typography } from "../design-system";

export function NerviHeader({ theme }) {
  return (
    <>
      <div style={headerStyle(theme)} className="nervi-header">
        <div style={logoContainerStyle}>
          {/* Nervous system icon - stylized neuron */}
          <div style={logoIconStyle(theme)}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              {/* Central nucleus */}
              <circle cx="20" cy="20" r="6" fill="url(#gradient1)" />

              {/* Dendrites (branching inputs) */}
              <path
                d="M 14 20 Q 8 15, 4 12 M 14 20 Q 8 25, 4 28"
                stroke="url(#gradient2)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="4" cy="12" r="2" fill="url(#gradient2)" />
              <circle cx="4" cy="28" r="2" fill="url(#gradient2)" />

              {/* Axon (main output) */}
              <path
                d="M 26 20 Q 32 20, 36 20"
                stroke="url(#gradient3)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="36" cy="20" r="2.5" fill="url(#gradient3)" />

              {/* Synaptic connections */}
              <path
                d="M 20 14 Q 25 8, 30 6"
                stroke="url(#gradient2)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <circle cx="30" cy="6" r="1.5" fill="url(#gradient2)" opacity="0.6" />

              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style={brandingStyle}>
            <h1 style={logoTextStyle(theme)}>Nervi</h1>
            <p style={taglineStyle(theme)}>Your Nervous System Guide</p>
          </div>
        </div>

        {/* Subtle animated background wave */}
        <div className="wave-animation" style={waveStyle(theme)} />
      </div>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div style={{ height: "120px" }} />

      <style jsx>{`
        .nervi-header {
          position: relative;
          overflow: hidden;
        }

        .wave-animation {
          animation: wave 8s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(-50%) translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) translateY(-8px);
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .nervi-header {
            padding: ${spacing.md} ${spacing.md};
          }
        }
      `}</style>
    </>
  );
}

const headerStyle = (theme) => ({
  width: "100vw",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  padding: `${spacing.lg} ${spacing.xl}`,
  background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.background} 100%)`,
  borderBottom: `1px solid ${theme.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(10px)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
});

const logoContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  zIndex: 1,
};

const logoIconStyle = (theme) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "64px",
  height: "64px",
  background: `linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`,
  borderRadius: borderRadius.full,
  border: `2px solid ${theme.border}`,
  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.2)",
});

const brandingStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const logoTextStyle = (theme) => ({
  fontSize: "32px",
  fontWeight: typography.fontWeights.bold,
  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  margin: 0,
  letterSpacing: "-0.5px",
});

const taglineStyle = (theme) => ({
  fontSize: typography.fontSizes.xs,
  color: theme.textMuted,
  fontWeight: typography.fontWeights.medium,
  margin: 0,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
});

const waveStyle = (theme) => ({
  position: "absolute",
  bottom: 0,
  left: "50%",
  transform: "translateX(-50%)",
  width: "200%",
  height: "100%",
  background: `radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)`,
  pointerEvents: "none",
});

// Nervi App Design System
// Unique, calming, trauma-informed design with day/night modes

// Light theme - Warm, soft, inviting (daytime)
export const lightTheme = {
  // Backgrounds - warm, soft neutrals
  background: '#fdfcfb',           // Warm off-white
  surface: '#f7f5f3',              // Soft warm gray
  surfaceHover: '#eeebe8',         // Slightly darker on hover
  card: '#ffffff',                 // Pure white cards

  // Borders & dividers - subtle warm tones
  border: '#e8e3dd',
  divider: '#f0ebe5',

  // Text
  textPrimary: '#2d2925',          // Warm dark brown
  textSecondary: '#6b6560',        // Warm gray
  textMuted: '#9a918a',            // Light warm gray
  textInverse: '#ffffff',

  // Accents - soft, muted pastels
  accent: '#a78bfa',               // Soft lavender (calming)
  accentHover: '#8b69d9',

  // Nervous system states (muted for gentleness)
  hypervigilant: '#f87171',
  hyper: '#fb923c',
  shutdown: '#60a5fa',
  hypo: '#818cf8',
  freeze: '#a78bfa',
  numb: '#94a3b8',
  regulated: '#34d399',
  mixed: '#f472b6',
};

// Dark theme - Deep, cosmic, restorative (nighttime)
export const darkTheme = {
  // Backgrounds - deep cosmic blues/purples (less harsh than pure black)
  background: '#0a0e1a',           // Deep navy (softer than black)
  surface: '#131827',              // Dark blue-gray
  surfaceHover: '#1a2234',         // Lighter on hover
  card: '#171d2f',                 // Card surface

  // Borders & dividers
  border: '#242b3d',
  divider: '#1f2638',

  // Text
  textPrimary: '#e8e6f0',          // Soft white with purple tint
  textSecondary: '#a5a0b8',        // Muted purple-gray
  textMuted: '#6e6979',            // Darker muted
  textInverse: '#0a0e1a',

  // Accents - rich, glowing
  accent: '#9d7ff5',               // Vibrant but soft purple
  accentHover: '#b99dff',

  // Nervous system states
  hypervigilant: '#ff6b6b',
  hyper: '#ff8c42',
  shutdown: '#4dabf7',
  hypo: '#748ffc',
  freeze: '#9d7ff5',
  numb: '#8897aa',
  regulated: '#51cf66',
  mixed: '#ff6bb5',
};

// Shared colors (same across themes)
export const colors = {
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
};

export const typography = {
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.85rem',   // 13.6px
    md: '0.9rem',    // 14.4px
    base: '1rem',    // 16px
    lg: '1.1rem',    // 17.6px
    xl: '1.3rem',    // 20.8px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  glow: '0 0 15px rgba(139, 92, 246, 0.3)', // Soft purple glow
};

// Theme-aware component generator
export const getComponents = (theme) => ({
  container: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.textPrimary,
    padding: spacing.lg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'background 0.3s ease, color 0.3s ease',
  },

  card: {
    background: theme.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    border: `1px solid ${theme.border}`,
    boxShadow: theme === lightTheme ? shadows.sm : 'none',
    transition: 'all 0.3s ease',
  },

  cardHover: {
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },

  button: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: 'none',
    fontWeight: typography.fontWeights.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: typography.fontSizes.md,
  },

  buttonPrimary: {
    background: theme.accent,
    color: theme.textInverse,
  },

  buttonSecondary: {
    background: theme.surface,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
  },

  buttonDanger: {
    background: colors.danger,
    color: '#ffffff',
  },

  input: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: theme.textPrimary,
    fontSize: typography.fontSizes.md,
    transition: 'all 0.2s ease',
  },

  badge: {
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});

// Theme-aware navigation
export const getNav = (theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    background: theme.surface,
    borderRadius: borderRadius.lg,
    border: `1px solid ${theme.border}`,
  },

  button: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.full,
    border: `1px solid ${theme.border}`,
    background: theme.card,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    transition: 'all 0.2s ease',
  },

  buttonActive: {
    background: theme.accent,
    color: theme.textInverse,
    borderColor: theme.accent,
  },

  buttonHover: {
    background: theme.surfaceHover,
  },
});

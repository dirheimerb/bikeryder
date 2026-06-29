/**
 * Minimal design tokens. Dark-first palette suited to an outdoor activity app;
 * we can expand to full light/dark theming later.
 */
export const colors = {
  bg: '#0B0F14',
  surface: '#141A22',
  surfaceAlt: '#1E2730',
  border: '#27313C',
  text: '#F2F5F7',
  textMuted: '#9AA7B4',
  primary: '#FF5A1F', // bikeryder orange
  primaryDark: '#D8480F',
  success: '#2ECC71',
  danger: '#FF4D4D',
  track: '#FF5A1F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    stat: 44,
  },
} as const;

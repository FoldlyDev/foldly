/**
 * Static UI Color Constants
 * Only for hardcoded UI elements, NOT for user-customizable brand colors
 * Following 2025 design system best practices
 */

export type HexColor = `#${string}`;

/**
 * Status-based colors
 */
export const STATUS_COLORS = {
  active: '#10b981',
  paused: '#f59e0b',
  expired: '#ef4444',
  pending: '#6b7280',
} as const;

/**
 * Theme color variations
 */
export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f8fafc',
    accent: '#e2e8f0',
    border: '#e2e8f0',
  },
  dark: {
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    accent: '#334155',
    border: '#334155',
  },
} as const;

/**
 * Color utility functions and helpers
 */
export const COLOR_UTILS = {
  /**
   * Validates if a string is a valid hex color
   */
  isValidHexColor: (color: string): color is HexColor => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  },

  /**
   * Converts hex to RGB values
   */
  hexToRgb: (hex: HexColor) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Gets contrast ratio between two colors
   */
  getContrastRatio: (color1: HexColor, color2: HexColor): number => {
    // Simplified contrast calculation
    const rgb1 = COLOR_UTILS.hexToRgb(color1);
    const rgb2 = COLOR_UTILS.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 1;

    const luminance1 = (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255;
    const luminance2 = (0.299 * rgb2.r + 0.587 * rgb2.g + 0.114 * rgb2.b) / 255;

    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);

    return (brightest + 0.05) / (darkest + 0.05);
  },
} as const;

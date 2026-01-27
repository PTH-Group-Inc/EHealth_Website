/**
 * Theme configuration - Color palette và design tokens
 * KHÔNG hard-code hex colors trong components
 */

export const COLORS = {
    // Primary colors
    primary: "#3C81C6",
    "primary-hover": "#2a6da8",

    // Secondary & accents
    secondary: "#C6E7FF",
    notification: "#D4F6FF",

    // Semantic colors
    success: "#D2F7E1",
    "success-text": "#16a34a",
    warning: "#FFF3CC",
    "warning-text": "#ca8a04",
    error: "#FA707A",
    "error-text": "#dc2626",

    // Neutral colors
    neutral: "#F6F6F6",
    white: "#FFFFFF",
    gray: "#706E6E",
    "gray-light": "#687582",
    black: "#000000",
    "text-primary": "#121417",

    // Background colors
    "background-light": "#f6f7f8",
    "background-dark": "#13191f",
    "surface-dark": "#1e242b",
    "border-dark": "#2d353e",
    "border-light": "#dde0e4",
} as const;

// Tailwind-compatible color tokens (use in tailwind.config)
export const TAILWIND_COLORS = {
    primary: {
        DEFAULT: COLORS.primary,
        hover: COLORS["primary-hover"],
    },
    secondary: {
        DEFAULT: COLORS.secondary,
    },
    background: {
        light: COLORS["background-light"],
        dark: COLORS["background-dark"],
    },
    surface: {
        dark: COLORS["surface-dark"],
    },
    border: {
        light: COLORS["border-light"],
        dark: COLORS["border-dark"],
    },
} as const;

// Font family
export const FONTS = {
    display: ["Inter", "sans-serif"],
} as const;

// Border radius
export const BORDER_RADIUS = {
    DEFAULT: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
} as const;

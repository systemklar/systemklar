import type { Config } from "tailwindcss";

/**
 * Systemklar "Stille Hav" design tokens.
 * Tailwind v4 also maps these via @theme in globals.css; this file supports tooling and IDE hints.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        sk: {
          primary: "#4A7FA5",
          "primary-hover": "#3A6F95",
          "primary-light": "#EAF1F7",
          navy: "#1E3448",
          "navy-hover": "#162A3A",
          "bg-page": "#F7F4EF",
          "bg-card": "#FFFFFF",
          border: "#C8D8E4",
          "border-light": "#E0EAF0",
          accent: "#E8D8C4",
          "text-primary": "#1E3448",
          "text-secondary": "#4A6478",
          "text-muted": "#7A9AB0",
          "status-ok": "#5A9A6A",
          "status-warning": "#C4A84F",
          "status-error": "#B85C4A",
          "status-pending": "#9AA8B0",
          "status-ok-bg": "#EEF7F0",
          "status-ok-text": "#3A7A4A",
          "status-ok-border": "#B8D8C0",
          "status-warning-bg": "#FBF6E4",
          "status-warning-text": "#8A6A1A",
          "status-warning-border": "#E8D498",
          "status-error-bg": "#FBF0EE",
          "status-error-text": "#8A3A2A",
          "status-error-border": "#E8C4BC",
          "status-pending-bg": "#F0F4F7",
          "status-pending-text": "#5A7A90",
          "status-pending-border": "#C8D8E4",
          "nav-active": "#A8C8E0",
          "nav-inactive": "#7A9AB0",
        },
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
};

export default config;

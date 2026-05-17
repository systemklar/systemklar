import type { Config } from "tailwindcss";

/**
 * Systemklar "Skandinavisk Is" design tokens.
 * Tailwind v4 also maps these via @theme in globals.css; this file supports tooling and IDE hints.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        sk: {
          primary: "#2952A3",
          "primary-hover": "#1E4490",
          "primary-light": "#E8EEFC",
          sidebar: "#0A1628",
          "sidebar-hover": "#071020",
          "bg-page": "#F2F5FA",
          "bg-card": "#FFFFFF",
          border: "#CBD5E8",
          "border-light": "#E4EAF5",
          accent: "#6A92D8",
          "text-primary": "#0A1628",
          "text-secondary": "#2A4868",
          "text-muted": "#6A82A8",
          "status-ok": "#22C78A",
          "status-warning": "#F0A030",
          "status-error": "#E05040",
          "status-pending": "#9AAAC8",
          "status-ok-bg": "#E8FAF4",
          "status-ok-text": "#0A6A4A",
          "status-ok-border": "#B0E8D0",
          "status-warning-bg": "#FEF6E8",
          "status-warning-text": "#7A5010",
          "status-warning-border": "#F0D898",
          "status-error-bg": "#FEF0EE",
          "status-error-text": "#8A2A1A",
          "status-error-border": "#F0C0B8",
          "status-pending-bg": "#EEF2FA",
          "status-pending-text": "#4A6888",
          "status-pending-border": "#C8D5E8",
          "nav-active": "#6A92D8",
          "nav-inactive": "#2A4868",
        },
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
};

export default config;

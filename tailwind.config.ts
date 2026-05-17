import type { Config } from "tailwindcss";

/**
 * Systemklar Nordic Taupe design tokens.
 * Tailwind v4 also maps these via @theme in globals.css; this file supports tooling and IDE hints.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sk: {
          primary: "#8B9E6B",
          "primary-hover": "#7A8A5A",
          "primary-light": "#EEF2E6",
          navy: "#2C3E2A",
          "navy-hover": "#233320",
          "bg-page": "#F5F0E8",
          "bg-card": "#FFFFFF",
          border: "#D4C9A8",
          "border-light": "#E8E2D0",
          accent: "#C8A96E",
          "text-primary": "#2C3020",
          "text-secondary": "#5C5A48",
          "text-muted": "#8C8A78",
          "status-ok": "#6A8F5A",
          "status-warning": "#C4A84F",
          "status-error": "#B85C4A",
          "status-pending": "#A8A090",
          "status-ok-bg": "#EEF4EA",
          "status-ok-text": "#4A7A3A",
          "status-ok-border": "#C4D8B8",
          "status-warning-bg": "#FBF5E4",
          "status-warning-text": "#8A6A1A",
          "status-warning-border": "#E8D498",
          "status-error-bg": "#FBF0EE",
          "status-error-text": "#8A3A2A",
          "status-error-border": "#E8C4BC",
          "status-pending-bg": "#F4F2EC",
          "status-pending-text": "#6A6858",
          "status-pending-border": "#D4CEB8",
          "nav-active": "#C8D4A8",
          "nav-inactive": "#A8B898",
        },
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
};

export default config;

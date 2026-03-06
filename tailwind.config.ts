import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "#27272a",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        "primary-muted": "rgba(247, 147, 26, 0.15)",
        "text-primary": "var(--color-text)",
        "text-secondary": "var(--color-text2)",
        success: "var(--color-success)",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(247, 147, 26, 0)", borderColor: "var(--color-border)" },
          "50%": { boxShadow: "0 0 15px rgba(247, 147, 26, 0.3)", borderColor: "var(--color-primary)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.3s ease-out forwards",
        pulseGlow: "pulseGlow 2.5s ease-in-out infinite",
      },
      boxShadow: {
        card: "0 8px 30px rgba(0, 0, 0, 0.5)",
        glow: "0 0 15px rgba(247, 147, 26, 0.15)",
      },
      height: {
        nav: "var(--nav-height)",
        "stats-bar": "var(--stats-height)",
      },
      width: {
        sidebar: "var(--sidebar-width)",
      },
      spacing: {
        "nav-total": "var(--header-total)",
      },
    },
  },
  plugins: [],
};

export default config;

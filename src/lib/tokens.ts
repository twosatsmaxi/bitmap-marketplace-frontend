// Design tokens — raw values for canvas renderers, server-side image
// generators, and any place that can't reach CSS/Tailwind.

export const colors = {
  bg: "#09090b",              // --color-bg
  bgAlt: "#11111a",
  surface: "#121214",         // --color-surface
  surface2: "#1a1a1e",        // --color-surface-2
  surface3: "#27272a",        // --color-surface-3
  border: "#27272a",          // --color-border
  borderWarm: "rgba(120,72,18,0.55)",
  borderWarmLight: "rgba(120,72,18,0.35)",
  borderWarmStrong: "rgba(120,72,18,0.6)",
  primary: "#f7931a",         // --color-primary
  primaryMuted: "rgba(247,147,26,0.15)",
  text: "#f4f4f5",            // --color-text
  textSecondary: "#a1a1aa",   // --color-text2
  textLabel: "#71717a",
  textBranding: "#52525b",
  success: "#10b981",         // --color-success
  danger: "#ef4444",          // --color-danger
  info: "#82C7FF",            // --color-info
  chartAccent: "#F7A90C",
  chartGreen: "#69D6AA",
} as const;

export const primaryAlpha = {
  "3": "rgba(247,147,26,0.03)",
  "4": "rgba(247,147,26,0.04)",
  "6": "rgba(247,147,26,0.06)",
  "8": "rgba(247,147,26,0.08)",
  "10": "rgba(247,147,26,0.10)",
  "12": "rgba(247,147,26,0.12)",
  "15": "rgba(247,147,26,0.15)",
  "18": "rgba(247,147,26,0.18)",
  "24": "rgba(247,147,26,0.24)",
  "30": "rgba(247,147,26,0.30)",
  "50": "rgba(247,147,26,0.50)",
} as const;

export const whiteAlpha = {
  "3": "rgba(255,255,255,0.03)",
  "5": "rgba(255,255,255,0.05)",
  "8": "rgba(255,255,255,0.08)",
  "10": "rgba(255,255,255,0.10)",
  "15": "rgba(255,255,255,0.15)",
  "40": "rgba(255,255,255,0.40)",
  "50": "rgba(255,255,255,0.50)",
  "60": "rgba(255,255,255,0.60)",
} as const;

/** BTC value tiers for block visualizers & mempool HUD */
export const btcHeatMap = {
  tier6: "#ffeb3b",  // 10+ BTC
  tier5: "#ffc12a",  // 1–10 BTC
  tier4: "#f7931a",  // 0.1–1 BTC
  tier3: "#b87326",  // 0.01–0.1 BTC
  tier2: "#a05a1a",  // 0.001–0.01 BTC
  tier1: "#7e4912",  // < 0.001 BTC
} as const;

export const rarityColors = {
  common: "#8A8A8A",
  uncommon: "#60A5FA",
  rare: "#A78BFA",
  epic: "#F59E0B",
  legendary: "#F7931A",
} as const;

/** Mirrors tailwind.config fontFamily */
export const fontFamily = {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
  heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
  mono: ["var(--font-jetbrains-mono)", "monospace"],
} as const;

export const tracking = {
  tight: "-0.03em",
  normal: "0em",
  wide: "0.08em",
  wider: "0.10em",
  label: "0.14em",
  button: "0.18em",
  display: "0.20em",
  eyebrow: "0.22em",
  chip: "0.28em",
} as const;

export const fontSize = {
  "2xs": "0.5625rem",  // 9px
  xs: "0.625rem",      // 10px
  sm: "0.6875rem",     // 11px
  base: "0.75rem",     // 12px
  md: "0.8125rem",     // 13px
} as const;

export const duration = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
} as const;

export const easing = {
  default: "ease",
  out: "ease-out",
  in: "ease-in",
  inOut: "ease-in-out",
} as const;

export const transition = {
  colors: `color ${duration.fast}ms ${easing.default}, background-color ${duration.fast}ms ${easing.default}, border-color ${duration.fast}ms ${easing.default}`,
  all: `all ${duration.base}ms ${easing.default}`,
  opacity: `opacity ${duration.slow}ms ${easing.default}`,
  transform: `transform ${duration.slow}ms ${easing.out}`,
} as const;

export const shadows = {
  card: "0 8px 30px rgba(0,0,0,0.5)",
  glow: "0 0 15px rgba(247,147,26,0.15)",
  glowStrong: "0 0 20px rgba(247,147,26,0.3)",
  panel: "0 12px 30px rgba(0,0,0,0.28)",
} as const;

export const layout = {
  navHeight: "64px",
  statsHeight: "40px",
  headerTotal: "104px",
  sidebarWidth: "280px",
  gridSize: "44px",
} as const;

export const radii = {
  none: "0px",
  panel: "16px",
  card: "10px",
  full: "999px",
} as const;

const tokens = {
  colors,
  primaryAlpha,
  whiteAlpha,
  btcHeatMap,
  rarityColors,
  fontFamily,
  tracking,
  fontSize,
  duration,
  easing,
  transition,
  shadows,
  layout,
  radii,
} as const;

export type DesignTokens = typeof tokens;

export default tokens;

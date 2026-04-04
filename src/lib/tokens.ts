// ── Design Tokens ───────────────────────────────────────────────────
// Single source of truth for all design primitives used across the
// bitmap-marketplace-frontend.  Component files reference Tailwind
// classes / CSS variables; this file documents the raw values so
// they can be consumed in canvas renderers, server-side image
// generators, and any place that can't reach CSS.
// ────────────────────────────────────────────────────────────────────

// ── Color Primitives ────────────────────────────────────────────────

/** Core background & surface palette (dark theme) */
export const colors = {
  /** Page background — CSS var: --color-bg */
  bg: "#09090b",
  /** Alternate background for embeds / OG images */
  bgAlt: "#11111a",
  /** Card / panel surface — CSS var: --color-surface */
  surface: "#121214",
  /** Elevated surface — CSS var: --color-surface-2 */
  surface2: "#1a1a1e",
  /** Highest-elevation surface — CSS var: --color-surface-3 */
  surface3: "#27272a",

  /** Default border — CSS var: --color-border */
  border: "#27272a",
  /** Warm-tinted border used on panels, tooltips, separators */
  borderWarm: "rgba(120,72,18,0.55)",
  /** Lighter warm border for subtle separators */
  borderWarmLight: "rgba(120,72,18,0.35)",
  /** Stronger warm border on hover */
  borderWarmStrong: "rgba(120,72,18,0.6)",

  /** Bitcoin orange — CSS var: --color-primary */
  primary: "#f7931a",
  /** Muted primary for tinted backgrounds */
  primaryMuted: "rgba(247,147,26,0.15)",
  /** Primary text on dark — CSS var: --color-text */
  text: "#f4f4f5",
  /** Secondary / muted text — CSS var: --color-text2 */
  textSecondary: "#a1a1aa",
  /** Label / caption text used in scorecards */
  textLabel: "#71717a",
  /** Branding / watermark text */
  textBranding: "#52525b",

  /** Green success — CSS var: --color-success */
  success: "#10b981",
  /** Red danger / error */
  danger: "#ef4444",
  /** Informational blue (offers, volume charts) */
  info: "#82C7FF",

  /** Chart-specific accent: floor/price line */
  chartAccent: "#F7A90C",
  /** Chart-specific accent: holder distribution */
  chartGreen: "#69D6AA",
} as const;

// ── Primary Alpha Scale ─────────────────────────────────────────────

/** Translucent primary shades used for glows, tinted backgrounds, etc. */
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

// ── White Alpha Scale ───────────────────────────────────────────────

/** Translucent white shades for overlays, dividers, subtle borders */
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

// ── Bitcoin Value Heat Map ──────────────────────────────────────────

/** Heat-map colors used in block visualizers & mempool HUD */
export const btcHeatMap = {
  /** 10+ BTC */
  tier6: "#ffeb3b",
  /** 1 - 10 BTC */
  tier5: "#ffc12a",
  /** 0.1 - 1 BTC */
  tier4: "#f7931a",
  /** 0.01 - 0.1 BTC */
  tier3: "#b87326",
  /** 0.001 - 0.01 BTC */
  tier2: "#a05a1a",
  /** < 0.001 BTC */
  tier1: "#7e4912",
} as const;

// ── Rarity Colors ───────────────────────────────────────────────────

export const rarityColors = {
  common: "#8A8A8A",
  uncommon: "#60A5FA",
  rare: "#A78BFA",
  epic: "#F59E0B",
  legendary: "#F7931A",
} as const;

// ── Typography ──────────────────────────────────────────────────────

/** Font family stacks — mirrors tailwind.config fontFamily */
export const fontFamily = {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
  heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
  mono: ["var(--font-jetbrains-mono)", "monospace"],
} as const;

/** Common letter-spacing values used with font-mono UI labels */
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

/** Common font-size tokens (rem) for mono UI labels */
export const fontSize = {
  /** 9px — tiny badges, counters */
  "2xs": "0.5625rem",
  /** 10px — labels, stat captions */
  xs: "0.625rem",
  /** 11px — nav items, wallet text */
  sm: "0.6875rem",
  /** 12px — standard mono text */
  base: "0.75rem",
  /** 13px — eyebrow chip text on homepage */
  md: "0.8125rem",
} as const;

// ── Transitions ─────────────────────────────────────────────────────

/** Duration tokens in ms — used in both CSS and JS animations */
export const duration = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
} as const;

/** Easing curves */
export const easing = {
  default: "ease",
  out: "ease-out",
  in: "ease-in",
  inOut: "ease-in-out",
} as const;

/** Pre-composed transition strings for common patterns */
export const transition = {
  colors: `color ${duration.fast}ms ${easing.default}, background-color ${duration.fast}ms ${easing.default}, border-color ${duration.fast}ms ${easing.default}`,
  all: `all ${duration.base}ms ${easing.default}`,
  opacity: `opacity ${duration.slow}ms ${easing.default}`,
  transform: `transform ${duration.slow}ms ${easing.out}`,
} as const;

// ── Shadows ─────────────────────────────────────────────────────────

export const shadows = {
  card: "0 8px 30px rgba(0,0,0,0.5)",
  glow: "0 0 15px rgba(247,147,26,0.15)",
  glowStrong: "0 0 20px rgba(247,147,26,0.3)",
  panel: "0 12px 30px rgba(0,0,0,0.28)",
} as const;

// ── Layout ──────────────────────────────────────────────────────────

export const layout = {
  navHeight: "64px",
  statsHeight: "40px",
  headerTotal: "104px",
  sidebarWidth: "280px",
  gridSize: "44px",
} as const;

// ── Border Radius ───────────────────────────────────────────────────

/** All radii are 0px (bitmap pixel aesthetic) except special components */
export const radii = {
  none: "0px",
  /** Used on home panels, bottom sheets */
  panel: "16px",
  /** Used on home buttons, cards */
  card: "10px",
  /** Full-round for pills, chips, orbs */
  full: "999px",
} as const;

// ── Aggregate Export ────────────────────────────────────────────────

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

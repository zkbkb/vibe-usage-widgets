import { Color, DynamicShapeStyle, ShapeStyle } from "scripting"
import { ThemeMode } from "./settings"

export type Style = Color | { light: Color; dark: Color }

interface Palette {
  bg: Color
  card: Color
  border: Color
  text: Color
  secondary: Color
  tertiary: Color
  green: Color
  blue: Color
  violet: Color
  sky: Color
  amber: Color
  track: Color
}

// Dashboard-grade dark tokens (matches the official Vibe Usage macOS app).
const dark: Palette = {
  bg: "#0A0A0C",
  card: "#16171B",
  border: "rgba(255,255,255,0.07)",
  text: "#FFFFFF",
  secondary: "#9C9FA8",
  tertiary: "#5F626B",
  green: "#33CC80",
  blue: "#5E9BFF",
  violet: "#A78BFA",
  sky: "#7FD1E8",
  amber: "#F2B840",
  track: "rgba(255,255,255,0.08)",
}

// Light variant, tuned for contrast and clarity on white cards.
const light: Palette = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  border: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  secondary: "#64748B",
  tertiary: "#94A3B8",
  green: "#10B981",
  blue: "#2563EB",
  violet: "#7C3AED",
  sky: "#0284C7",
  amber: "#F59E0A",
  track: "rgba(15,23,42,0.05)",
}

export const CHART_PALETTE: Color[] = [
  "#3B82F5",
  "#10BA82",
  "#F59E0A",
  "#F04545",
  "#8C5CF5",
  "#EE4D99",
]
const CHART_OTHER: Style = {
  light: "rgba(100,116,139,0.25)",
  dark: "rgba(255,255,255,0.3)",
}

export interface Theme {
  bg: Style
  card: Style
  border: Style
  text: Style
  secondary: Style
  tertiary: Style
  green: Style
  blue: Style
  violet: Style
  sky: Style
  amber: Style
  track: Style
  forcedBg: Style | null
  isForcedDark: boolean
}

export function rankColour(index: number, isOther: boolean): Style {
  if (isOther) {
    return CHART_OTHER
  }
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

export function makeTheme(mode: ThemeMode): Theme {
  const pick = (key: keyof Palette): Style => {
    if (mode === "dark") return dark[key]
    if (mode === "light") return light[key]
    return { light: light[key], dark: dark[key] }
  }
  return {
    bg: pick("bg"),
    card: pick("card"),
    border: pick("border"),
    text: pick("text"),
    secondary: pick("secondary"),
    tertiary: pick("tertiary"),
    green: pick("green"),
    blue: pick("blue"),
    violet: pick("violet"),
    sky: pick("sky"),
    amber: pick("amber"),
    track: pick("track"),
    forcedBg: mode === "system" ? null : pick("bg"),
    isForcedDark: mode === "dark",
  }
}

// Translucent variant of a hex colour, used to build chart gradients.
export function faded(colour: Color, alpha: number): Color {
  if (typeof colour === "string" && /^#[0-9a-fA-F]{6}$/.test(colour)) {
    const r = parseInt(colour.slice(1, 3), 16)
    const g = parseInt(colour.slice(3, 5), 16)
    const b = parseInt(colour.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return colour
}

// Translucent variant that stays appearance-aware.
export function fadedStyle(style: Style, alpha: number): Style {
  if (typeof style === "string") {
    return faded(style, alpha)
  }
  return { light: faded(style.light, alpha), dark: faded(style.dark, alpha) }
}

// Vertical gradient following the appearance of the given style.
export function verticalGradient(
  style: Style,
  topAlpha: number,
  bottomAlpha: number,
): ShapeStyle | DynamicShapeStyle {
  const make = (colour: Color) => ({
    colors: [faded(colour, topAlpha), faded(colour, bottomAlpha)],
    startPoint: "top" as const,
    endPoint: "bottom" as const,
  })
  if (typeof style === "string") {
    return make(style)
  }
  return { light: make(style.light), dark: make(style.dark) }
}

// Soft radial halo, e.g. behind the end marker of the trend line.
export function radialGlow(
  style: Style,
  alpha: number,
  radius: number,
): ShapeStyle | DynamicShapeStyle {
  const make = (colour: Color) => ({
    colors: [faded(colour, alpha), faded(colour, 0)],
    center: "center" as const,
    startRadius: 1,
    endRadius: radius,
  })
  if (typeof style === "string") {
    return make(style)
  }
  return { light: make(style.light), dark: make(style.dark) }
}

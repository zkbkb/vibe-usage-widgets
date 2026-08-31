import { ThemeMode } from "./settings"

export type Style = string | { light: string; dark: string }

interface Palette {
  bg: string
  card: string
  border: string
  text: string
  secondary: string
  tertiary: string
  green: string
  blue: string
  amber: string
  barOutput: string
  barInput: string
  barCached: string
  track: string
}

// Official Vibe Usage macOS app tokens.
const dark: Palette = {
  bg: "#0A0A0A",
  card: "#171717",
  border: "#292929",
  text: "#FFFFFF",
  secondary: "#A1A1A1",
  tertiary: "#616161",
  green: "#33CC80",
  blue: "#6199FF",
  amber: "#F2B840",
  barOutput: "rgba(255,255,255,0.9)",
  barInput: "rgba(255,255,255,0.5)",
  barCached: "rgba(255,255,255,0.24)",
  track: "rgba(255,255,255,0.1)",
}

// Light variant, tuned for contrast on white cards.
const light: Palette = {
  bg: "#F2F2F4",
  card: "#FFFFFF",
  border: "#E3E3E6",
  text: "#111111",
  secondary: "#6E6E73",
  tertiary: "#9C9CA1",
  green: "#1FA866",
  blue: "#3B72E8",
  amber: "#D99A20",
  barOutput: "rgba(17,17,17,0.85)",
  barInput: "rgba(17,17,17,0.45)",
  barCached: "rgba(17,17,17,0.18)",
  track: "rgba(17,17,17,0.08)",
}

export const CHART_PALETTE = [
  "#3B82F5",
  "#10BA82",
  "#F59E0A",
  "#F04545",
  "#8C5CF5",
  "#EE4D99",
]
const CHART_OTHER: Style = {
  light: "rgba(17,17,17,0.3)",
  dark: "rgba(255,255,255,0.32)",
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
  amber: Style
  accent: Style
  barOutput: Style
  barInput: Style
  barCached: Style
  track: Style
  isForcedDark: boolean
}

export function rankColour(index: number, isOther: boolean): Style {
  if (isOther) {
    return CHART_OTHER
  }
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

export function makeTheme(mode: ThemeMode, accent: string | null): Theme {
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
    amber: pick("amber"),
    accent: accent ?? pick("green"),
    barOutput: pick("barOutput"),
    barInput: pick("barInput"),
    barCached: pick("barCached"),
    track: pick("track"),
    isForcedDark: mode === "dark",
  }
}

export const ACCENT_CHOICES: { name: string; value: string | null }[] = [
  { name: "Default", value: null },
  { name: "Green", value: "#33CC80" },
  { name: "Blue", value: "#6199FF" },
  { name: "Amber", value: "#F2B840" },
  { name: "Violet", value: "#8C5CF5" },
  { name: "Pink", value: "#EE4D99" },
  { name: "Red", value: "#F04545" },
]

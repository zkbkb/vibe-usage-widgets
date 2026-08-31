export type ViewKind = "overview" | "active" | "models" | "projects"
export type ThemeMode = "system" | "dark" | "light"
export type LanguageMode = "system" | "en" | "zh"
export type Currency = "USD" | "CNY"
export type SortKey = "tokens" | "cost"

export interface Settings {
  days: number
  sortKey: SortKey
  theme: ThemeMode
  accent: string | null
  language: LanguageMode
  privacyMode: boolean
  currency: Currency
  showForecast: boolean
  defaultView: ViewKind
}

export const DEFAULT_SETTINGS: Settings = {
  days: 7,
  sortKey: "tokens",
  theme: "system",
  accent: null,
  language: "system",
  privacyMode: false,
  currency: "USD",
  showForecast: true,
  defaultView: "overview",
}

export interface WidgetPreset {
  view?: ViewKind
  days?: number
  accent?: string
  privacy?: boolean
  currency?: Currency
  sort?: SortKey
  theme?: ThemeMode
  mock?: boolean
}

export interface ResolvedConfig extends Settings {
  view: ViewKind
  mock: boolean
}

const VIEW_KINDS: ViewKind[] = ["overview", "active", "models", "projects"]
const THEME_MODES: ThemeMode[] = ["system", "dark", "light"]
const LANGUAGES: LanguageMode[] = ["system", "en", "zh"]
const CURRENCIES: Currency[] = ["USD", "CNY"]
const SORT_KEYS: SortKey[] = ["tokens", "cost"]

function oneOf<T>(value: unknown, allowed: T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

function clampDays(value: unknown): number | undefined {
  if (typeof value !== "number" || !isFinite(value)) {
    return undefined
  }
  return Math.min(90, Math.max(1, Math.round(value)))
}

function isHexColour(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
}

export function sanitizeSettings(raw: unknown): Partial<Settings> {
  if (raw == null || typeof raw !== "object") {
    return {}
  }
  const r = raw as Record<string, unknown>
  const out: Partial<Settings> = {}
  const days = clampDays(r.days)
  if (days != null) out.days = days
  const sortKey = oneOf(r.sortKey, SORT_KEYS)
  if (sortKey != null) out.sortKey = sortKey
  const theme = oneOf(r.theme, THEME_MODES)
  if (theme != null) out.theme = theme
  if (isHexColour(r.accent)) out.accent = r.accent
  const language = oneOf(r.language, LANGUAGES)
  if (language != null) out.language = language
  if (typeof r.privacyMode === "boolean") out.privacyMode = r.privacyMode
  const currency = oneOf(r.currency, CURRENCIES)
  if (currency != null) out.currency = currency
  if (typeof r.showForecast === "boolean") out.showForecast = r.showForecast
  const defaultView = oneOf(r.defaultView, VIEW_KINDS)
  if (defaultView != null) out.defaultView = defaultView
  return out
}

export function parsePreset(parameter: string | null | undefined): WidgetPreset {
  if (parameter == null) {
    return {}
  }
  const text = parameter.trim()
  if (text.length === 0) {
    return {}
  }
  // Bare keywords are accepted as a view shorthand, e.g. "models".
  const asView = oneOf(text.toLowerCase(), VIEW_KINDS)
  if (asView != null) {
    return { view: asView }
  }
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    if (raw == null || typeof raw !== "object") {
      return {}
    }
    const preset: WidgetPreset = {}
    const view = oneOf(raw.view, VIEW_KINDS)
    if (view != null) preset.view = view
    const days = clampDays(raw.days)
    if (days != null) preset.days = days
    if (isHexColour(raw.accent)) preset.accent = raw.accent
    if (typeof raw.privacy === "boolean") preset.privacy = raw.privacy
    const currency = oneOf(raw.currency, CURRENCIES)
    if (currency != null) preset.currency = currency
    const sort = oneOf(raw.sort, SORT_KEYS)
    if (sort != null) preset.sort = sort
    const theme = oneOf(raw.theme, THEME_MODES)
    if (theme != null) preset.theme = theme
    if (typeof raw.mock === "boolean") preset.mock = raw.mock
    return preset
  } catch {
    return {}
  }
}

export function resolveConfig(
  stored: Partial<Settings> | null,
  parameter: string | null | undefined,
): ResolvedConfig {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...sanitizeSettings(stored),
  }
  const preset = parsePreset(parameter)
  return {
    ...settings,
    days: preset.days ?? settings.days,
    sortKey: preset.sort ?? settings.sortKey,
    theme: preset.theme ?? settings.theme,
    accent: preset.accent ?? settings.accent,
    privacyMode: preset.privacy ?? settings.privacyMode,
    currency: preset.currency ?? settings.currency,
    view: preset.view ?? settings.defaultView,
    mock: preset.mock ?? false,
  }
}

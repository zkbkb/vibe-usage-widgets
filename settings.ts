export type ViewKind = "overview" | "active" | "models"
export type ThemeMode = "system" | "dark" | "light"
export type LanguageMode = "system" | "en" | "zh"
export type Currency = "USD" | "CNY"
export type SortKey = "tokens" | "cost"
export type ChartStyle = "stacked" | "multilines"
export type PeakTag = "badge" | "ruler" | "none" | "single"

export interface Settings {
  days: number
  sortKey: SortKey
  theme: ThemeMode
  language: LanguageMode
  currency: Currency
  showForecast: boolean
  defaultView: ViewKind
  chartStyle: ChartStyle
  peakTag: PeakTag
}

export const DEFAULT_SETTINGS: Settings = {
  days: 7,
  sortKey: "tokens",
  theme: "system",
  language: "system",
  currency: "USD",
  showForecast: true,
  defaultView: "overview",
  chartStyle: "stacked",
  peakTag: "badge",
}

export interface WidgetPreset {
  view?: ViewKind
  days?: number
  currency?: Currency
  language?: LanguageMode
  sort?: SortKey
  theme?: ThemeMode
  forecast?: boolean
  mock?: boolean
  chartStyle?: ChartStyle
  peakTag?: PeakTag
}

export interface ResolvedConfig extends Settings {
  view: ViewKind
  mock: boolean
}

const VIEW_KINDS: ViewKind[] = ["overview", "active", "models"]
const THEME_MODES: ThemeMode[] = ["system", "dark", "light"]
const LANGUAGES: LanguageMode[] = ["system", "en", "zh"]
const CURRENCIES: Currency[] = ["USD", "CNY"]
const SORT_KEYS: SortKey[] = ["tokens", "cost"]
const CHART_STYLES: ChartStyle[] = ["stacked", "multilines"]
const PEAK_TAGS: PeakTag[] = ["badge", "ruler", "none", "single"]

function oneOf<T>(value: unknown, allowed: T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

function clampDays(value: unknown): number | undefined {
  if (typeof value !== "number" || !isFinite(value)) {
    return undefined
  }
  return Math.min(90, Math.max(1, Math.round(value)))
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
  const language = oneOf(r.language, LANGUAGES)
  if (language != null) out.language = language
  const currency = oneOf(r.currency, CURRENCIES)
  if (currency != null) out.currency = currency
  if (typeof r.showForecast === "boolean") out.showForecast = r.showForecast
  const defaultView = oneOf(r.defaultView, VIEW_KINDS)
  if (defaultView != null) out.defaultView = defaultView
  const chartStyle = oneOf(r.chartStyle, CHART_STYLES)
  if (chartStyle != null) out.chartStyle = chartStyle
  const peakTag = oneOf(r.peakTag, PEAK_TAGS)
  if (peakTag != null) out.peakTag = peakTag
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
    const currency = oneOf(raw.currency, CURRENCIES)
    if (currency != null) preset.currency = currency
    const language = oneOf(raw.language, LANGUAGES)
    if (language != null) preset.language = language
    if (typeof raw.forecast === "boolean") preset.forecast = raw.forecast
    const sort = oneOf(raw.sort, SORT_KEYS)
    if (sort != null) preset.sort = sort
    const theme = oneOf(raw.theme, THEME_MODES)
    if (theme != null) preset.theme = theme
    if (typeof raw.mock === "boolean") preset.mock = raw.mock
    const chartStyle = oneOf(raw.chartStyle, CHART_STYLES)
    if (chartStyle != null) preset.chartStyle = chartStyle
    const peakTag = oneOf(raw.peakTag, PEAK_TAGS)
    if (peakTag != null) preset.peakTag = peakTag
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
    currency: preset.currency ?? settings.currency,
    language: preset.language ?? settings.language,
    showForecast: preset.forecast ?? settings.showForecast,
    view: preset.view ?? settings.defaultView,
    mock: preset.mock ?? false,
    chartStyle: preset.chartStyle ?? settings.chartStyle,
    peakTag: preset.peakTag ?? settings.peakTag,
  }
}

// A preset is an override layer: whatever it names is pinned for that widget,
// and whatever it leaves out keeps following the global settings. So only the
// values that actually differ from the defaults are worth writing down.
export function buildPresetJson(settings: Settings): string {
  const preset: WidgetPreset = {}
  if (settings.defaultView !== DEFAULT_SETTINGS.defaultView) preset.view = settings.defaultView
  if (settings.days !== DEFAULT_SETTINGS.days) preset.days = settings.days
  if (settings.sortKey !== DEFAULT_SETTINGS.sortKey) preset.sort = settings.sortKey
  if (settings.chartStyle !== DEFAULT_SETTINGS.chartStyle) preset.chartStyle = settings.chartStyle
  if (settings.peakTag !== DEFAULT_SETTINGS.peakTag) preset.peakTag = settings.peakTag
  if (settings.theme !== DEFAULT_SETTINGS.theme) preset.theme = settings.theme
  if (settings.currency !== DEFAULT_SETTINGS.currency) preset.currency = settings.currency
  if (settings.language !== DEFAULT_SETTINGS.language) preset.language = settings.language
  if (settings.showForecast !== DEFAULT_SETTINGS.showForecast) preset.forecast = settings.showForecast
  return JSON.stringify(preset)
}

// Whether `parsePreset` would read this text as a preset at all, so the
// settings page can flag a typo instead of letting it fail silently.
export function isPresetText(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return true
  }
  if (oneOf(trimmed.toLowerCase(), VIEW_KINDS) != null) {
    return true
  }
  try {
    const raw = JSON.parse(trimmed) as unknown
    return raw != null && typeof raw === "object" && !Array.isArray(raw)
  } catch {
    return false
  }
}

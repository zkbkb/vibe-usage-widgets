import { Currency } from "./settings"

const CNY_RATE = 7
const MASK = "•••"

function trimZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value
}

export function formatTokens(n: number, lang: string, privacy: boolean = false): string {
  if (privacy) {
    return MASK
  }
  if (!isFinite(n) || n < 0) {
    n = 0
  }
  if (lang.startsWith("zh")) {
    if (n < 10_000) return `${Math.round(n)}`
    if (n < 100_000_000) return `${trimZero((n / 10_000).toFixed(n < 1_000_000 ? 1 : 0))}万`
    return `${trimZero((n / 100_000_000).toFixed(1))}亿`
  }
  if (n < 1_000) return `${Math.round(n)}`
  if (n < 1_000_000) return `${trimZero((n / 1_000).toFixed(1))}K`
  if (n < 1_000_000_000) return `${trimZero((n / 1_000_000).toFixed(1))}M`
  return `${trimZero((n / 1_000_000_000).toFixed(1))}B`
}

export function formatCost(
  usd: number,
  currency: Currency,
  privacy: boolean = false,
): string {
  const symbol = currency === "CNY" ? "¥" : "$"
  if (privacy) {
    return `${symbol}${MASK}`
  }
  const amount = currency === "CNY" ? usd * CNY_RATE : usd
  if (!isFinite(amount) || amount <= 0) {
    return `${symbol}0.00`
  }
  if (amount < 0.01) {
    return `${symbol}${amount.toFixed(4)}`
  }
  if (amount >= 10_000) {
    return `${symbol}${Math.round(amount)}`
  }
  return `${symbol}${amount.toFixed(2)}`
}

export function formatDuration(seconds: number, lang: string): string {
  if (!isFinite(seconds) || seconds < 0) {
    seconds = 0
  }
  const zh = lang.startsWith("zh")
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`
  }
  if (minutes > 0) {
    return zh ? `${minutes}分` : `${minutes}m`
  }
  return zh ? `${Math.floor(seconds)}秒` : `${Math.floor(seconds)}s`
}

export function formatPercent(ratio: number): string {
  if (!isFinite(ratio) || ratio < 0) {
    return "0%"
  }
  return `${Math.round(ratio * 100)}%`
}

export function formatCount(n: number, privacy: boolean = false): string {
  return privacy ? MASK : `${Math.round(n)}`
}

// "claude-opus-4-20250514" -> "claude-opus-4"; "gpt-5.2-codex" stays as-is.
export function shortModelName(model: string): string {
  return model.replace(/-\d{8}$/, "").replace(/-\d{4}-\d{2}-\d{2}$/, "")
}

export function shortSourceName(source: string): string {
  return source
}

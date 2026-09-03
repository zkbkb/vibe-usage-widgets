import { Currency } from "./settings"

const CNY_RATE = 7

// Token amounts always use K/M/B units with two decimals, in any language.
export function formatTokens(n: number): string {
  if (!isFinite(n) || n < 0) {
    n = 0
  }
  if (n < 1_000) return `${Math.round(n)}`
  const units: [number, string][] = [[1_000_000_000, "B"], [1_000_000, "M"], [1_000, "K"]]
  for (const [divisor, suffix] of units) {
    if (n >= divisor) {
      const fixed = (n / divisor).toFixed(2)
      return `${fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed}${suffix}`
    }
  }
  return `${Math.round(n)}`
}

export function formatCost(usd: number, currency: Currency): string {
  const symbol = currency === "CNY" ? "¥" : "$"
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
  // Big totals read better without the minutes tail.
  if (hours >= 100) {
    return zh ? `${hours}时` : `${hours}h`
  }
  if (hours > 0) {
    return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`
  }
  if (minutes > 0) {
    return zh ? `${minutes}分` : `${minutes}m`
  }
  return zh ? `${Math.floor(seconds)}秒` : `${Math.floor(seconds)}s`
}

export function formatPercent(ratio: number): string {
  if (!isFinite(ratio) || ratio <= 0) {
    return "0%"
  }
  // A non-zero share never rounds down to a misleading 0%.
  return `${Math.max(1, Math.round(ratio * 100))}%`
}

export function formatCount(n: number): string {
  if (!isFinite(n) || n < 0) {
    n = 0
  }
  return `${Math.round(n)}`
}

// "claude-opus-4-20250514" -> "claude-opus-4"; "gpt-5.2-codex" stays as-is.
export function shortModelName(model: string): string {
  return model.replace(/-\d{8}$/, "").replace(/-\d{4}-\d{2}-\d{2}$/, "")
}

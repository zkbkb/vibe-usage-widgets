import { Aggregates, DayRow, RankItem, UsagePayload } from "./types"
import { SortKey } from "./settings"
import { monthStart, windowStart } from "./api"

function dayKey(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function bucketTokens(b: {
  inputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  cachedInputTokens: number
}): number {
  return b.inputTokens + b.outputTokens + b.reasoningOutputTokens + b.cachedInputTokens
}

function rankBy(
  entries: Map<string, { tokens: number; cost: number }>,
  sortKey: SortKey,
  maxItems: number,
  otherLabel: string,
): RankItem[] {
  const items = [...entries.entries()].map(([name, v]) => ({
    name,
    tokens: v.tokens,
    cost: v.cost,
    share: 0,
  }))
  const metric = (item: RankItem) => (sortKey === "cost" ? item.cost : item.tokens)
  items.sort((a, b) => metric(b) - metric(a))
  const total = items.reduce((sum, item) => sum + metric(item), 0)
  let result = items
  if (items.length > maxItems) {
    const head = items.slice(0, maxItems - 1)
    const rest = items.slice(maxItems - 1)
    head.push({
      name: otherLabel,
      tokens: rest.reduce((s, i) => s + i.tokens, 0),
      cost: rest.reduce((s, i) => s + i.cost, 0),
      share: 0,
    })
    result = head
  }
  if (total > 0) {
    for (const item of result) {
      item.share = metric(item) / total
    }
  }
  return result.filter(item => metric(item) > 0)
}

export interface AggregateOptions {
  days: number
  sortKey: SortKey
  forecast: boolean
  coversMonth: boolean
  otherLabel: string
}

export function computeAggregates(
  payload: UsagePayload,
  options: AggregateOptions,
  now: Date = new Date(),
): Aggregates {
  const winStart = windowStart(now, options.days)
  const winStartMs = winStart.getTime()
  const monStart = monthStart(now)

  const byDayMap = new Map<string, DayRow>()
  for (let i = 0; i < options.days; i++) {
    const date = new Date(winStart.getFullYear(), winStart.getMonth(), winStart.getDate() + i)
    byDayMap.set(dayKey(date), {
      date: dayKey(date),
      dayOfMonth: date.getDate(),
      input: 0, output: 0, reasoning: 0, cached: 0,
      total: 0, cost: 0,
      costInput: 0, costOutput: 0, costReasoning: 0, costCached: 0,
      activeSec: 0,
    })
  }

  const totals = {
    input: 0, output: 0, reasoning: 0, cached: 0,
    displayed: 0, cost: 0,
    costInput: 0, costOutput: 0, costReasoning: 0, costCached: 0,
    cacheRatio: 0,
  }
  const byModel = new Map<string, { tokens: number; cost: number }>()
  const byProject = new Map<string, { tokens: number; cost: number }>()
  const bySource = new Map<string, { tokens: number; cost: number }>()
  let monthCost = 0
  let monthHasCost = false

  for (const bucket of payload.buckets) {
    const time = Date.parse(bucket.bucketStart)
    if (isNaN(time)) {
      continue
    }
    const cost = bucket.estimatedCost ?? 0
    if (time >= monStart.getTime()) {
      monthCost += cost
      monthHasCost = true
    }
    if (time < winStartMs) {
      continue
    }
    // Pricing weighting based on standard LLM token pricing:
    // cached input ≈ 0.15x regular input; output & reasoning ≈ 4x regular input.
    const wCached = bucket.cachedInputTokens * 0.15
    const wInput = bucket.inputTokens * 1.0
    const wOutput = bucket.outputTokens * 4.0
    const wReasoning = bucket.reasoningOutputTokens * 4.0
    const wTotal = wCached + wInput + wOutput + wReasoning
    const bCostCached = wTotal > 0 ? (wCached / wTotal) * cost : 0
    const bCostInput = wTotal > 0 ? (wInput / wTotal) * cost : 0
    const bCostOutput = wTotal > 0 ? (wOutput / wTotal) * cost : 0
    const bCostReasoning = wTotal > 0 ? (wReasoning / wTotal) * cost : 0

    totals.input += bucket.inputTokens
    totals.output += bucket.outputTokens
    totals.reasoning += bucket.reasoningOutputTokens
    totals.cached += bucket.cachedInputTokens
    totals.cost += cost
    totals.costInput += bCostInput
    totals.costOutput += bCostOutput
    totals.costReasoning += bCostReasoning
    totals.costCached += bCostCached

    const row = byDayMap.get(dayKey(new Date(time)))
    if (row != null) {
      row.input += bucket.inputTokens
      row.output += bucket.outputTokens
      row.reasoning += bucket.reasoningOutputTokens
      row.cached += bucket.cachedInputTokens
      row.total += bucketTokens(bucket)
      row.cost += cost
      row.costInput += bCostInput
      row.costOutput += bCostOutput
      row.costReasoning += bCostReasoning
      row.costCached += bCostCached
    }

    const tokens = bucketTokens(bucket)
    for (const [map, key] of [
      [byModel, bucket.model],
      [byProject, bucket.project],
      [bySource, bucket.source],
    ] as [Map<string, { tokens: number; cost: number }>, string][]) {
      const entry = map.get(key) ?? { tokens: 0, cost: 0 }
      entry.tokens += tokens
      entry.cost += cost
      map.set(key, entry)
    }
  }

  totals.displayed = totals.input + totals.output + totals.reasoning + totals.cached
  const cacheBase = totals.input + totals.cached
  totals.cacheRatio = cacheBase > 0 ? totals.cached / cacheBase : 0

  const sessionStats = {
    count: 0, messages: 0, userMessages: 0, durationSec: 0, activeSec: 0,
  }
  for (const session of payload.sessions) {
    const time = Date.parse(session.lastMessageAt)
    if (isNaN(time) || time < winStartMs) {
      continue
    }
    sessionStats.count += 1
    sessionStats.messages += session.messageCount
    sessionStats.userMessages += session.userMessageCount
    sessionStats.durationSec += session.durationSeconds
    sessionStats.activeSec += session.activeSeconds
    const row = byDayMap.get(dayKey(new Date(time)))
    if (row != null) {
      row.activeSec += session.activeSeconds
    }
  }

  // Forecast requires month coverage: either the payload was fetched from the
  // first of the month, or the display window already spans it.
  const windowCoversMonth = winStartMs <= monStart.getTime()
  let forecastMonthUsd: number | null = null
  if (options.forecast && (options.coversMonth || windowCoversMonth) && monthHasCost) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    forecastMonthUsd = (monthCost / now.getDate()) * daysInMonth
  }

  return {
    totals,
    byDay: [...byDayMap.values()],
    byModel: rankBy(byModel, options.sortKey, 5, options.otherLabel),
    byProject: rankBy(byProject, options.sortKey, 5, options.otherLabel),
    bySource: rankBy(bySource, options.sortKey, 5, options.otherLabel),
    sessionStats,
    forecastMonthUsd,
  }
}

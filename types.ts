export interface UsageBucket {
  source: string
  model: string
  project: string
  hostname: string
  bucketStart: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCost: number | null
}

export interface UsageSession {
  source: string
  project: string
  hostname: string
  firstMessageAt: string
  lastMessageAt: string
  durationSeconds: number
  activeSeconds: number
  messageCount: number
  userMessageCount: number
}

export interface UsagePayload {
  buckets: UsageBucket[]
  sessions: UsageSession[]
  hasAnyData: boolean
}

export interface CacheEntry {
  payload: UsagePayload
  fetchedAt: number
  days: number
  coversMonth: boolean
}

export type FetchError = "unauthorized" | "network" | "invalid"

export interface FetchResult {
  ok: boolean
  payload?: UsagePayload
  error?: FetchError
}

export interface DayRow {
  date: string
  dayOfMonth: number
  input: number
  output: number
  reasoning: number
  cached: number
  total: number
  cost: number
  costInput: number
  costOutput: number
  costReasoning: number
  costCached: number
  activeSec: number
}

export interface RankItem {
  name: string
  tokens: number
  cost: number
  share: number
}

export interface Aggregates {
  totals: {
    input: number
    output: number
    reasoning: number
    cached: number
    displayed: number
    cost: number
    costInput: number
    costOutput: number
    costReasoning: number
    costCached: number
    cacheRatio: number
  }
  byDay: DayRow[]
  byModel: RankItem[]
  byProject: RankItem[]
  bySource: RankItem[]
  sessionStats: {
    count: number
    messages: number
    userMessages: number
    durationSec: number
    activeSec: number
  }
  forecastMonthUsd: number | null
}

export type DataStatus =
  | { kind: "fresh"; fetchedAt: number }
  | { kind: "stale"; fetchedAt: number }

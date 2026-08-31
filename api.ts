import { FetchResult, UsageBucket, UsagePayload, UsageSession } from "./types"

const BASE_URL = "https://vibecafe.ai/api/usage"
const FETCH_TIMEOUT_SECONDS = 10

function num(value: unknown): number {
  return typeof value === "number" && isFinite(value) ? value : 0
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function decodeBucket(raw: Record<string, unknown>): UsageBucket | null {
  const bucketStart = str(raw.bucketStart)
  if (bucketStart.length === 0 || isNaN(Date.parse(bucketStart))) {
    return null
  }
  const cost = raw.estimatedCost
  return {
    source: str(raw.source) || "unknown",
    model: str(raw.model) || "unknown",
    project: str(raw.project) || "unknown",
    hostname: str(raw.hostname) || "unknown",
    bucketStart,
    inputTokens: num(raw.inputTokens),
    outputTokens: num(raw.outputTokens),
    cachedInputTokens: num(raw.cachedInputTokens),
    reasoningOutputTokens: num(raw.reasoningOutputTokens),
    totalTokens: num(raw.totalTokens),
    estimatedCost: typeof cost === "number" && isFinite(cost) ? cost : null,
  }
}

function decodeSession(raw: Record<string, unknown>): UsageSession | null {
  const lastMessageAt = str(raw.lastMessageAt)
  if (lastMessageAt.length === 0 || isNaN(Date.parse(lastMessageAt))) {
    return null
  }
  return {
    source: str(raw.source) || "unknown",
    project: str(raw.project) || "unknown",
    hostname: str(raw.hostname) || "unknown",
    firstMessageAt: str(raw.firstMessageAt) || lastMessageAt,
    lastMessageAt,
    durationSeconds: num(raw.durationSeconds),
    activeSeconds: num(raw.activeSeconds),
    messageCount: num(raw.messageCount),
    userMessageCount: num(raw.userMessageCount),
  }
}

function decodePayload(raw: unknown): UsagePayload | null {
  if (raw == null || typeof raw !== "object") {
    return null
  }
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.buckets)) {
    return null
  }
  const buckets: UsageBucket[] = []
  for (const item of r.buckets) {
    if (item != null && typeof item === "object") {
      const bucket = decodeBucket(item as Record<string, unknown>)
      if (bucket != null) {
        buckets.push(bucket)
      }
    }
  }
  const sessions: UsageSession[] = []
  if (Array.isArray(r.sessions)) {
    for (const item of r.sessions) {
      if (item != null && typeof item === "object") {
        const session = decodeSession(item as Record<string, unknown>)
        if (session != null) {
          sessions.push(session)
        }
      }
    }
  }
  return {
    buckets,
    sessions,
    hasAnyData: r.hasAnyData === true || buckets.length > 0,
  }
}

export function formatDateParam(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function monthStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function windowStart(now: Date, days: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
}

function timeZoneName(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return typeof tz === "string" && tz.length > 0 ? tz : null
  } catch {
    return null
  }
}

export function buildUsageUrl(days: number, includeMonth: boolean, now: Date): string {
  const params: string[] = []
  const winStart = windowStart(now, days)
  const monStart = monthStart(now)
  if (includeMonth && monStart.getTime() < winStart.getTime()) {
    params.push(`from=${formatDateParam(monStart)}`)
    params.push(`to=${formatDateParam(now)}`)
  } else {
    params.push(`days=${days}`)
  }
  const tz = timeZoneName()
  if (tz != null) {
    params.push(`tz=${encodeURIComponent(tz)}`)
  }
  return `${BASE_URL}?${params.join("&")}`
}

export async function fetchUsage(
  apiKey: string,
  days: number,
  includeMonth: boolean,
): Promise<FetchResult> {
  let response: Response
  try {
    response = await fetch(buildUsageUrl(days, includeMonth, new Date()), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      timeout: FETCH_TIMEOUT_SECONDS,
      debugLabel: "vibe-usage-fetch",
    })
  } catch {
    return { ok: false, error: "network" }
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, error: "unauthorized" }
  }
  if (!response.ok) {
    return { ok: false, error: "network" }
  }
  try {
    const payload = decodePayload(await response.json())
    if (payload == null) {
      return { ok: false, error: "invalid" }
    }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: "invalid" }
  }
}

import { UsageBucket, UsagePayload, UsageSession } from "./types"

// Deterministic pseudo-random data so previews look stable.
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

const SOURCES = ["claude-code", "codex", "cursor", "gemini-cli"]
const MODELS = ["claude-opus-4", "claude-sonnet-5", "gpt-5.2-codex", "gemini-2.5-pro"]
const PROJECTS = ["vibe-monitor", "essay-tools", "data-pipeline", "dotfiles"]

export function mockPayload(days: number, now: Date = new Date()): UsagePayload {
  const rand = seeded(42)
  const buckets: UsageBucket[] = []
  const sessions: UsageSession[] = []
  const totalDays = Math.max(days, now.getDate())

  for (let d = 0; d < totalDays; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d)
    const intensity = 0.35 + rand() * 0.65
    const slots = 2 + Math.floor(rand() * 4)
    for (let s = 0; s < slots; s++) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9 + s * 2, rand() > 0.5 ? 30 : 0)
      const source = SOURCES[Math.floor(rand() * SOURCES.length)]
      const model = MODELS[Math.floor(rand() * MODELS.length)]
      const project = PROJECTS[Math.floor(rand() * PROJECTS.length)]
      const input = Math.floor(rand() * 120_000 * intensity)
      const output = Math.floor(rand() * 60_000 * intensity)
      const reasoning = Math.floor(rand() * 25_000 * intensity)
      const cached = Math.floor(rand() * 900_000 * intensity)
      buckets.push({
        source, model, project,
        hostname: "MacBook-Pro",
        bucketStart: start.toISOString(),
        inputTokens: input,
        outputTokens: output,
        cachedInputTokens: cached,
        reasoningOutputTokens: reasoning,
        totalTokens: input + output + reasoning,
        estimatedCost: (input * 3 + output * 15 + reasoning * 15 + cached * 0.3) / 1_000_000,
      })
    }
    const active = Math.floor((1800 + rand() * 7200) * intensity)
    sessions.push({
      source: SOURCES[Math.floor(rand() * SOURCES.length)],
      project: PROJECTS[Math.floor(rand() * PROJECTS.length)],
      hostname: "MacBook-Pro",
      firstMessageAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(),
      lastMessageAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 18).toISOString(),
      durationSeconds: active * 3,
      activeSeconds: active,
      messageCount: 20 + Math.floor(rand() * 80),
      userMessageCount: 5 + Math.floor(rand() * 20),
    })
  }
  return { buckets, sessions, hasAnyData: true }
}

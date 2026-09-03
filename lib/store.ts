import { CacheEntry } from "./types"
import { Settings, sanitizeSettings } from "./settings"

const KEY_SETTINGS = "vum.settings"
const KEY_API = "vum.apiKey"
const CACHE_PREFIX = "vum.cache.v1."

export function getStoredSettings(): Partial<Settings> {
  return sanitizeSettings(Storage.get<Partial<Settings>>(KEY_SETTINGS))
}

export function saveSettings(settings: Partial<Settings>) {
  Storage.set(KEY_SETTINGS, settings)
}

export function getApiKey(): string | null {
  return Keychain.get(KEY_API)
}

export function setApiKey(key: string): boolean {
  return Keychain.set(KEY_API, key, {
    accessibility: "first_unlock",
  })
}

export function removeApiKey() {
  Keychain.remove(KEY_API)
}

function cacheKey(days: number, coversMonth: boolean): string {
  return `${CACHE_PREFIX}${days}.${coversMonth ? "m" : "w"}`
}

export function getCache(days: number, coversMonth: boolean): CacheEntry | null {
  const entry = Storage.get<CacheEntry>(cacheKey(days, coversMonth))
  if (
    entry == null
    || typeof entry.fetchedAt !== "number"
    || entry.payload == null
    || !Array.isArray(entry.payload.buckets)
  ) {
    return null
  }
  return entry
}

// Any cached window that covers the requested one is an acceptable fallback.
export function getAnyCache(days: number): CacheEntry | null {
  return getCache(days, true)
    ?? getCache(days, false)
    ?? null
}

export function setCache(entry: CacheEntry) {
  Storage.set(cacheKey(entry.days, entry.coversMonth), entry)
}

export function clearCaches() {
  for (const key of Storage.keys()) {
    if (key.startsWith(CACHE_PREFIX)) {
      Storage.remove(key)
    }
  }
}

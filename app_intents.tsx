import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"
import { fetchUsage } from "./api"
import { DEFAULT_SETTINGS } from "./settings"
import { getApiKey, getStoredSettings, setCache } from "./store"

async function refresh(daysParam?: number, includeMonthParam?: boolean) {
  const settings = { ...DEFAULT_SETTINGS, ...getStoredSettings() }
  const days = daysParam ?? settings.days
  const includeMonth = includeMonthParam ?? settings.showForecast
  const apiKey = getApiKey()
  if (apiKey != null && apiKey.length > 0) {
    const result = await fetchUsage(apiKey, days, includeMonth)
    if (result.ok && result.payload != null) {
      setCache({
        payload: result.payload,
        fetchedAt: Date.now(),
        days,
        coversMonth: includeMonth,
      })
    }
  }
  Widget.reloadAll()
}

// Refresh button on medium and large widgets. The parameter is a JSON string
// produced by the widget itself so a preset widget refreshes its own window.
export const RefreshUsageIntent = AppIntentManager.register({
  name: "RefreshUsageIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (params: string | undefined) => {
    let days: number | undefined
    let includeMonth: boolean | undefined
    if (typeof params === "string" && params.length > 0) {
      try {
        const parsed = JSON.parse(params) as { d?: number; m?: boolean }
        if (typeof parsed.d === "number") days = parsed.d
        if (typeof parsed.m === "boolean") includeMonth = parsed.m
      } catch {
        // fall back to stored settings
      }
    }
    await refresh(days, includeMonth)
  }
})

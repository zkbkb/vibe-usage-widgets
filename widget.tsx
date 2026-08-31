import { Device, HStack, Text, VirtualNode, VStack, Widget } from "scripting"
import { fetchUsage } from "./api"
import { computeAggregates } from "./aggregate"
import { formatCost, formatTokens } from "./format"
import { getL10n, L10nMap } from "./l10n"
import { mockPayload } from "./mock"
import { resolveConfig, ResolvedConfig } from "./settings"
import { getAnyCache, getApiKey, getStoredSettings, setCache } from "./store"
import { makeTheme, Theme } from "./theme"
import { DataStatus, FetchError, UsagePayload } from "./types"
import { MessageView, WidgetData } from "./views/shared"
import { SmallWidget } from "./views/small"
import { MediumWidget } from "./views/medium"
import { LargeWidget } from "./views/large"

const FRESH_WINDOW_MS = 15 * 60 * 1000
const RELOAD_OK_MINUTES = 30
const RELOAD_RETRY_MINUTES = 10

function resolveLanguage(config: ResolvedConfig): string {
  if (config.language !== "system") {
    return config.language
  }
  const preferred = Device.preferredLanguages
  return Array.isArray(preferred) && preferred.length > 0 ? preferred[0] : "en"
}

function Chrome({ theme, children }: { theme: Theme; children: VirtualNode }) {
  return <VStack
    padding={12}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    widgetBackground={theme.bg}
  >
    {children}
  </VStack>
}

function errorView(theme: Theme, l10n: L10nMap, error: FetchError | "noKey" | "noData"): VirtualNode {
  if (error === "noKey") {
    return <MessageView theme={theme} icon={"key.fill"} iconColour={theme.amber} title={l10n.errNoKey} hint={l10n.errNoKeyHint} />
  }
  if (error === "unauthorized") {
    return <MessageView theme={theme} icon={"exclamationmark.lock.fill"} iconColour={theme.amber} title={l10n.errUnauthorized} hint={l10n.errUnauthorizedHint} />
  }
  if (error === "noData") {
    return <MessageView theme={theme} icon={"tray"} iconColour={theme.secondary} title={l10n.errNoData} hint={l10n.errNoDataHint} />
  }
  return <MessageView theme={theme} icon={"wifi.slash"} iconColour={theme.secondary} title={l10n.errNetwork} hint={l10n.errNetworkHint} />
}

function AccessoryView({ data }: { data: WidgetData }) {
  const { agg, config, lang } = data
  return <VStack spacing={1} alignment={"leading"}>
    <Text font={15} fontWeight={"bold"} monospacedDigit widgetAccentable>
      {formatTokens(agg.totals.displayed, lang, config.privacyMode)}
    </Text>
    <HStack spacing={4}>
      <Text font={11} monospacedDigit>
        {formatCost(agg.totals.cost, config.currency, config.privacyMode)}
      </Text>
    </HStack>
  </VStack>
}

function pickView(data: WidgetData): VirtualNode {
  const family = Widget.family
  if (family === "systemSmall") {
    return <SmallWidget data={data} />
  }
  if (family === "systemLarge" || family === "systemExtraLarge") {
    return <LargeWidget data={data} />
  }
  if (typeof family === "string" && family.startsWith("accessory")) {
    return <AccessoryView data={data} />
  }
  return <MediumWidget data={data} />
}

function present(element: VirtualNode, retryMinutes: number) {
  Widget.present(element, {
    policy: "after",
    date: new Date(Date.now() + retryMinutes * 60 * 1000),
  })
}

async function main() {
  const config = resolveConfig(getStoredSettings(), Widget.parameter)
  const lang = resolveLanguage(config)
  const l10n = getL10n(lang)
  const theme = makeTheme(config.theme, config.accent)

  let payload: UsagePayload | null = null
  let status: DataStatus = { kind: "fresh", fetchedAt: Date.now() }
  let retryMinutes = RELOAD_OK_MINUTES
  let coversMonth = false

  if (config.mock) {
    payload = mockPayload(config.days)
    coversMonth = true
  } else {
    const cache = getAnyCache(config.days)
    const apiKey = getApiKey()

    if (apiKey == null || apiKey.length === 0) {
      if (cache != null) {
        payload = cache.payload
        coversMonth = cache.coversMonth
        status = { kind: "stale", fetchedAt: cache.fetchedAt }
        retryMinutes = RELOAD_RETRY_MINUTES
      } else {
        present(<Chrome theme={theme}>{errorView(theme, l10n, "noKey")}</Chrome>, RELOAD_OK_MINUTES)
        return
      }
    } else if (cache != null && Date.now() - cache.fetchedAt < FRESH_WINDOW_MS) {
      payload = cache.payload
      coversMonth = cache.coversMonth
      status = { kind: "fresh", fetchedAt: cache.fetchedAt }
    } else {
      const result = await fetchUsage(apiKey, config.days, config.showForecast)
      if (result.ok && result.payload != null) {
        payload = result.payload
        coversMonth = config.showForecast
        status = { kind: "fresh", fetchedAt: Date.now() }
        setCache({
          payload: result.payload,
          fetchedAt: Date.now(),
          days: config.days,
          coversMonth: config.showForecast,
        })
      } else if (cache != null) {
        payload = cache.payload
        coversMonth = cache.coversMonth
        status = { kind: "stale", fetchedAt: cache.fetchedAt }
        retryMinutes = RELOAD_RETRY_MINUTES
      } else {
        present(
          <Chrome theme={theme}>{errorView(theme, l10n, result.error ?? "network")}</Chrome>,
          RELOAD_RETRY_MINUTES,
        )
        return
      }
    }
  }

  if (payload == null || (!payload.hasAnyData && payload.buckets.length === 0)) {
    present(<Chrome theme={theme}>{errorView(theme, l10n, "noData")}</Chrome>, RELOAD_OK_MINUTES)
    return
  }

  const agg = computeAggregates(payload, {
    days: config.days,
    sortKey: config.sortKey,
    forecast: config.showForecast,
    coversMonth,
    otherLabel: l10n.other,
  })

  const data: WidgetData = { agg, config, theme, l10n, lang, status }
  present(pickView(data), retryMinutes)
}

main()

import { HStack, RoundedRectangle, Text, VStack } from "scripting"
import { computeAggregates } from "./lib/aggregate"
import { getL10n } from "./l10n"
import { mockPayload } from "./lib/mock"
import { ChartStyle, PeakTag, resolveConfig, SortKey, ThemeMode, ViewKind } from "./lib/settings"
import { makeTheme } from "./lib/theme"
import { WidgetData } from "./views/shared"
import { SmallWidget } from "./views/small"
import { MediumWidget } from "./views/medium"
import { LargeWidget } from "./views/large"

type PreviewFamily = "systemSmall" | "systemMedium" | "systemLarge"

const SIZES: Record<PreviewFamily, { w: number; h: number }> = {
  systemSmall: { w: 170, h: 170 },
  systemMedium: { w: 360, h: 170 },
  systemLarge: { w: 360, h: 360 },
}

interface PreviewProps {
  family?: PreviewFamily
  view?: ViewKind
  mode?: ThemeMode
  lang?: string
  days?: number
  chartStyle?: ChartStyle
  peakTag?: PeakTag
  sort?: SortKey
  spike?: string
}

export default function Preview(props: PreviewProps) {
  const family = props.family ?? "systemMedium"
  const view = props.view ?? "overview"
  const mode = props.mode === "light" ? "light" : "dark"
  const lang = props.lang ?? "zh"
  const days = props.days ?? 14
  const chartStyle = props.chartStyle ?? "stacked"
  const peakTag = props.peakTag ?? "badge"
  const sort = props.sort ?? "tokens"
  const size = SIZES[family] ?? SIZES.systemMedium

  const config = resolveConfig(
    null,
    JSON.stringify({ view, days, chartStyle, peakTag, sort, mock: true }),
  )
  const l10n = getL10n(lang)
  const theme = makeTheme(mode)
  const payload = mockPayload(config.days)

  if (props.spike === "1") {
    // Inflate one day ~30x to verify outlier (sqrt) softening.
    const spikeDay = payload
      .buckets[Math.floor(payload.buckets.length / 2)].bucketStart.slice(0, 10)
    for (const bucket of payload.buckets) {
      if (bucket.bucketStart.startsWith(spikeDay)) {
        bucket.inputTokens *= 30
        bucket.outputTokens *= 30
        bucket.cachedInputTokens *= 30
        bucket.reasoningOutputTokens *= 30
      }
    }
    for (const session of payload.sessions) {
      if (session.lastMessageAt.startsWith(spikeDay)) {
        session.activeSeconds *= 30
      }
    }
  }

  const agg = computeAggregates(payload, {
    days: config.days,
    sortKey: config.sortKey,
    forecast: config.showForecast,
    coversMonth: true,
    otherLabel: l10n.other,
  })
  const data: WidgetData = {
    agg,
    config,
    theme,
    l10n,
    lang,
    status: { kind: "fresh", fetchedAt: Date.now() },
  }

  const widget = family === "systemSmall"
    ? <SmallWidget data={data} />
    : family === "systemLarge"
      ? <LargeWidget data={data} />
      : <MediumWidget data={data} />

  return <VStack
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    background={mode === "dark" ? "#2C2C2E" : "#E9E9EE"}
    spacing={8}
  >
    <Text
      font={12}
      foregroundStyle={"secondaryLabel"}
    >{`${family} · ${view} · ${mode}`}</Text>
    <HStack
      frame={{ width: size.w, height: size.h }}
      background={
        <RoundedRectangle
          cornerRadius={22}
          fill={mode === "dark" ? "#0A0A0C" : "#FFFFFF"}
        />
      }
      clipShape={{ type: "rect", cornerRadius: 22 }}
    >
      {widget}
    </HStack>
  </VStack>
}

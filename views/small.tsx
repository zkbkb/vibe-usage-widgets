import { HStack, Spacer, Text, VStack } from "scripting"
import { formatCost, formatDuration, formatPercent, formatTokens } from "../format"
import { MiniBars } from "./charts"
import { WidgetData, WidgetHeader } from "./shared"

export function SmallWidget({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang, status } = data
  const privacy = config.privacyMode
  const miniValues = agg.byDay.slice(-7).map(row => row.total)

  return <VStack
    alignment={"leading"}
    spacing={3}
    padding={12}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    widgetBackground={theme.bg}
  >
    <WidgetHeader
      theme={theme}
      l10n={l10n}
      status={status}
      showRefresh={false}
      compact
    />
    <Spacer />
    <Text
      font={24}
      fontWeight={"bold"}
      monospacedDigit
      foregroundStyle={theme.text}
      lineLimit={1}
      minScaleFactor={0.5}
      widgetAccentable
    >{formatTokens(agg.totals.displayed, lang, privacy)}</Text>
    <HStack spacing={4} alignment={"firstTextBaseline"}>
      <Text
        font={13}
        fontWeight={"semibold"}
        monospacedDigit
        foregroundStyle={theme.green}
        lineLimit={1}
      >{formatCost(agg.totals.cost, config.currency, privacy)}</Text>
      {agg.forecastMonthUsd != null
        ? <Text
          font={10}
          monospacedDigit
          foregroundStyle={theme.tertiary}
          lineLimit={1}
        >{`↗ ${formatCost(agg.forecastMonthUsd, config.currency, privacy)}`}</Text>
        : null}
    </HStack>
    <MiniBars
      theme={theme}
      values={miniValues}
      height={20}
      colour={theme.accent}
    />
    <HStack spacing={4} font={10}>
      <Text
        font={10}
        monospacedDigit
        foregroundStyle={theme.blue}
      >{formatDuration(agg.sessionStats.activeSec, lang)}</Text>
      <Text font={10} foregroundStyle={theme.tertiary}>·</Text>
      <Text
        font={10}
        monospacedDigit
        foregroundStyle={theme.secondary}
      >{`${formatPercent(agg.totals.cacheRatio)} ${l10n.cached}`}</Text>
    </HStack>
  </VStack>
}

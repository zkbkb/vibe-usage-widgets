import { HStack, Spacer, Text, VirtualNode, VStack } from "scripting"
import {
  formatCost,
  formatCount,
  formatDuration,
  formatPercent,
  formatTokens,
  shortModelName,
} from "../format"
import { rankColour } from "../theme"
import { PillBar, TrendBars, TrendLine } from "./charts"
import { viewShortTitle, WidgetData, WidgetHeader } from "./shared"

function Root({
  data,
  children,
}: {
  data: WidgetData
  children: VirtualNode
}) {
  const { theme, l10n, config, status } = data
  return <VStack
    alignment={"leading"}
    spacing={4}
    padding={12}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    widgetBackground={theme.forcedBg ?? undefined}
  >
    <WidgetHeader
      theme={theme}
      title={viewShortTitle(config.view, l10n)}
      status={status}
      showRefresh={false}
      compact
      windowText={l10n.daysWindow(config.days)}
    />
    {children}
  </VStack>
}

function OverviewContent({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  const miniValues = agg.byDay.slice(-7).map(row => row.total)
  return <VStack
    alignment={"leading"}
    spacing={4}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
  >
    <Spacer />
    <Text
      font={26}
      fontWeight={"bold"}
      monospacedDigit
      foregroundStyle={theme.text}
      lineLimit={1}
      minScaleFactor={0.5}
      widgetAccentable
    >{formatTokens(agg.totals.displayed)}</Text>
    <HStack spacing={5} alignment={"firstTextBaseline"}>
      <Text
        font={13}
        fontWeight={"semibold"}
        monospacedDigit
        foregroundStyle={theme.green}
        lineLimit={1}
      >{formatCost(agg.totals.cost, config.currency)}</Text>
      {agg.forecastMonthUsd != null
        ? <Text
          font={9.5}
          monospacedDigit
          foregroundStyle={theme.tertiary}
          lineLimit={1}
        >{`↗ ${formatCost(agg.forecastMonthUsd, config.currency)}`}</Text>
        : null}
    </HStack>
    <VStack frame={{ maxWidth: "infinity", height: 26 }}>
      <TrendLine
        theme={theme}
        values={miniValues}
        colour={theme.green}
        gridRows={0}
        endDot
        areaStyle={"gradient"}
      />
    </VStack>
    <HStack spacing={4}>
      <Text
        font={9.5}
        monospacedDigit
        foregroundStyle={theme.blue}
        lineLimit={1}
      >{formatDuration(agg.sessionStats.activeSec, lang)}</Text>
      <Text font={9.5} foregroundStyle={theme.tertiary}>{"·"}</Text>
      <Text
        font={9.5}
        monospacedDigit
        foregroundStyle={theme.secondary}
        lineLimit={1}
      >{`${formatPercent(agg.totals.cacheRatio)} ${l10n.cached}`}</Text>
    </HStack>
  </VStack>
}

function ModelsContent({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n } = data
  const shown = agg.byModel.slice(0, 3)
  return <VStack
    alignment={"leading"}
    spacing={6}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
  >
    <Spacer />
    {shown.map((item, index) => <VStack spacing={3} frame={{ maxWidth: "infinity" }}>
      <HStack spacing={5}>
        <Text
          font={10.5}
          fontWeight={"medium"}
          foregroundStyle={theme.text}
          lineLimit={1}
          minScaleFactor={0.8}
        >{shortModelName(item.name)}</Text>
        <Spacer />
        <Text
          font={10}
          fontWeight={"semibold"}
          monospacedDigit
          foregroundStyle={rankColour(index, item.name === l10n.other)}
        >{formatPercent(item.share)}</Text>
      </HStack>
      <PillBar
        theme={theme}
        share={item.share}
        colour={rankColour(index, item.name === l10n.other)}
        height={3.5}
      />
    </VStack>)}
    <Spacer />
    <HStack spacing={4} alignment={"firstTextBaseline"}>
      <Text
        font={10}
        fontWeight={"semibold"}
        monospacedDigit
        foregroundStyle={theme.text}
        lineLimit={1}
      >{formatTokens(agg.totals.displayed)}</Text>
      <Text font={9.5} foregroundStyle={theme.tertiary}>{"·"}</Text>
      <Text
        font={9.5}
        monospacedDigit
        foregroundStyle={theme.green}
        lineLimit={1}
      >{formatCost(agg.totals.cost, config.currency)}</Text>
    </HStack>
  </VStack>
}

function ActiveContent({ data }: { data: WidgetData }) {
  const { agg, theme, l10n, lang } = data
  const miniValues = agg.byDay.slice(-7).map(row => row.activeSec)
  return <VStack
    alignment={"leading"}
    spacing={4}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
  >
    <Spacer />
    <Text
      font={24}
      fontWeight={"bold"}
      monospacedDigit
      foregroundStyle={theme.blue}
      lineLimit={1}
      minScaleFactor={0.5}
      widgetAccentable
    >{formatDuration(agg.sessionStats.activeSec, lang)}</Text>
    <Text
      font={9.5}
      monospacedDigit
      foregroundStyle={theme.tertiary}
      lineLimit={1}
    >{`${formatCount(agg.sessionStats.count)} ${l10n.sessions}`}</Text>
    <VStack frame={{ maxWidth: "infinity", height: 22 }}>
      <TrendBars theme={theme} values={miniValues} colour={theme.blue} />
    </VStack>
    <HStack spacing={4}>
      <Text
        font={9.5}
        monospacedDigit
        foregroundStyle={theme.secondary}
        lineLimit={1}
      >{`${formatCount(agg.sessionStats.messages)} ${l10n.messages}`}</Text>
      <Text font={9.5} foregroundStyle={theme.tertiary}>{"·"}</Text>
      <Text
        font={9.5}
        monospacedDigit
        foregroundStyle={theme.secondary}
        lineLimit={1}
      >{`${formatCount(agg.sessionStats.userMessages)} ${l10n.userMessages}`}</Text>
    </HStack>
  </VStack>
}

export function SmallWidget({ data }: { data: WidgetData }) {
  const { config } = data
  return <Root data={data}>
    {config.view === "models"
      ? <ModelsContent data={data} />
      : config.view === "active"
        ? <ActiveContent data={data} />
        : <OverviewContent data={data} />}
  </Root>
}

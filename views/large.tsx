import { HStack, Spacer, Text, VirtualNode, VStack } from "scripting"
import {
  formatCost,
  formatCount,
  formatDuration,
  formatPercent,
  formatTokens,
  shortModelName,
} from "../lib/format"
import { rankColour, Style, Theme } from "../lib/theme"
import { DayRow, RankItem } from "../lib/types"
import { DonutRing, MultiLines, StackedAreaChart, TrendBars } from "./charts"
import {
  chartRowsOf,
  compositionOf,
  CompositionLegend,
  FooterLine,
  RankRow,
  refreshParamFor,
  viewTitle,
  WidgetData,
  WidgetHeader,
} from "./shared"

function SectionTitle({ theme, text }: { theme: Theme; text: string }) {
  return <Text
    font={10}
    fontWeight={"medium"}
    foregroundStyle={theme.secondary}
  >{text}</Text>
}

function HeroStat({
  theme,
  label,
  value,
  valueColour,
}: {
  theme: Theme
  label: string
  value: string
  valueColour?: Style
}) {
  return <VStack alignment={"trailing"} spacing={1}>
    <Text
      font={14}
      fontWeight={"semibold"}
      monospacedDigit
      foregroundStyle={valueColour ?? theme.text}
      lineLimit={1}
      minScaleFactor={0.6}
    >{value}</Text>
    <Text
      font={8.5}
      foregroundStyle={theme.tertiary}
      lineLimit={1}
      minScaleFactor={0.75}
    >{label}</Text>
  </VStack>
}

// Shared top band: one bold anchor metric plus 2–3 trailing mini stats.
// Same type scale across all views; the anchor metric differs per view.
function HeroBand({
  data,
  label,
  heroValue,
  heroColour,
  sub,
  stats,
}: {
  data: WidgetData
  label: string
  heroValue: string
  heroColour?: Style
  sub?: VirtualNode | null
  stats: { label: string; value: string; colour?: Style }[]
}) {
  const { theme } = data
  return <HStack spacing={14} frame={{ maxWidth: "infinity" }}>
    <VStack alignment={"leading"} spacing={2}>
      <Text
        font={10}
        foregroundStyle={theme.secondary}
        lineLimit={1}
      >{label}</Text>
      <Text
        font={30}
        fontWeight={"bold"}
        monospacedDigit
        foregroundStyle={heroColour ?? theme.text}
        lineLimit={1}
        minScaleFactor={0.55}
        widgetAccentable
      >{heroValue}</Text>
      {sub ?? null}
    </VStack>
    <Spacer />
    <HStack spacing={16}>
      {stats.map((stat) => <HeroStat
        theme={theme}
        label={stat.label}
        value={stat.value}
        valueColour={stat.colour}
      />)}
    </HStack>
  </HStack>
}

function CostSub({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n } = data
  return <HStack spacing={5} alignment={"firstTextBaseline"}>
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
      >{`↗ ${formatCost(agg.forecastMonthUsd, config.currency)} / ${l10n.forecast}`}</Text>
      : null}
  </HStack>
}

function rankValue(item: RankItem, data: WidgetData): string {
  const { config } = data
  return config.sortKey === "cost"
    ? formatCost(item.cost, config.currency)
    : formatTokens(item.tokens)
}

function RankList({
  data,
  items,
  maxRows,
  shortenName,
}: {
  data: WidgetData
  items: RankItem[]
  maxRows: number
  shortenName: boolean
}) {
  const { theme, l10n } = data
  return <VStack spacing={6} frame={{ maxWidth: "infinity" }}>
    {items.slice(0, maxRows).map((item, index) => <RankRow
      theme={theme}
      item={shortenName ? { ...item, name: shortModelName(item.name) } : item}
      colour={rankColour(index, item.name === l10n.other)}
      valueText={rankValue(item, data)}
      shareText={formatPercent(item.share)}
    />)}
  </VStack>
}

function dayLabels(rows: DayRow[]): (number | null)[] {
  return rows.map((row, index) => (index % 2 === 0 ? row.dayOfMonth : null))
}

export function LargeWidget({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  let hero: VirtualNode
  let section: VirtualNode

  if (config.view === "models") {
    const top = agg.byModel[0]
    hero = <HeroBand
      data={data}
      label={l10n.totalTokens}
      heroValue={formatTokens(agg.totals.displayed)}
      sub={<CostSub data={data} />}
      stats={[
        ...(top != null
          ? [{ label: "Top 1", value: formatPercent(top.share), colour: rankColour(0, false) }]
          : []),
        { label: l10n.cacheRatio, value: formatPercent(agg.totals.cacheRatio) },
      ]}
    />
    const modelSegments = agg.byModel.map((item, index) => ({
      share: item.share,
      colour: rankColour(index, item.name === l10n.other),
    }))
    section = <VStack alignment={"leading"} spacing={10} frame={{ maxWidth: "infinity" }}>
      <SectionTitle theme={theme} text={l10n.topModels} />
      <HStack spacing={16} padding={{ leading: 10, trailing: 6 }} alignment={"center"}>
        <DonutRing
          theme={theme}
          segments={modelSegments}
          size={102}
          lineWidth={11}
          centreLabel={config.sortKey === "cost" ? l10n.cost : l10n.totalTokens}
          centreValue={config.sortKey === "cost"
            ? formatCost(agg.totals.cost, config.currency)
            : formatTokens(agg.totals.displayed)}
          centreSubValue={config.sortKey === "cost"
            ? formatTokens(agg.totals.displayed)
            : formatCost(agg.totals.cost, config.currency)}
        />
        <RankList data={data} items={agg.byModel} maxRows={5} shortenName />
      </HStack>
    </VStack>
  } else if (config.view === "active") {
    hero = <HeroBand
      data={data}
      label={l10n.activeTime}
      heroValue={formatDuration(agg.sessionStats.activeSec, lang)}
      heroColour={theme.blue}
      sub={<Text
        font={10}
        monospacedDigit
        foregroundStyle={theme.tertiary}
        lineLimit={1}
      >{`${l10n.totalDuration} ${formatDuration(agg.sessionStats.durationSec, lang)}`}</Text>}
      stats={[
        { label: l10n.messages, value: formatCount(agg.sessionStats.messages) },
        { label: l10n.userMessages, value: formatCount(agg.sessionStats.userMessages) },
        { label: l10n.sessions, value: formatCount(agg.sessionStats.count) },
      ]}
    />
    const days = agg.byDay.slice(-14)
    section = <VStack
      alignment={"leading"}
      spacing={8}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    >
      <SectionTitle theme={theme} text={l10n.activityPulse} />
      <TrendBars
        theme={theme}
        values={days.map(row => row.activeSec)}
        colour={theme.blue}
        labels={dayLabels(days)}
      />
    </VStack>
  } else {
    hero = <HeroBand
      data={data}
      label={l10n.totalTokens}
      heroValue={formatTokens(agg.totals.displayed)}
      sub={<CostSub data={data} />}
      stats={[
        { label: l10n.cacheRatio, value: formatPercent(agg.totals.cacheRatio) },
        { label: l10n.activeTime, value: formatDuration(agg.sessionStats.activeSec, lang), colour: theme.blue },
      ]}
    />
    const isCost = config.sortKey === "cost"
    const chartRows = chartRowsOf(data, 14)
    const compItems = compositionOf(data)
    const valueFormatter = (v: number) =>
      isCost ? formatCost(v, config.currency) : formatTokens(v)
    let chartView: VirtualNode
    if (config.chartStyle === "multilines") {
      chartView = <MultiLines
        theme={theme}
        rows={chartRows}
        labels={dayLabels(chartRows)}
        peakTag={config.peakTag}
        valueFormatter={valueFormatter}
      />
    } else {
      // Default: Log-stacked area with clear purple reasoning line & peak callout
      chartView = <StackedAreaChart
        theme={theme}
        rows={chartRows}
        labels={dayLabels(chartRows)}
        peakTag={config.peakTag}
        valueFormatter={valueFormatter}
      />
    }
    section = <VStack alignment={"leading"} spacing={8} frame={{ maxWidth: "infinity" }}>
      <HStack frame={{ maxWidth: "infinity" }}>
        <SectionTitle theme={theme} text={l10n.dailyTrend} />
        <Spacer />
        <CompositionLegend theme={theme} items={compItems} />
      </HStack>
      <VStack frame={{ maxWidth: "infinity", height: 78 }}>
        {chartView}
      </VStack>
      <SectionTitle theme={theme} text={l10n.topAgents} />
      <RankList data={data} items={agg.bySource} maxRows={3} shortenName={false} />
    </VStack>
  }

  const summary = config.view === "active"
    ? [
      `${formatTokens(agg.totals.displayed)} ${l10n.totalTokens}`,
      formatCost(agg.totals.cost, config.currency),
      `${formatPercent(agg.totals.cacheRatio)} ${l10n.cached}`,
    ].join(" · ")
    : [
      `${formatCount(agg.sessionStats.count)} ${l10n.sessions}`,
      `${formatCount(agg.sessionStats.messages)} ${l10n.messages}`,
      `${formatCount(agg.sessionStats.userMessages)} ${l10n.userMessages}`,
    ].join(" · ")

  return <VStack
    alignment={"leading"}
    spacing={8}
    padding={13}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    widgetBackground={theme.forcedBg ?? undefined}
  >
    <WidgetHeader
      theme={theme}
      title={viewTitle(config.view, l10n)}
      status={data.status}
      showRefresh
      refreshParam={refreshParamFor(config)}
      windowText={l10n.daysWindow(config.days)}
    />
    {hero}
    {config.view === "models" ? <Spacer /> : null}
    {section}
    <Spacer />
    <FooterLine theme={theme} l10n={l10n} summary={summary} status={data.status} />
  </VStack>
}

import { HStack, Spacer, VirtualNode, VStack } from "scripting"
import {
  formatCost,
  formatCount,
  formatDuration,
  formatPercent,
  formatTokens,
  shortModelName,
} from "../format"
import { rankColour } from "../theme"
import { RankItem } from "../types"
import { DonutRing, MultiLines, StackedAreaChart, TrendBars } from "./charts"
import {
  chartRowsOf,
  compositionOf,
  CompositionLegend,
  RankRow,
  refreshParamFor,
  viewTitle,
  StatCell,
  WidgetData,
  WidgetHeader,
} from "./shared"

function rankValue(item: RankItem, data: WidgetData): string {
  const { config } = data
  return config.sortKey === "cost"
    ? formatCost(item.cost, config.currency)
    : formatTokens(item.tokens)
}

function ModelsContent({ data }: { data: WidgetData }) {
  const { theme, l10n, agg, config } = data
  const shown = agg.byModel.slice(0, 3)
  const segments = shown.map((item, index) => ({
    share: item.share,
    colour: rankColour(index, item.name === l10n.other),
  }))
  return <HStack
    spacing={16}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    padding={{ leading: 8, trailing: 6, top: 2, bottom: 2 }}
    alignment={"center"}
  >
    <DonutRing
      theme={theme}
      segments={segments}
      size={68}
      lineWidth={9}
      centreLabel={config.sortKey === "cost" ? l10n.cost : l10n.totalTokens}
      centreValue={config.sortKey === "cost"
        ? formatCost(agg.totals.cost, config.currency)
        : formatTokens(agg.totals.displayed)}
      centreSubValue={config.sortKey === "cost"
        ? formatTokens(agg.totals.displayed)
        : formatCost(agg.totals.cost, config.currency)}
    />
    <VStack spacing={6} frame={{ maxWidth: "infinity" }}>
      {shown.map((item, index) => <RankRow
        theme={theme}
        item={{ ...item, name: shortModelName(item.name) }}
        colour={rankColour(index, item.name === l10n.other)}
        valueText={rankValue(item, data)}
        shareText={formatPercent(item.share)}
        barHeight={3}
      />)}
    </VStack>
  </HStack>
}

export function MediumWidget({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  let content: VirtualNode
  if (config.view === "active") {
    content = <VStack spacing={8} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <HStack spacing={8}>
        <StatCell
          theme={theme}
          label={l10n.sessions}
          value={formatCount(agg.sessionStats.count)}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.messages}
          value={formatCount(agg.sessionStats.messages)}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.userMessages}
          value={formatCount(agg.sessionStats.userMessages)}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.activeTime}
          value={formatDuration(agg.sessionStats.activeSec, lang)}
          valueColour={theme.blue}
          valueSize={17}
        />
      </HStack>
      <TrendBars
        theme={theme}
        values={agg.byDay.slice(-14).map(row => row.activeSec)}
        colour={theme.blue}
      />
    </VStack>
  } else if (config.view === "models") {
    content = <ModelsContent data={data} />
  } else {
    const isCost = config.sortKey === "cost"
    const chartRows = chartRowsOf(data, 14)
    const compItems = compositionOf(data)
    const valueFormatter = (v: number) =>
      isCost ? formatCost(v, config.currency) : formatTokens(v)
    let chartNode: VirtualNode
    if (config.chartStyle === "multilines") {
      chartNode = <MultiLines
        theme={theme}
        rows={chartRows}
        peakTag={config.peakTag}
        valueFormatter={valueFormatter}
      />
    } else {
      // Default: Log-stacked area with distinct purple reasoning line & peak callout
      chartNode = <StackedAreaChart
        theme={theme}
        rows={chartRows}
        peakTag={config.peakTag}
        valueFormatter={valueFormatter}
      />
    }
    content = <VStack spacing={6} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <HStack spacing={8}>
        <StatCell
          theme={theme}
          label={l10n.totalTokens}
          value={formatTokens(agg.totals.displayed)}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.cost}
          value={formatCost(agg.totals.cost, config.currency)}
          valueColour={theme.green}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.activeTime}
          value={formatDuration(agg.sessionStats.activeSec, lang)}
          valueColour={theme.blue}
          valueSize={17}
        />
        <StatCell
          theme={theme}
          label={l10n.cacheRatio}
          value={formatPercent(agg.totals.cacheRatio)}
          valueSize={17}
        />
      </HStack>
      {chartNode}
      <HStack frame={{ maxWidth: "infinity" }}>
        <Spacer />
        <CompositionLegend theme={theme} items={compItems} />
        <Spacer />
      </HStack>
    </VStack>
  }

  return <VStack
    alignment={"leading"}
    spacing={8}
    padding={12}
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
    {content}
  </VStack>
}

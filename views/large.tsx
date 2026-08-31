import { HStack, RoundedRectangle, Spacer, Text, VirtualNode, VStack } from "scripting"
import { formatCost, formatCount, formatDuration, formatPercent, formatTokens, shortModelName } from "../format"
import { rankColour, Style, Theme } from "../theme"
import { RankItem } from "../types"
import { DonutRing, StackedBars } from "./charts"
import { Card, RankRow, refreshParamFor, StatCell, UpdatedLine, WidgetData, WidgetHeader } from "./shared"

function SectionTitle({ theme, text }: { theme: Theme; text: string }) {
  return <Text
    font={10}
    fontWeight={"medium"}
    foregroundStyle={theme.secondary}
  >{text}</Text>
}

function LegendDot({ theme, colour, label }: { theme: Theme; colour: Style; label: string }) {
  return <HStack spacing={3}>
    <RoundedRectangle
      cornerRadius={1.5}
      fill={colour}
      frame={{ width: 5, height: 5 }}
    />
    <Text font={8} foregroundStyle={theme.tertiary}>{label}</Text>
  </HStack>
}

function KpiGrid({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  const privacy = config.privacyMode
  return <VStack spacing={6} frame={{ maxWidth: "infinity" }}>
    <HStack spacing={6}>
      <Card theme={theme}>
        <StatCell
          theme={theme}
          label={l10n.totalTokens}
          value={formatTokens(agg.totals.displayed, lang, privacy)}
        />
      </Card>
      <Card theme={theme}>
        <StatCell
          theme={theme}
          label={l10n.cost}
          value={formatCost(agg.totals.cost, config.currency, privacy)}
          valueColour={theme.green}
          sub={agg.forecastMonthUsd != null
            ? `↗ ${formatCost(agg.forecastMonthUsd, config.currency, privacy)} / ${l10n.forecast}`
            : undefined}
        />
      </Card>
    </HStack>
    <HStack spacing={6}>
      <Card theme={theme}>
        <StatCell
          theme={theme}
          label={l10n.activeTime}
          value={formatDuration(agg.sessionStats.activeSec, lang)}
          valueColour={theme.blue}
        />
      </Card>
      <Card theme={theme}>
        <StatCell
          theme={theme}
          label={l10n.cacheRatio}
          value={formatPercent(agg.totals.cacheRatio)}
        />
      </Card>
    </HStack>
  </VStack>
}

function rankValue(item: RankItem, data: WidgetData): string {
  const { config, lang } = data
  return config.sortKey === "cost"
    ? formatCost(item.cost, config.currency, config.privacyMode)
    : formatTokens(item.tokens, lang, config.privacyMode)
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
  return <VStack spacing={5} frame={{ maxWidth: "infinity" }}>
    {items.slice(0, maxRows).map((item, index) =>
      <RankRow
        theme={theme}
        item={shortenName ? { ...item, name: shortModelName(item.name) } : item}
        colour={rankColour(index, item.name === l10n.other)}
        valueText={rankValue(item, data)}
        shareText={formatPercent(item.share)}
      />
    )}
  </VStack>
}

export function LargeWidget({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  const privacy = config.privacyMode

  let section: VirtualNode
  if (config.view === "models") {
    section = <VStack alignment={"leading"} spacing={6} frame={{ maxWidth: "infinity" }}>
      <SectionTitle theme={theme} text={l10n.topModels} />
      <HStack spacing={12}>
        <DonutRing
          theme={theme}
          segments={agg.byModel.map((item, index) => ({
            share: item.share,
            colour: rankColour(index, item.name === l10n.other),
          }))}
          size={72}
          lineWidth={10}
          centreLabel={l10n.totalTokens}
          centreValue={formatTokens(agg.totals.displayed, lang, privacy)}
        />
        <RankList data={data} items={agg.byModel} maxRows={4} shortenName />
      </HStack>
    </VStack>
  } else if (config.view === "projects") {
    section = <VStack alignment={"leading"} spacing={6} frame={{ maxWidth: "infinity" }}>
      <SectionTitle theme={theme} text={l10n.topProjects} />
      <RankList data={data} items={agg.byProject} maxRows={5} shortenName={false} />
    </VStack>
  } else if (config.view === "active") {
    section = <VStack alignment={"leading"} spacing={6} frame={{ maxWidth: "infinity" }}>
      <SectionTitle theme={theme} text={l10n.activityPulse} />
      <StackedBars
        theme={theme}
        rows={agg.byDay.slice(-14)}
        height={44}
        mode={"active"}
        showDayLabels
      />
      <HStack spacing={6}>
        <Card theme={theme}>
          <StatCell theme={theme} label={l10n.sessions} value={formatCount(agg.sessionStats.count, privacy)} valueSize={15} />
        </Card>
        <Card theme={theme}>
          <StatCell theme={theme} label={l10n.messages} value={formatCount(agg.sessionStats.messages, privacy)} valueSize={15} />
        </Card>
        <Card theme={theme}>
          <StatCell theme={theme} label={l10n.userMessages} value={formatCount(agg.sessionStats.userMessages, privacy)} valueSize={15} />
        </Card>
        <Card theme={theme}>
          <StatCell theme={theme} label={l10n.totalDuration} value={formatDuration(agg.sessionStats.durationSec, lang)} valueSize={15} />
        </Card>
      </HStack>
    </VStack>
  } else {
    section = <VStack alignment={"leading"} spacing={6} frame={{ maxWidth: "infinity" }}>
      <HStack>
        <SectionTitle theme={theme} text={l10n.dailyTrend} />
        <Spacer />
        <HStack spacing={6}>
          <LegendDot theme={theme} colour={theme.barOutput} label={l10n.output} />
          <LegendDot theme={theme} colour={theme.barInput} label={l10n.input} />
          <LegendDot theme={theme} colour={theme.barCached} label={l10n.cached} />
        </HStack>
      </HStack>
      <StackedBars
        theme={theme}
        rows={agg.byDay.slice(-14)}
        height={44}
        mode={"tokens"}
        showDayLabels
      />
      <SectionTitle theme={theme} text={l10n.topAgents} />
      <RankList data={data} items={agg.bySource} maxRows={3} shortenName={false} />
    </VStack>
  }

  return <VStack
    alignment={"leading"}
    spacing={8}
    padding={13}
    frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
    widgetBackground={theme.bg}
  >
    <WidgetHeader
      theme={theme}
      l10n={l10n}
      status={data.status}
      showRefresh
      refreshParam={refreshParamFor(config)}
    />
    <KpiGrid data={data} />
    {section}
    <Spacer />
    <HStack spacing={4} font={9} foregroundStyle={theme.tertiary}>
      <Text font={9} monospacedDigit>{`${formatCount(agg.sessionStats.count, privacy)} ${l10n.sessions}`}</Text>
      <Text font={9}>·</Text>
      <Text font={9} monospacedDigit>{`${formatCount(agg.sessionStats.messages, privacy)} ${l10n.messages}`}</Text>
      <Text font={9}>·</Text>
      <Text font={9} monospacedDigit>{`${formatCount(agg.sessionStats.userMessages, privacy)} ${l10n.userMessages}`}</Text>
      <Spacer />
    </HStack>
    <UpdatedLine theme={theme} l10n={l10n} status={data.status} />
  </VStack>
}

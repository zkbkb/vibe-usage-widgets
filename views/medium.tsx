import { HStack, RoundedRectangle, Spacer, Text, VirtualNode, VStack } from "scripting"
import { formatCost, formatDuration, formatCount, formatPercent, formatTokens, shortModelName } from "../format"
import { rankColour } from "../theme"
import { RankItem } from "../types"
import { DonutRing, StackedBars } from "./charts"
import { refreshParamFor, StatCell, WidgetData, WidgetHeader } from "./shared"

function rankValue(item: RankItem, data: WidgetData): string {
  const { config, lang } = data
  return config.sortKey === "cost"
    ? formatCost(item.cost, config.currency, config.privacyMode)
    : formatTokens(item.tokens, lang, config.privacyMode)
}

function CompactRankRow({
  data,
  item,
  index,
  isOther,
  shortenName,
}: {
  data: WidgetData
  item: RankItem
  index: number
  isOther: boolean
  shortenName: boolean
}) {
  const { theme } = data
  return <HStack spacing={5}>
    <RoundedRectangle
      cornerRadius={2}
      fill={rankColour(index, isOther)}
      frame={{ width: 6, height: 6 }}
    />
    <Text
      font={10}
      foregroundStyle={theme.text}
      lineLimit={1}
      minScaleFactor={0.8}
    >{shortenName ? shortModelName(item.name) : item.name}</Text>
    <Spacer />
    <Text
      font={10}
      monospacedDigit
      foregroundStyle={theme.secondary}
    >{rankValue(item, data)}</Text>
    <Text
      font={9}
      monospacedDigit
      foregroundStyle={theme.tertiary}
      frame={{ width: 30, alignment: "trailing" }}
    >{formatPercent(item.share)}</Text>
  </HStack>
}

function DistributionContent({
  data,
  items,
  centreLabel,
  shortenName,
}: {
  data: WidgetData
  items: RankItem[]
  centreLabel: string
  shortenName: boolean
}) {
  const { theme, l10n, lang, config } = data
  const shown = items.slice(0, 4)
  return <HStack spacing={12} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <DonutRing
      theme={theme}
      segments={shown.map((item, index) => ({
        share: item.share,
        colour: rankColour(index, item.name === l10n.other),
      }))}
      size={64}
      lineWidth={9}
      centreLabel={centreLabel}
      centreValue={
        config.sortKey === "cost"
          ? formatCost(data.agg.totals.cost, config.currency, config.privacyMode)
          : formatTokens(data.agg.totals.displayed, lang, config.privacyMode)
      }
    />
    <VStack spacing={4} frame={{ maxWidth: "infinity" }}>
      {shown.map((item, index) =>
        <CompactRankRow
          data={data}
          item={item}
          index={index}
          isOther={item.name === l10n.other}
          shortenName={shortenName}
        />
      )}
    </VStack>
  </HStack>
}

export function MediumWidget({ data }: { data: WidgetData }) {
  const { agg, config, theme, l10n, lang } = data
  const privacy = config.privacyMode

  let content: VirtualNode
  if (config.view === "active") {
    content = <VStack spacing={6} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <HStack spacing={8}>
        <StatCell theme={theme} label={l10n.sessions} value={formatCount(agg.sessionStats.count, privacy)} valueSize={16} />
        <StatCell theme={theme} label={l10n.messages} value={formatCount(agg.sessionStats.messages, privacy)} valueSize={16} />
        <StatCell theme={theme} label={l10n.userMessages} value={formatCount(agg.sessionStats.userMessages, privacy)} valueSize={16} />
        <StatCell theme={theme} label={l10n.activeTime} value={formatDuration(agg.sessionStats.activeSec, lang)} valueColour={theme.blue} valueSize={16} />
      </HStack>
      <StackedBars
        theme={theme}
        rows={agg.byDay.slice(-14)}
        height={30}
        mode={"active"}
      />
    </VStack>
  } else if (config.view === "models") {
    content = <DistributionContent
      data={data}
      items={agg.byModel}
      centreLabel={l10n.viewModels}
      shortenName
    />
  } else if (config.view === "projects") {
    content = <DistributionContent
      data={data}
      items={agg.byProject}
      centreLabel={l10n.viewProjects}
      shortenName={false}
    />
  } else {
    content = <VStack spacing={6} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <HStack spacing={8}>
        <StatCell theme={theme} label={l10n.totalTokens} value={formatTokens(agg.totals.displayed, lang, privacy)} valueSize={16} />
        <StatCell
          theme={theme}
          label={l10n.cost}
          value={formatCost(agg.totals.cost, config.currency, privacy)}
          valueColour={theme.green}
          valueSize={16}
        />
        <StatCell theme={theme} label={l10n.activeTime} value={formatDuration(agg.sessionStats.activeSec, lang)} valueColour={theme.blue} valueSize={16} />
        <StatCell theme={theme} label={l10n.cacheRatio} value={formatPercent(agg.totals.cacheRatio)} valueSize={16} />
      </HStack>
      <StackedBars
        theme={theme}
        rows={agg.byDay.slice(-14)}
        height={30}
        mode={"tokens"}
      />
    </VStack>
  }

  return <VStack
    alignment={"leading"}
    spacing={6}
    padding={12}
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
    {content}
  </VStack>
}

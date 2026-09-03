import {
  Button,
  DateLabel,
  HStack,
  Image,
  RoundedRectangle,
  Spacer,
  Text,
  VirtualNode,
  VStack,
} from "scripting"
import { formatPercent } from "../lib/format"
import { Style, Theme, verticalGradient } from "../lib/theme"
import { L10nMap } from "../l10n"
import { Aggregates, DataStatus, DayRow, RankItem } from "../lib/types"
import { ResolvedConfig, ViewKind } from "../lib/settings"
import { RefreshUsageIntent } from "../app_intents"
import { PillBar } from "./charts"

export interface WidgetData {
  agg: Aggregates
  config: ResolvedConfig
  theme: Theme
  l10n: L10nMap
  lang: string
  status: DataStatus
}

export interface CompositionItem {
  colour: Style
  label: string
  share: number
}

export function Card({
  theme,
  children,
  padding = 9,
}: {
  theme: Theme
  children: (VirtualNode | null)[] | VirtualNode
  padding?: number
}) {
  return <VStack
    alignment={"leading"}
    spacing={2}
    padding={padding}
    frame={{ maxWidth: "infinity" }}
    background={
      <RoundedRectangle
        cornerRadius={9}
        fill={theme.card}
        stroke={{ shapeStyle: theme.border, strokeStyle: { lineWidth: 1 } }}
      />
    }
  >
    {children}
  </VStack>
}

export function StatCell({
  theme,
  label,
  value,
  valueColour,
  valueSize = 18,
  sub,
}: {
  theme: Theme
  label: string
  value: string
  valueColour?: Style
  valueSize?: number
  sub?: string
}) {
  return <VStack
    alignment={"leading"}
    spacing={1}
    frame={{ maxWidth: "infinity" }}
  >
    <Text
      font={10}
      foregroundStyle={theme.secondary}
      lineLimit={1}
    >{label}</Text>
    <Text
      font={valueSize}
      fontWeight={"bold"}
      monospacedDigit
      foregroundStyle={valueColour ?? theme.text}
      lineLimit={1}
      minScaleFactor={0.55}
      widgetAccentable
    >{value}</Text>
    {sub != null
      ? <Text
        font={8.5}
        monospacedDigit
        foregroundStyle={theme.tertiary}
        lineLimit={1}
      >{sub}</Text>
      : null}
  </VStack>
}

export function refreshParamFor(config: ResolvedConfig): string {
  return JSON.stringify({ d: config.days, m: config.showForecast })
}

function WindowTag({
  theme,
  text,
  compact,
}: {
  theme: Theme
  text: string
  compact?: boolean
}) {
  if (compact) {
    return <Text
      font={9}
      monospacedDigit
      foregroundStyle={theme.tertiary}
      lineLimit={1}
    >{text}</Text>
  }
  return <Text
    font={9}
    monospacedDigit
    foregroundStyle={theme.secondary}
    lineLimit={1}
    padding={{ leading: 6, trailing: 6, top: 2, bottom: 2 }}
    background={
      <RoundedRectangle
        cornerRadius={7}
        fill={theme.card}
        stroke={{ shapeStyle: theme.border, strokeStyle: { lineWidth: 1 } }}
      />
    }
  >{text}</Text>
}

// The header carries the view name rather than the app name: the widget is
// already identifiable on the home screen, so the row is better spent saying
// which of the three views this instance shows.
export function viewTitle(view: ViewKind, l10n: L10nMap): string {
  if (view === "models") return l10n.viewModels
  if (view === "active") return l10n.viewActive
  return l10n.viewOverview
}

// Short form for the small widget, whose header has room for one word.
export function viewShortTitle(view: ViewKind, l10n: L10nMap): string {
  if (view === "models") return l10n.viewShortModels
  if (view === "active") return l10n.viewShortActive
  return l10n.viewShortOverview
}

export function WidgetHeader({
  theme,
  title,
  status,
  showRefresh,
  refreshParam,
  compact = false,
  windowText,
}: {
  theme: Theme
  title: string
  status?: DataStatus
  showRefresh: boolean
  refreshParam?: string
  compact?: boolean
  windowText?: string
}) {
  return <HStack spacing={5} frame={{ maxWidth: "infinity" }}>
    <RoundedRectangle
      cornerRadius={1.5}
      fill={verticalGradient(theme.green, 1, 0.5)}
      frame={{ width: 3, height: 12 }}
      widgetAccentable
    />
    <Text
      font={compact ? 11 : 13}
      fontWeight={"bold"}
      foregroundStyle={theme.text}
      lineLimit={1}
    >{title}</Text>
    <Spacer />
    {status != null && status.kind === "stale"
      ? <OfflineBadge theme={theme} />
      : null}
    {windowText != null
      ? <WindowTag theme={theme} text={windowText} compact={compact} />
      : null}
    {showRefresh
      ? <Button
        intent={RefreshUsageIntent(refreshParam)}
        buttonStyle={"plain"}
      >
        <Image
          systemName={"arrow.clockwise"}
          font={12}
          foregroundStyle={theme.secondary}
          padding={3}
          widgetAccentable
        />
      </Button>
      : null}
  </HStack>
}

// Just the icon: the badge's job is to flag that the numbers are stale, and
// the large layout already prints the data timestamp in its footer.
export function OfflineBadge({ theme }: { theme: Theme }) {
  return <Image
    systemName={"wifi.slash"}
    foregroundStyle={theme.amber}
    font={8}
  />
}

// Single-line footer: session summary on the left, update time on the right.
export function FooterLine({
  theme,
  l10n,
  summary,
  status,
}: {
  theme: Theme
  l10n: L10nMap
  summary: string
  status?: DataStatus
}) {
  return <HStack spacing={4} frame={{ maxWidth: "infinity" }}>
    <Text
      font={8.5}
      monospacedDigit
      foregroundStyle={theme.tertiary}
      lineLimit={1}
    >{summary}</Text>
    <Spacer />
    {status != null
      ? <HStack spacing={3} font={8.5} foregroundStyle={theme.tertiary}>
        <Text font={8.5}>{l10n.updated}</Text>
        <DateLabel date={new Date(status.fetchedAt)} style={"time"} />
      </HStack>
      : null}
  </HStack>
}

export function RankRow({
  theme,
  item,
  colour,
  valueText,
  shareText,
  barHeight = 3,
}: {
  theme: Theme
  item: RankItem
  colour: Style
  valueText: string
  shareText: string
  barHeight?: number
}) {
  return <VStack spacing={2} frame={{ maxWidth: "infinity" }}>
    <HStack spacing={4} alignment={"center"}>
      <RoundedRectangle
        cornerRadius={1.5}
        fill={colour}
        frame={{ width: 5, height: 5 }}
      />
      <Text
        font={10.5}
        fontWeight={"medium"}
        foregroundStyle={theme.text}
        lineLimit={1}
        minScaleFactor={0.65}
      >{item.name}</Text>
      <Spacer />
      <HStack spacing={4} alignment={"firstTextBaseline"}>
        <Text
          font={10}
          fontWeight={"semibold"}
          monospacedDigit
          foregroundStyle={theme.text}
          lineLimit={1}
          minScaleFactor={0.68}
        >{valueText}</Text>
        <Text
          font={8.5}
          monospacedDigit
          foregroundStyle={theme.tertiary}
          frame={{ width: 28, alignment: "trailing" }}
          lineLimit={1}
        >{shareText}</Text>
      </HStack>
    </HStack>
    <PillBar theme={theme} share={item.share} colour={colour} height={barHeight} />
  </VStack>
}

// Token / Cost mix (input / output / reasoning / cached) legend items based on reference basis.
export function compositionOf(data: WidgetData): CompositionItem[] {
  const { agg, config, theme, l10n } = data
  if (config.sortKey === "cost") {
    const totalCost = agg.totals.cost
    const costShare = (v: number) => (totalCost > 0 ? v / totalCost : 0)
    return [
      { colour: theme.blue, label: l10n.input, share: costShare(agg.totals.costInput) },
      { colour: theme.green, label: l10n.output, share: costShare(agg.totals.costOutput) },
      { colour: theme.violet, label: l10n.reasoning, share: costShare(agg.totals.costReasoning) },
      { colour: theme.sky, label: l10n.cached, share: costShare(agg.totals.costCached) },
    ]
  }
  const total = agg.totals.input + agg.totals.output + agg.totals.reasoning + agg.totals.cached
  const share = (value: number) => (total > 0 ? value / total : 0)
  return [
    { colour: theme.blue, label: l10n.input, share: share(agg.totals.input) },
    { colour: theme.green, label: l10n.output, share: share(agg.totals.output) },
    { colour: theme.violet, label: l10n.reasoning, share: share(agg.totals.reasoning) },
    { colour: theme.sky, label: l10n.cached, share: share(agg.totals.cached) },
  ]
}

// Transform DayRows to match either Tokens or Cost reference basis
export function chartRowsOf(data: WidgetData, sliceCount: number = 14): DayRow[] {
  const { agg, config } = data
  const days = agg.byDay.slice(-sliceCount)
  if (config.sortKey === "cost") {
    return days.map(r => ({
      ...r,
      input: r.costInput,
      output: r.costOutput,
      reasoning: r.costReasoning,
      cached: r.costCached,
      total: r.cost,
    }))
  }
  return days
}

export function CompositionLegend({
  theme,
  items,
}: {
  theme: Theme
  items: CompositionItem[]
}) {
  return <HStack spacing={10}>
    {items.map((item) => <HStack spacing={3}>
      <RoundedRectangle
        cornerRadius={1.5}
        fill={item.colour}
        frame={{ width: 5, height: 5 }}
      />
      <Text
        font={8.5}
        foregroundStyle={theme.tertiary}
        lineLimit={1}
      >{item.label}</Text>
      <Text
        font={8.5}
        fontWeight={"semibold"}
        monospacedDigit
        foregroundStyle={theme.secondary}
        lineLimit={1}
      >{formatPercent(item.share)}</Text>
    </HStack>)}
  </HStack>
}

export function MessageView({
  theme,
  icon,
  iconColour,
  title,
  hint,
}: {
  theme: Theme
  icon: string
  iconColour: Style
  title: string
  hint: string
}) {
  return <VStack spacing={5} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <Image
      systemName={icon}
      font={22}
      foregroundStyle={iconColour}
      widgetAccentable
    />
    <Text
      font={13}
      fontWeight={"semibold"}
      foregroundStyle={theme.text}
    >{title}</Text>
    <Text
      font={10}
      foregroundStyle={theme.secondary}
      multilineTextAlignment={"center"}
    >{hint}</Text>
  </VStack>
}

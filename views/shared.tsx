import {
  Button,
  DateLabel,
  HStack,
  Image,
  ProgressView,
  RoundedRectangle,
  Spacer,
  Text,
  VirtualNode,
  VStack,
} from "scripting"
import { Style, Theme } from "../theme"
import { L10nMap } from "../l10n"
import { Aggregates, DataStatus, RankItem } from "../types"
import { ResolvedConfig } from "../settings"
import { RefreshUsageIntent } from "../app_intents"

export interface WidgetData {
  agg: Aggregates
  config: ResolvedConfig
  theme: Theme
  l10n: L10nMap
  lang: string
  status: DataStatus
}

export function Card({
  theme,
  children,
  padding = 8,
}: {
  theme: Theme
  children: VirtualNode | (VirtualNode | null)[]
  padding?: number
}) {
  return <VStack
    alignment={"leading"}
    spacing={2}
    padding={padding}
    frame={{ maxWidth: "infinity" }}
    background={
      <RoundedRectangle
        cornerRadius={4}
        fill={theme.card}
        stroke={theme.border}
        strokeLineWidth={1}
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
  return <VStack alignment={"leading"} spacing={1} frame={{ maxWidth: "infinity" }}>
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
      minScaleFactor={0.6}
      widgetAccentable
    >{value}</Text>
    {sub != null
      ? <Text
        font={9}
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

export function WidgetHeader({
  theme,
  l10n,
  status,
  showRefresh,
  refreshParam,
  compact = false,
}: {
  theme: Theme
  l10n: L10nMap
  status: DataStatus | null
  showRefresh: boolean
  refreshParam?: string
  compact?: boolean
}) {
  return <HStack spacing={5} frame={{ maxWidth: "infinity" }}>
    <RoundedRectangle
      cornerRadius={1.5}
      fill={theme.accent}
      frame={{ width: 3, height: 12 }}
      widgetAccentable
    />
    <Text
      font={compact ? 11 : 13}
      fontWeight={"bold"}
      foregroundStyle={theme.text}
      lineLimit={1}
    >{compact ? "Vibe" : l10n.appTitle}</Text>
    <Spacer />
    {status != null && status.kind === "stale"
      ? <OfflineBadge theme={theme} fetchedAt={status.fetchedAt} />
      : null}
    {showRefresh
      ? <Button
        intent={RefreshUsageIntent(refreshParam)}
        buttonStyle={"plain"}
      >
        <Image
          systemName={"arrow.clockwise"}
          imageScale={"small"}
          foregroundStyle={theme.secondary}
          widgetAccentable
        />
      </Button>
      : null}
  </HStack>
}

export function OfflineBadge({
  theme,
  fetchedAt,
}: {
  theme: Theme
  fetchedAt: number
}) {
  return <HStack spacing={2}>
    <Image
      systemName={"wifi.slash"}
      foregroundStyle={theme.amber}
      font={8}
    />
    <DateLabel
      date={new Date(fetchedAt)}
      style={"time"}
    />
  </HStack>
}

export function UpdatedLine({
  theme,
  l10n,
  status,
}: {
  theme: Theme
  l10n: L10nMap
  status: DataStatus | null
}) {
  if (status == null) {
    return <Spacer frame={{ height: 0 }} />
  }
  return <HStack spacing={3} frame={{ maxWidth: "infinity" }} font={9} foregroundStyle={theme.tertiary}>
    <Spacer />
    <Text font={9}>{l10n.updated}</Text>
    <DateLabel
      date={new Date(status.fetchedAt)}
      style={"time"}
    />
    <Spacer />
  </HStack>
}

export function RankRow({
  theme,
  item,
  colour,
  valueText,
  shareText,
}: {
  theme: Theme
  item: RankItem
  colour: Style
  valueText: string
  shareText: string
}) {
  return <VStack spacing={2} frame={{ maxWidth: "infinity" }}>
    <HStack spacing={5}>
      <RoundedRectangle
        cornerRadius={2}
        fill={colour}
        frame={{ width: 6, height: 6 }}
      />
      <Text
        font={11}
        foregroundStyle={theme.text}
        lineLimit={1}
        minScaleFactor={0.8}
      >{item.name}</Text>
      <Spacer />
      <Text
        font={10}
        monospacedDigit
        foregroundStyle={theme.secondary}
      >{valueText}</Text>
      <Text
        font={10}
        monospacedDigit
        foregroundStyle={theme.tertiary}
        frame={{ width: 32, alignment: "trailing" }}
      >{shareText}</Text>
    </HStack>
    <ProportionBar theme={theme} share={item.share} colour={colour} />
  </VStack>
}

export function ProportionBar({
  theme,
  share,
  colour,
}: {
  theme: Theme
  share: number
  colour: Style
}) {
  const clamped = Math.min(1, Math.max(0, share))
  return <ProgressView
    value={clamped}
    total={1}
    progressViewStyle={"linear"}
    tint={colour}
    scaleEffect={{ x: 1, y: 0.75 }}
  />
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

import {
  Capsule,
  Circle,
  HStack,
  RoundedRectangle,
  Spacer,
  Text,
  VirtualNode,
  VStack,
  ZStack,
} from "scripting"
import { Style, Theme } from "../theme"
import { DayRow } from "../types"

function seg(height: number, colour: Style): VirtualNode {
  return <RoundedRectangle
    cornerRadius={1}
    fill={colour}
    frame={{ maxWidth: "infinity", height }}
  />
}

// Hand-drawn stacked day bars: full colour control, widget-safe memory.
export function StackedBars({
  theme,
  rows,
  height,
  mode,
  showDayLabels = false,
}: {
  theme: Theme
  rows: DayRow[]
  height: number
  mode: "tokens" | "active" | "cost"
  showDayLabels?: boolean
}) {
  const metric = (row: DayRow): number => {
    if (mode === "active") return row.activeSec
    if (mode === "cost") return row.cost
    return row.output + row.input + row.cached + row.reasoning
  }
  const max = rows.reduce((m, row) => Math.max(m, metric(row)), 0)

  const columns = rows.map(row => {
    const value = metric(row)
    let bar: VirtualNode
    if (max <= 0 || value <= 0) {
      bar = seg(2, theme.track)
    } else if (mode === "tokens") {
      const scale = (height - 2) / max
      const hOut = (row.output + row.reasoning) * scale
      const hIn = row.input * scale
      const hCache = row.cached * scale
      const parts: VirtualNode[] = []
      if (hOut >= 0.5) parts.push(seg(Math.max(1, hOut), theme.barOutput))
      if (hIn >= 0.5) parts.push(seg(Math.max(1, hIn), theme.barInput))
      if (hCache >= 0.5) parts.push(seg(Math.max(1, hCache), theme.barCached))
      if (parts.length === 0) parts.push(seg(1, theme.barInput))
      bar = <VStack spacing={1}>{parts}</VStack>
    } else {
      const h = Math.max(2, (value / max) * (height - 2))
      bar = seg(h, mode === "cost" ? theme.green : theme.blue)
    }
    return <VStack
      spacing={2}
      frame={{ maxWidth: "infinity" }}
    >
      <VStack
        spacing={0}
        frame={{ maxWidth: "infinity", height, alignment: "bottom" }}
      >
        <Spacer />
        {bar}
      </VStack>
      {showDayLabels
        ? <Text
          font={7}
          monospacedDigit
          foregroundStyle={theme.tertiary}
        >{`${row.dayOfMonth}`}</Text>
        : null}
    </VStack>
  })

  return <HStack
    alignment={"bottom"}
    spacing={rows.length > 14 ? 1.5 : 3}
    frame={{ maxWidth: "infinity" }}
  >
    {columns}
  </HStack>
}

export function MiniBars({
  theme,
  values,
  height,
  colour,
}: {
  theme: Theme
  values: number[]
  height: number
  colour: Style
}) {
  const max = values.reduce((m, v) => Math.max(m, v), 0)
  return <HStack alignment={"bottom"} spacing={2.5} frame={{ maxWidth: "infinity", height }}>
    {values.map(value => {
      const h = max > 0 && value > 0 ? Math.max(2, (value / max) * height) : 2
      return <Capsule
        fill={max > 0 && value > 0 ? colour : theme.track}
        frame={{ maxWidth: "infinity", height: h }}
      />
    })}
  </HStack>
}

// Segmented ring drawn with trimmed circles.
export function DonutRing({
  theme,
  segments,
  size,
  lineWidth,
  centreLabel,
  centreValue,
}: {
  theme: Theme
  segments: { share: number; colour: Style }[]
  size: number
  lineWidth: number
  centreLabel: string
  centreValue: string
}) {
  const rings: VirtualNode[] = [
    <Circle
      stroke={{
        shapeStyle: theme.track,
        strokeStyle: { lineWidth },
      }}
      frame={{ width: size, height: size }}
    />,
  ]
  let cursor = 0
  for (const segment of segments) {
    const from = cursor
    const to = Math.min(1, cursor + Math.max(0, segment.share))
    cursor = to
    if (to - from < 0.004) {
      continue
    }
    rings.push(
      <Circle
        trim={{ from, to: Math.max(from, to - 0.008) }}
        stroke={{
          shapeStyle: segment.colour,
          strokeStyle: { lineWidth, lineCap: "butt" },
        }}
        rotationEffect={-90}
        frame={{ width: size, height: size }}
      />
    )
  }
  return <ZStack frame={{ width: size, height: size }}>
    {rings}
    <VStack spacing={0}>
      <Text
        font={9}
        foregroundStyle={theme.secondary}
      >{centreLabel}</Text>
      <Text
        font={13}
        fontWeight={"bold"}
        monospacedDigit
        foregroundStyle={theme.text}
        minScaleFactor={0.6}
        lineLimit={1}
      >{centreValue}</Text>
    </VStack>
  </ZStack>
}

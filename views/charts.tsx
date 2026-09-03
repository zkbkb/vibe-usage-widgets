import {
  Circle,
  GeometryProxy,
  GeometryReader,
  HStack,
  Path2D,
  PathShape,
  Point,
  RoundedRectangle,
  Size,
  Spacer,
  Text,
  VirtualNode,
  VStack,
  ZStack,
} from "scripting"
import { formatTokens } from "../format"
import { fadedStyle, radialGlow, Style, Theme, verticalGradient } from "../theme"
import { PeakTag } from "../settings"
import { DayRow } from "../types"

// When one day dwarfs the rest (max/mean > 6), switch to a sqrt scale so the
// smaller days stay visible while the peak still clearly stands out.
function softenOutliers(values: number[]): number[] {
  const positives = values.filter(v => v > 0)
  if (positives.length < 3) return values
  const max = Math.max(...positives)
  const mean = positives.reduce((sum, v) => sum + v, 0) / positives.length
  if (mean <= 0 || max / mean < 6) return values
  return values.map(v => (v > 0 ? Math.sqrt(v) : 0))
}

// Catmull-Rom smoothed polyline -> cubic Bézier segments.
function smoothLine(path: Path2D, pts: Point[]) {
  if (pts.length === 0) return
  path.move(pts[0])
  if (pts.length < 2) return
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    path.addCurve(p2, {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    }, {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    })
  }
}

function smoothLineTo(path: Path2D, pts: Point[]) {
  if (pts.length < 2) return
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    path.addCurve(p2, {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    }, {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    })
  }
}

function chartPoints(
  values: number[],
  width: number,
  height: number,
  padX: number,
  padTop: number,
  padBottom: number,
  maxOverride?: number,
): Point[] {
  const max = maxOverride ?? values.reduce((m, v) => Math.max(m, v), 0)
  const innerW = Math.max(1, width - padX * 2)
  const innerH = Math.max(1, height - padTop - padBottom)
  const n = values.length
  return values.map((v, i) => ({
    x: n <= 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW,
    y: padTop + (1 - (max > 0 ? Math.max(0, v) / max : 0)) * innerH,
  }))
}

// Linear interpolation of the polyline's y at x (close enough to the smooth
// curve for the dotted fill test).
function lineYAt(pts: Point[], x: number): number {
  if (pts.length === 0) return Number.POSITIVE_INFINITY
  if (x <= pts[0].x) return pts[0].y
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const t = (x - pts[i - 1].x) / Math.max(0.001, pts[i].x - pts[i - 1].x)
      return pts[i - 1].y + t * (pts[i].y - pts[i - 1].y)
    }
  }
  return pts[pts.length - 1].y
}

function LabelRow({
  theme,
  labels,
}: {
  theme: Theme
  labels: (number | string | null)[]
}) {
  return <HStack spacing={0} frame={{ maxWidth: "infinity" }}>
    {labels.map((label) => <Text
      font={7}
      monospacedDigit
      foregroundStyle={theme.tertiary}
      frame={{ maxWidth: "infinity" }}
      multilineTextAlignment={"center"}
      lineLimit={1}
    >{label == null ? "" : `${label}`}</Text>)}
  </HStack>
}

// Smooth line chart with optional subtle grid, clear airy gradient area and a
// refined live end marker dot.
export function TrendLine({
  theme,
  values,
  colour,
  labels,
  gridRows = 3,
  endDot = true,
  areaStyle = "gradient",
}: {
  theme: Theme
  values: number[]
  colour: Style
  labels?: (number | string | null)[]
  gridRows?: number
  endDot?: boolean
  areaStyle?: "gradient" | "none"
}) {
  const lineWidth = 2
  const padTop = 4
  const padBottom = 3
  const padX = 3
  const scaled = softenOutliers(values)
  const pointsFor = (size: Size) =>
    chartPoints(scaled, size.width, size.height, padX, padTop, padBottom)

  return <VStack spacing={3} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      {gridRows > 0
        ? <PathShape
          stroke={{
            shapeStyle: theme.track,
            strokeStyle: { lineWidth: 1, dash: [1.5, 3] },
          }}
          draw={(path, size) => {
            for (let g = 1; g <= gridRows; g++) {
              const y = (size.height / (gridRows + 1)) * g
              path.move({ x: 0, y })
              path.addLine({ x: size.width, y })
            }
          }}
        />
        : null}
      <PathShape
        stroke={{
          shapeStyle: theme.track,
          strokeStyle: { lineWidth: 1 },
        }}
        draw={(path, size) => {
          const y = size.height - padBottom
          path.move({ x: 0, y })
          path.addLine({ x: size.width, y })
        }}
      />
      {areaStyle !== "none"
        ? <PathShape
          fill={verticalGradient(colour, 0.18, 0.01)}
          draw={(path, size) => {
            const pts = pointsFor(size)
            if (pts.length === 0) return
            smoothLine(path, pts)
            path.addLine({ x: pts[pts.length - 1].x, y: size.height })
            path.addLine({ x: pts[0].x, y: size.height })
            path.closeSubpath()
          }}
        />
        : null}
      <PathShape
        stroke={{
          shapeStyle: colour,
          strokeStyle: { lineWidth, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          smoothLine(path, pointsFor(size))
        }}
      />
      {endDot
        ? <PathShape
          fill={radialGlow(colour, 0.28, 1)}
          draw={(path, size) => {
            const pts = pointsFor(size)
            if (pts.length === 0) return
            const last = pts[pts.length - 1]
            const r = Math.min(8, size.height * 0.35)
            path.addEllipse({ x: last.x - r, y: last.y - r, width: r * 2, height: r * 2 })
          }}
        />
        : null}
      {endDot
        ? <PathShape
          fill={colour}
          stroke={{
            shapeStyle: "#FFFFFF",
            strokeStyle: { lineWidth: 1.5 },
          }}
          draw={(path, size) => {
            const pts = pointsFor(size)
            if (pts.length === 0) return
            const last = pts[pts.length - 1]
            path.addEllipse({ x: last.x - 3, y: last.y - 3, width: 6, height: 6 })
          }}
        />
        : null}
    </ZStack>
    {labels != null ? <LabelRow theme={theme} labels={labels} /> : null}
  </VStack>
}

// Rounded gradient bars drawn in one shape, bottom aligned.
// Zero days read as small track dots.
export function TrendBars({
  theme,
  values,
  colour,
  labels,
}: {
  theme: Theme
  values: number[]
  colour: Style
  labels?: (number | string | null)[]
}) {
  const scaled = softenOutliers(values)
  const max = scaled.reduce((m, v) => Math.max(m, v), 0)
  const count = scaled.length
  const gap = count > 14 ? 2 : 3

  return <VStack spacing={3} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <PathShape
        fill={theme.track}
        draw={(path, size) => {
          if (count === 0) return
          const barW = Math.max(2, (size.width - gap * (count - 1)) / count)
          scaled.forEach((value, i) => {
            if (max > 0 && value > 0) return
            path.addRoundedRect({
              rect: { x: i * (barW + gap), y: size.height - 3, width: barW, height: 3 },
              cornerRadius: 1.5,
            })
          })
        }}
      />
      <PathShape
        fill={verticalGradient(colour, 1, 0.3)}
        draw={(path, size) => {
          if (count === 0 || max <= 0) return
          const barW = Math.max(2, (size.width - gap * (count - 1)) / count)
          const radius = Math.min(barW / 2, 3.5)
          scaled.forEach((value, i) => {
            if (value <= 0) return
            const h = Math.max(3, (value / max) * size.height)
            path.addRoundedRect({
              rect: { x: i * (barW + gap), y: size.height - h, width: barW, height: h },
              cornerRadius: radius,
            })
          })
        }}
      />
    </ZStack>
    {labels != null ? <LabelRow theme={theme} labels={labels} /> : null}
  </VStack>
}

// Balanced power scale (power 0.65): ensures small categories (input ~5%, output/reasoning ~1-2%)
// remain clearly distinguishable (2~6px thick band) while keeping cached (≈90-95%) overwhelmingly
// massive and commanding (75%~80% of total visual area), honoring natural user expectation.
function logScaleCategory(v: number): number {
  if (v <= 0) return 0
  return Math.pow(v, 0.65)
}

type CategoryKey = "cached" | "input" | "output" | "reasoning"

interface Series {
  colour: Style
  values: number[]
}

function categorySeries(theme: Theme, rows: DayRow[]): Series[] {
  const defs: { key: CategoryKey; colour: Style }[] = [
    { key: "cached", colour: theme.sky },
    { key: "input", colour: theme.blue },
    { key: "output", colour: theme.green },
    { key: "reasoning", colour: theme.violet },
  ]
  return defs.map(def => ({
    colour: def.colour,
    values: rows.map(row => logScaleCategory(row[def.key])),
  }))
}

function seriesMax(series: Series[]): number {
  return series.reduce((m, s) => s.values.reduce((mm, v) => Math.max(mm, v), m), 0)
}

// Four smooth composition lines with refined end markers (medium overview).
// With balanced power-scaling, all 4 categories flow elegantly across the canvas.
export function MultiLines({
  theme,
  rows,
  labels,
  peakTag = "badge",
  valueFormatter = formatTokens,
}: {
  theme: Theme
  rows: DayRow[]
  labels?: (number | string | null)[]
  peakTag?: PeakTag
  valueFormatter?: (value: number) => string
}) {
  const series = categorySeries(theme, rows)
  const max = seriesMax(series)
  const padTop = peakTag === "badge" || peakTag === "single" ? 14 : 6
  const padBottom = 4
  const padX = 4
  const totals = rows.map(r => r.total)
  const n = rows.length
  let peak1Idx = 0
  for (let i = 1; i < n; i++) {
    if (totals[i] > totals[peak1Idx]) peak1Idx = i
  }
  // Find cached series for a subtle ambient backdrop gradient
  const cachedSeries = series[0]

  return <VStack spacing={3} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <PathShape
        stroke={{
          shapeStyle: theme.track,
          strokeStyle: { lineWidth: 1, dash: [1.5, 3] },
        }}
        draw={(path, size) => {
          for (let g = 1; g <= 3; g++) {
            const y = (size.height / 4) * g
            path.move({ x: 0, y })
            path.addLine({ x: size.width, y })
          }
        }}
      />
      <PathShape
        stroke={{
          shapeStyle: theme.track,
          strokeStyle: { lineWidth: 1 },
        }}
        draw={(path, size) => {
          const y = size.height - padBottom
          path.move({ x: 0, y })
          path.addLine({ x: size.width, y })
        }}
      />
      {cachedSeries != null
        ? <PathShape
          fill={verticalGradient(theme.sky, 0.12, 0.01)}
          draw={(path, size) => {
            const pts = chartPoints(
              cachedSeries.values, size.width, size.height, padX, padTop, padBottom, max,
            )
            if (pts.length === 0) return
            smoothLine(path, pts)
            path.addLine({ x: pts[pts.length - 1].x, y: size.height })
            path.addLine({ x: pts[0].x, y: size.height })
            path.closeSubpath()
          }}
        />
        : null}
      {series.map((s) => <PathShape
        stroke={{
          shapeStyle: s.colour,
          strokeStyle: { lineWidth: 1.5, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          smoothLine(
            path,
            chartPoints(s.values, size.width, size.height, padX, padTop, padBottom, max),
          )
        }}
      />)}
      {series.map((s) => <PathShape
        fill={s.colour}
        stroke={{
          shapeStyle: "#FFFFFF",
          strokeStyle: { lineWidth: 1.2 },
        }}
        draw={(path, size) => {
          const pts = chartPoints(
            s.values, size.width, size.height, padX, padTop, padBottom, max,
          )
          if (pts.length === 0) return
          const last = pts[pts.length - 1]
          path.addEllipse({ x: last.x - 2.5, y: last.y - 2.5, width: 5, height: 5 })
        }}
      />)}
      {peakTag !== "none" && cachedSeries != null
        ? <PathShape
          stroke={{
            shapeStyle: fadedStyle(theme.sky, 0.45),
            strokeStyle: { lineWidth: 0.8, dash: [1.5, 2] },
          }}
          draw={(path, size) => {
            const pts = chartPoints(
              cachedSeries.values, size.width, size.height, padX, padTop, padBottom, max,
            )
            if (pts.length === 0 || totals[peak1Idx] <= 0) return
            const p1 = pts[peak1Idx]
            const baseY = size.height - padBottom
            path.move({ x: p1.x, y: 13 })
            path.addLine({ x: p1.x, y: baseY })
          }}
        />
        : null}
      {peakTag !== "none" && n > 0 && totals[peak1Idx] > 0
        ? <GeometryReader>
          {(proxy: GeometryProxy) => {
            const w = proxy.size.width
            const innerW = w - padX * 2
            const peakX = padX + (peak1Idx / Math.max(1, n - 1)) * innerW
            const badgeW = 44
            const badgeLeft = Math.max(2, Math.min(w - badgeW - 2, peakX - badgeW / 2))
            return <HStack frame={{ maxWidth: "infinity" }}>
              <HStack
                spacing={0}
                padding={{ leading: 4, trailing: 4, top: 1, bottom: 1 }}
                background={
                  <RoundedRectangle
                    cornerRadius={3}
                    fill={theme.card}
                    stroke={{ shapeStyle: theme.border, strokeStyle: { lineWidth: 0.7 } }}
                  />
                }
                offset={{ x: badgeLeft, y: 0 }}
              >
                <Text
                  font={7.5}
                  fontWeight={"semibold"}
                  monospacedDigit
                  foregroundStyle={theme.secondary}
                >{valueFormatter(totals[peak1Idx])}</Text>
              </HStack>
              <Spacer />
            </HStack>
          }}
        </GeometryReader>
        : null}
    </ZStack>
    {labels != null ? <LabelRow theme={theme} labels={labels} /> : null}
  </VStack>
}

// Compact segmented proportion capsule bar (for Option A).
export function CompositionBar({
  theme,
  items,
  height = 4.5,
}: {
  theme: Theme
  items: { colour: Style; share: number }[]
  height?: number
}) {
  const valid = items.filter(it => it.share > 0)
  const total = valid.reduce((s, it) => s + it.share, 0)
  if (total <= 0) return null

  return <ZStack
    frame={{ maxWidth: "infinity", height }}
    clipShape={{ type: "rect", cornerRadius: height / 2 }}
  >
    <PathShape
      fill={theme.track}
      draw={(path, size) => {
        path.addRoundedRect({
          rect: { x: 0, y: 0, width: size.width, height: size.height },
          cornerRadius: size.height / 2,
        })
      }}
    />
    {valid.map((it, idx) => <PathShape
      fill={it.colour}
      draw={(path, size) => {
        let before = 0
        for (let j = 0; j < idx; j++) {
          before += valid[j].share / total
        }
        const startX = before * size.width
        const w = (it.share / total) * size.width
        if (w < 0.5) return
        const gap = 1
        const realX = idx === 0 ? 0 : startX + gap / 2
        const realW = Math.max(
          1,
          w - (idx === 0 || idx === valid.length - 1 ? gap / 2 : gap),
        )
        path.addRect({
          x: realX,
          y: 0,
          width: realW,
          height: size.height,
        })
      }}
    />)}
  </ZStack>
}

// Smooth log-stacked area chart.
// Small categories (reasoning, output, input) form clear foundational strata at the bottom,
// while massive cached tokens soar majestically at the top, perfectly matching the total trend contour.
export function StackedAreaChart({
  theme,
  rows,
  labels,
  peakTag = "badge",
  valueFormatter = formatTokens,
}: {
  theme: Theme
  rows: DayRow[]
  labels?: (number | string | null)[]
  peakTag?: PeakTag
  valueFormatter?: (value: number) => string
}) {
  const padTop = peakTag === "badge" || peakTag === "single" ? 14 : 6
  const padBottom = 4
  const padX = 3
  // Inverted stacking order: smaller categories at base, dominant cache at the top.
  const layers: {
    key: CategoryKey
    colour: Style
    alphaTop: number
    alphaBot: number
  }[] = [
    { key: "reasoning", colour: theme.violet, alphaTop: 0.58, alphaBot: 0.25 },
    { key: "output", colour: theme.green, alphaTop: 0.50, alphaBot: 0.20 },
    { key: "input", colour: theme.blue, alphaTop: 0.44, alphaBot: 0.16 },
    { key: "cached", colour: theme.sky, alphaTop: 0.48, alphaBot: 0.16 },
  ]
  const totals = rows.map(r => r.total)
  const n = rows.length
  let peak1Idx = 0
  for (let i = 1; i < n; i++) {
    if (totals[i] > totals[peak1Idx]) peak1Idx = i
  }

  const computeStack = (size: Size): { baselines: Point[][]; topPts: Point[] } => {
    if (n === 0) return { baselines: [], topPts: [] }
    const innerW = Math.max(1, size.width - padX * 2)
    const innerH = Math.max(1, size.height - padTop - padBottom)
    const dayTotals = rows.map(r =>
      logScaleCategory(r.cached)
      + logScaleCategory(r.input)
      + logScaleCategory(r.output)
      + logScaleCategory(r.reasoning))
    const maxTotal = Math.max(...dayTotals, 1)
    const baselines: Point[][] = Array.from({ length: 5 }, () => [])
    for (let i = 0; i < n; i++) {
      const row = rows[i]
      const x = n <= 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW
      const baseY = size.height - padBottom
      const totalH = maxTotal > 0 ? (dayTotals[i] / maxTotal) * innerH : 0
      // 0 reasoning (紫), 1 output (绿), 2 input (蓝), 3 cached (天蓝)
      const rawVals = [row.reasoning, row.output, row.input, row.cached]
      let thicknesses = [0, 0, 0, 0]
      if (row.total > 0 && totalH > 0) {
        // Guaranteed minimum visible thickness for small categories:
        // reasoning (purple) >= 3.2px, output (green) >= 2.8px, input (blue) >= 3.5px
        const minThicknesses = [3.2, 2.8, 3.5, 0]
        let reservedSum = 0
        for (let l = 0; l < 4; l++) {
          if (rawVals[l] > 0) {
            reservedSum += minThicknesses[l]
          }
        }
        const reserveCap = totalH * 0.45
        const reserveScale = reservedSum > reserveCap ? reserveCap / reservedSum : 1.0
        const freeH = Math.max(0, totalH - reservedSum * reserveScale)
        const scaledVals = rawVals.map(v => (v > 0 ? logScaleCategory(v) : 0))
        const sumScaled = scaledVals.reduce((s, v) => s + v, 0)
        for (let l = 0; l < 4; l++) {
          if (rawVals[l] > 0) {
            const guaranteed = minThicknesses[l] * reserveScale
            const bonus = sumScaled > 0 ? (scaledVals[l] / sumScaled) * freeH : 0
            thicknesses[l] = guaranteed + bonus
          }
        }
      }
      baselines[0].push({ x, y: baseY })
      let currentY = baseY
      for (let l = 0; l < 4; l++) {
        currentY -= thicknesses[l]
        baselines[l + 1].push({ x, y: currentY })
      }
    }
    return { baselines, topPts: baselines[4] }
  }

  return <VStack spacing={3} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <PathShape
        stroke={{
          shapeStyle: theme.track,
          strokeStyle: { lineWidth: 1, dash: [1.5, 3] },
        }}
        draw={(path, size) => {
          for (let g = 1; g <= 3; g++) {
            const y = (size.height / 4) * g
            path.move({ x: 0, y })
            path.addLine({ x: size.width, y })
          }
        }}
      />
      <PathShape
        stroke={{
          shapeStyle: theme.track,
          strokeStyle: { lineWidth: 1 },
        }}
        draw={(path, size) => {
          const y = size.height - padBottom
          path.move({ x: 0, y })
          path.addLine({ x: size.width, y })
        }}
      />
      {layers.map((def, l) => <PathShape
        fill={verticalGradient(def.colour, def.alphaTop, def.alphaBot)}
        draw={(path, size) => {
          const { baselines } = computeStack(size)
          if (baselines.length < 5) return
          const top = baselines[l + 1]
          const bot = baselines[l]
          if (top.length === 0 || bot.length === 0) return
          smoothLine(path, top)
          path.addLine(bot[bot.length - 1])
          const revBot = [...bot].reverse()
          smoothLineTo(path, revBot)
          path.closeSubpath()
        }}
      />)}
      <PathShape
        stroke={{
          shapeStyle: theme.violet,
          strokeStyle: { lineWidth: 1.4, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          const { baselines } = computeStack(size)
          if (baselines.length < 5) return
          smoothLine(path, baselines[1])
        }}
      />
      <PathShape
        stroke={{
          shapeStyle: theme.green,
          strokeStyle: { lineWidth: 1.2, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          const { baselines } = computeStack(size)
          if (baselines.length < 5) return
          smoothLine(path, baselines[2])
        }}
      />
      <PathShape
        stroke={{
          shapeStyle: theme.blue,
          strokeStyle: { lineWidth: 1.2, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          const { baselines } = computeStack(size)
          if (baselines.length < 5) return
          smoothLine(path, baselines[3])
        }}
      />
      <PathShape
        stroke={{
          shapeStyle: theme.sky,
          strokeStyle: { lineWidth: 1.6, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          const { topPts } = computeStack(size)
          smoothLine(path, topPts)
        }}
      />
      <PathShape
        fill={theme.violet}
        stroke={{ shapeStyle: "#FFFFFF", strokeStyle: { lineWidth: 1 } }}
        draw={(path, size) => {
          const { baselines } = computeStack(size)
          if (baselines.length < 5) return
          const last = baselines[1][baselines[1].length - 1]
          if (last) path.addEllipse({ x: last.x - 2, y: last.y - 2, width: 4, height: 4 })
        }}
      />
      <PathShape
        fill={radialGlow(theme.sky, 0.25, 1)}
        draw={(path, size) => {
          const { topPts } = computeStack(size)
          if (topPts.length === 0) return
          const last = topPts[topPts.length - 1]
          const r = Math.min(6, size.height * 0.3)
          path.addEllipse({ x: last.x - r, y: last.y - r, width: r * 2, height: r * 2 })
        }}
      />
      <PathShape
        fill={theme.sky}
        stroke={{ shapeStyle: "#FFFFFF", strokeStyle: { lineWidth: 1.5 } }}
        draw={(path, size) => {
          const { topPts } = computeStack(size)
          if (topPts.length === 0) return
          const last = topPts[topPts.length - 1]
          path.addEllipse({ x: last.x - 2.5, y: last.y - 2.5, width: 5, height: 5 })
        }}
      />
      {peakTag !== "none"
        ? <PathShape
          stroke={{
            shapeStyle: fadedStyle(theme.sky, 0.45),
            strokeStyle: { lineWidth: 0.8, dash: [1.5, 2] },
          }}
          draw={(path, size) => {
            const { topPts } = computeStack(size)
            if (topPts.length === 0 || totals[peak1Idx] <= 0) return
            const p1 = topPts[peak1Idx]
            const baseY = size.height - padBottom
            path.move({ x: p1.x, y: 13 })
            path.addLine({ x: p1.x, y: baseY })
          }}
        />
        : null}
      {peakTag !== "none" && n > 0 && totals[peak1Idx] > 0
        ? <GeometryReader>
          {(proxy: GeometryProxy) => {
            const w = proxy.size.width
            const padX = 2
            const innerW = w - padX * 2
            const peakX = padX + (peak1Idx / Math.max(1, n - 1)) * innerW
            const badgeW = 44
            const badgeLeft = Math.max(2, Math.min(w - badgeW - 2, peakX - badgeW / 2))
            return <HStack frame={{ maxWidth: "infinity" }}>
              <HStack
                spacing={0}
                padding={{ leading: 4, trailing: 4, top: 1, bottom: 1 }}
                background={
                  <RoundedRectangle
                    cornerRadius={3}
                    fill={theme.card}
                    stroke={{ shapeStyle: theme.border, strokeStyle: { lineWidth: 0.7 } }}
                  />
                }
                offset={{ x: badgeLeft, y: 0 }}
              >
                <Text
                  font={7.5}
                  fontWeight={"semibold"}
                  monospacedDigit
                  foregroundStyle={theme.secondary}
                >{valueFormatter(totals[peak1Idx])}</Text>
              </HStack>
              <Spacer />
            </HStack>
          }}
        </GeometryReader>
        : null}
    </ZStack>
    {labels != null ? <LabelRow theme={theme} labels={labels} /> : null}
  </VStack>
}

// Layered "3D" ridgelines, back to front: cache, input, output, reasoning.
// Each ridge is a smooth area with a gradient fill and a bright top edge
// (large overview).
export function RidgeChart({
  theme,
  rows,
  labels,
}: {
  theme: Theme
  rows: DayRow[]
  labels?: (number | string | null)[]
}) {
  const series = categorySeries(theme, rows)
  const count = series.length
  const padX = 4
  // Each ridge is normalised to its own peak so every category reads as a
  // full mountain; the legend carries the true proportions.
  const ridgePoints = (s: Series, width: number, peak: number, baseline: number): Point[] => {
    const own = s.values.reduce((m, v) => Math.max(m, v), 0)
    const pts = chartPoints(s.values, width, peak, padX, 0, 0, own)
    return pts.map(p => ({ x: p.x, y: baseline - (peak - p.y) }))
  }

  return <VStack spacing={3} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      {series.map((s, i) => <PathShape
        fill={verticalGradient(s.colour, 0.40, 0.08)}
        draw={(path, size) => {
          const gap = size.height / (count + 1.6)
          const baseline = size.height - (count - 1 - i) * gap
          const peak = size.height - (count - 1) * gap - 2
          const lifted = ridgePoints(s, size.width, peak, baseline)
          if (lifted.length === 0) return
          smoothLine(path, lifted)
          path.addLine({ x: lifted[lifted.length - 1].x, y: baseline })
          path.addLine({ x: lifted[0].x, y: baseline })
          path.closeSubpath()
        }}
      />)}
      {series.map((s, i) => <PathShape
        stroke={{
          shapeStyle: s.colour,
          strokeStyle: { lineWidth: 1.5, lineCap: "round", lineJoin: "round" },
        }}
        draw={(path, size) => {
          const gap = size.height / (count + 1.6)
          const baseline = size.height - (count - 1 - i) * gap
          const peak = size.height - (count - 1) * gap - 2
          const lifted = ridgePoints(s, size.width, peak, baseline)
          if (lifted.length === 0) return
          smoothLine(path, lifted)
        }}
      />)}
    </ZStack>
    {labels != null ? <LabelRow theme={theme} labels={labels} /> : null}
  </VStack>
}

// Clean minimalist proportion capsule bar (replaces misleading pseudo-slider knobs).
export function PillBar({
  theme,
  share,
  colour,
  height = 4,
}: {
  theme: Theme
  share: number
  colour: Style
  height?: number
}) {
  const clamped = Math.min(1, Math.max(0, share))
  return <ZStack frame={{ maxWidth: "infinity", height }}>
    <PathShape
      fill={theme.track}
      draw={(path, size) => {
        path.addRoundedRect({
          rect: { x: 0, y: 0, width: size.width, height: size.height },
          cornerRadius: size.height / 2,
        })
      }}
    />
    {clamped > 0.005
      ? <PathShape
        fill={verticalGradient(colour, 1, 0.82)}
        draw={(path, size) => {
          const w = Math.min(size.width, Math.max(size.height, size.width * clamped))
          path.addRoundedRect({
            rect: { x: 0, y: 0, width: w, height: size.height },
            cornerRadius: size.height / 2,
          })
        }}
      />
      : null}
  </ZStack>
}

// Backward-compatible export
export const KnobBar = PillBar

// Segmented ring drawn with trimmed circles.
export function DonutRing({
  theme,
  segments,
  size,
  lineWidth,
  centreLabel,
  centreValue,
  centreSubValue,
}: {
  theme: Theme
  segments: { share: number; colour: Style }[]
  size: number
  lineWidth: number
  centreLabel: string
  centreValue: string
  centreSubValue?: string
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
    <VStack
      spacing={size > 80 ? 1 : 0}
      padding={{ leading: 4, trailing: 4 }}
    >
      <Text
        font={size > 80 ? 9 : 7.5}
        foregroundStyle={theme.tertiary}
        lineLimit={1}
      >{centreLabel}</Text>
      <Text
        font={size > 80 ? 15 : (centreValue.length > 7 ? 11 : 12)}
        fontWeight={"bold"}
        monospacedDigit
        foregroundStyle={theme.text}
        minScaleFactor={0.5}
        lineLimit={1}
      >{centreValue}</Text>
      {centreSubValue != null
        ? <Text
          font={size > 80 ? 10 : 8}
          fontWeight={"semibold"}
          monospacedDigit
          foregroundStyle={theme.green}
          minScaleFactor={0.55}
          lineLimit={1}
        >{centreSubValue}</Text>
        : null}
    </VStack>
  </ZStack>
}

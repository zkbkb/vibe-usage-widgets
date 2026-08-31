# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A home-screen widget script for **Scripting** (thomfang's iOS app that runs TypeScript/TSX using wrapped SwiftUI views — see `Scripting Documentation/` for the full API reference). It renders usage/cost dashboards for [Vibe Usage](https://vibecafe.ai) (AI coding token tracking) as small/medium/large iOS widgets plus a settings sheet.

There is no build system, package manager, bundler, linter, or test runner in this repo — no `package.json`, `tsconfig.json`, or npm scripts. Code is edited here and run inside the Scripting app on-device; there is no local build/test command to invoke. When in doubt about an API's shape (a component prop, a global like `Storage`/`Keychain`/`Widget`/`Device`), check the matching page under `Scripting Documentation/` (each topic has `en.md`/`zh.md`) rather than guessing.

## Runtime model

`index.tsx` is the entry point when the script is opened directly in-app (presents the settings sheet). `widget.tsx` is the entry point the OS invokes to render an actual home-screen widget — `main()` at the bottom runs on load, there is no explicit export/render call to look for.

Widget re-render is driven by `Widget.present(element, { policy, date })`, not by React-style re-rendering — every code path in `widget.tsx` that produces a final view must end by calling `present(...)` (see the `present()` helper) with a `retryMinutes` value that becomes the next scheduled reload. There's no live state; the whole pipeline (load config → fetch/cache → aggregate → pick layout → present) runs fresh each time the OS invokes the widget.

## Data flow (widget.tsx `main()`)

1. **Config**: `resolveConfig(getStoredSettings(), Widget.parameter)` in [settings.ts](settings.ts) merges persisted `Settings` with a per-widget-instance preset parsed from the widget's `Parameter` field (`Widget.parameter`) — either a bare view-name keyword (`"models"`) or a JSON object (`{"view":"models","days":30}`). Preset always wins over stored settings.
2. **Data source**, in priority order: mock data (`config.mock`) → fresh cache (< 15 min old, `FRESH_WINDOW_MS`) → live fetch via `fetchUsage()` in [api.ts](api.ts) → stale cache fallback → error view. Missing API key or a fetch failure with no cache falls through to `errorView()`.
3. **Cache**: keyed by `(days, coversMonth)` via `store.ts`'s `cacheKey()`; `getAnyCache()` accepts any cached window that covers the requested one as a fallback. The API key lives in Keychain (`store.ts`), never in `Storage`.
4. **Aggregation**: `computeAggregates()` in [aggregate.ts](aggregate.ts) turns raw `UsageBucket[]`/`UsageSession[]` into per-day rows, top-5 rankings by model/project/source (with an "other" bucket), totals, cache ratio, and an optional month-end cost forecast (only computed when the fetched window actually covers the month — see the `coversMonth`/`windowCoversMonth` logic).
5. **Layout**: `pickView()` switches on `Widget.family` (`systemSmall` / `systemMedium` / `systemLarge`+`systemExtraLarge` / `accessory*`) to one of `views/small.tsx`, `views/medium.tsx`, `views/large.tsx`, or the inline `AccessoryView`.

## Conventions to preserve

- **Theme-aware styling**: colours are never hardcoded per-call. `theme.ts`'s `makeTheme()` returns a `Theme` whose fields are either a plain hex string or `{ light, dark }` — always source colours from the `Theme`/`Palette` objects, not literals, so both appearances stay correct. Palette values are intentionally pinned to match the official macOS Vibe Usage app.
- **Localization**: all user-facing strings go through `L10nMap` (`l10n/en.ts`, `l10n/zh.ts`, indexed via `l10n/index.ts`'s `getL10n()`), keyed by matching field names in both files. Add new strings to both locales together. Language resolution (`resolveLanguage()` in widget.tsx) falls back to `Device.preferredLanguages` when `config.language === "system"`.
- **Privacy mode**: `formatTokens`/`formatCost`/`formatCount` in [format.ts](format.ts) all accept a `privacy` flag that masks values (`•••`) — any new numeric display should route through these formatters rather than formatting inline.
- **Settings vs. preset**: `Settings` (persisted, `store.ts`/Storage) and `WidgetPreset` (per-instance, from `Widget.parameter`) are distinct types in [settings.ts](settings.ts); `resolveConfig()` is the only place they merge into `ResolvedConfig`. Don't read `Widget.parameter` directly elsewhere.
- **Untrusted input parsing**: both `sanitizeSettings()` and `parsePreset()`/`decodeBucket()`/`decodeSession()` (in `api.ts`) treat their input as untyped/untrusted and validate every field defensively (`oneOf`, `clampDays`, `isHexColour`, `num`/`str` coercion) rather than trusting a cast — follow this pattern for any new field.
- **Shared widget UI atoms** (`Card`, `StatCell`, `WidgetHeader`, `RankRow`, `ProportionBar`, `MessageView`, `OfflineBadge`) live in `views/shared.tsx`; prefer extending these over duplicating layout code in `small.tsx`/`medium.tsx`/`large.tsx`.
- **Widget refresh**: the manual refresh button is an `AppIntent` (`RefreshUsageIntent` in `app_intents.tsx`), not a button handler — its JSON string parameter (`refreshParamFor()` in `views/shared.tsx`) round-trips the widget's own `days`/`showForecast` so a preset widget refreshes with its own window, not the global default.

## script.json

Script metadata (name, icon, permissions, localized name/description) lives in `script.json`. `localizedNames`/`localizedDescriptions` need `en`/`zh` kept in sync with any user-facing feature changes (mirrors the `l10n/` split).

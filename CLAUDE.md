# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A home-screen widget script for **Scripting** (an iOS app that runs TypeScript/TSX through wrapped SwiftUI views). It renders dashboards for [Vibe Usage](https://vibecafe.ai/usage) (AI coding token/cost tracking) as small/medium/large iOS widgets plus an in-app settings sheet. See README.md for the user-facing feature list; keep its English and Chinese sections in sync when features change.

## Upstream documentation — read before changing anything

This project sits on two upstreams. Before modifying or reasoning about code, know what it is based on and where the authoritative docs live:

- **Scripting (the runtime)** — official docs at https://scriptingapp.github.io/, with an LLM-oriented index at https://scriptingapp.github.io/llms.txt. When unsure about a component prop or a global (`Storage`, `Keychain`, `Widget`, `Device`, `fetch`), check the docs rather than guessing: the Scripting API is close to SwiftUI but not identical, and several details here (entry-file conventions, widget render-once semantics, `Widget.family` values) come straight from it. A full offline copy may exist locally as `Scripting Documentation/` (gitignored — do not commit it): each topic directory has `en.md`/`zh.md`, and its root-level `widget.tsx`/`index.tsx`/`app_intents.tsx`/`store.ts` form a working example project this codebase's conventions were modelled on.
- **Vibe Usage (the data source)** — official CLI at https://github.com/vibe-cafe/vibe-usage and official macOS app at https://github.com/vibe-cafe/vibe-usage-app. The cloud API this project consumes has no public documentation; its schema was reconstructed from those two clients (`APIClient.swift`, `UsageBucket.swift`, `UsageSession.swift` in the app repo are the best reference), and the dark-theme design tokens in `theme.ts` are copied from the app's SwiftUI views. There is also an official agent skill installable via `npx @vibe-cafe/vibe-usage skill`, but it documents CLI usage only, not the API.

## Commands

There is no build system, package manager, or test runner — no `package.json` or `tsconfig.json`. Code runs on-device inside the Scripting app. Two host-side checks are available:

```bash
# Strict typecheck (uses a hand-written loose stub for the "scripting" module;
# recreate the stub as described below if it is missing from the scratchpad)
npx -p typescript tsc --noEmit --jsx preserve --target es2020 --module esnext \
  --moduleResolution bundler --lib es2020 --strict --skipLibCheck \
  <stub.d.ts> index.tsx widget.tsx app_intents.tsx views/settings_view.tsx
```

The stub declares `module "scripting"` (typed `useState<T>`, everything else `any`), a permissive `JSX` namespace with `ElementChildrenAttribute`, and globals `Storage`/`Keychain`/`fetch`. Use `--lib es2020` (not dom) to avoid `Storage` name collisions. Checking the four entry files pulls in the whole import graph.

```bash
# Smoke-test the pure modules (settings/aggregate/format/api URL building) —
# they have no "scripting" imports, so npx tsx can run them directly via
# absolute-path imports from a script in /tmp
npx tsx /path/to/smoke.mts
```

UI must be verified on-device: the in-app widget preview is an approximation; the home screen is the source of truth.

## Runtime model (the part that is easy to get wrong)

Entry files are selected by **filename convention**, one OS process each:

- `index.tsx` — runs when the script is opened in-app (`Script.env === "index"`). Presents the settings sheet, then `Widget.reloadAll()` + `Script.exit()`.
- `widget.tsx` — runs when the OS renders a home-screen widget. **Renders exactly once**: React hooks are inert here, every `await` (including the fetch) must complete *before* `Widget.present(element, { policy: "after", date })`, and the JS context is destroyed immediately after `present`. Nothing in `widget.tsx`'s import chain may rely on state or effects. WidgetKit's ~30 MB memory cap applies.
- `app_intents.tsx` — hosts `RefreshUsageIntent` (`Script.env === "app_intents"`); network is allowed here. The widget's refresh button passes a JSON string (`refreshParamFor()` in `views/shared.tsx`) carrying its own `days`/`showForecast`, so a preset widget refreshes its own window rather than the global default; the intent fetches, writes the cache, and calls `Widget.reloadAll()`.

All three processes share the same per-script `Storage` domain and Keychain sandbox — `Storage` is the app↔widget↔intent channel. The API key is Keychain-only (`accessibility: "first_unlock"` so a locked-device background refresh can still read it); never move it into `Storage`.

## Data flow (widget.tsx `main()`)

1. **Config**: `resolveConfig(getStoredSettings(), Widget.parameter)` in `settings.ts` merges defaults ← persisted `Settings` ← per-instance `WidgetPreset` (parsed from the widget's Parameter field: JSON like `{"view":"models","days":30}`, or a bare view keyword like `models`). Preset wins field-by-field; invalid fields are dropped, never trusted. `resolveConfig()` is the only place these merge — don't read `Widget.parameter` elsewhere.
2. **Data source priority**: mock (`{"mock":true}` preset, deterministic data from `mock.ts`) → cache fresher than 15 min → live `fetchUsage()` → stale cache with offline badge → error view. Reload policy: 30 min on success, 10 min on any degraded path.
3. **Cache**: `Storage` entries keyed `vum.cache.v1.<days>.<m|w>` (`store.ts`); `coversMonth` is tracked per entry because the forecast is only valid when the fetched window reaches back to the 1st of the month.
4. **Aggregation**: `computeAggregates()` in `aggregate.ts` — the API returns only raw 30-minute buckets and session records (no server-side breakdowns), so per-day rows, top-5 rankings (model/project/source, with an "other" bucket), cache ratio, and the linear month-cost forecast are all computed here.
5. **Layout**: `pickView()` switches on `Widget.family` as a *loose string* with a medium fallback (the real family set is wider than the documented union).

## Vibe Usage API facts

`GET https://vibecafe.ai/api/usage` with `Authorization: Bearer vbu_...`; params `days=N` (1–90) or `from`/`to` (yyyy-MM-dd) plus `tz`. When the forecast needs month coverage, `buildUsageUrl()` widens a single request to the month start — never issue two requests per refresh. The server is closed-source and this schema was reconstructed from the official clients, hence `decodeBucket()`/`decodeSession()` in `api.ts` coerce every field defensively (`num`/`str`, nullable `estimatedCost`) and any decode failure degrades to the cached data instead of throwing. `estimatedCost` is computed server-side (pricing is not public) — sum it, never recompute it. Displayed token total = input + output + reasoning + cached.

## Conventions to preserve

- **Charts are hand-drawn** with shapes (`views/charts.tsx`: stacked `Rectangle` day bars, trimmed-`Circle` donut, `ProgressView` proportion bars) — deliberately not Swift Charts, because Scripting's `Chart` cannot pin per-category colours to the Vibe Usage palette and charts add widget memory risk. Don't introduce `<Chart>` into widget layouts.
- **Theme-aware styling**: never hardcode a colour at a call site. `makeTheme()` in `theme.ts` yields fields that are either a single value or `{ light, dark }`; dark values are pinned to the official macOS Vibe Usage app tokens. Backgrounds on widget roots use `widgetBackground` (auto-hides in iOS 18 tinted mode), with `widgetAccentable` on key elements.
- **Localization**: every user-facing string goes through `L10nMap` (`l10n/en.ts` is the type source; `l10n/zh.ts` must implement it, so adding a key to one forces the other). `script.json`'s `localizedNames`/`localizedDescriptions` (`en`/`zh`) mirror this split and need the same sync.
- **Formatting and privacy**: all numeric display routes through `format.ts` (`formatTokens`/`formatCost`/`formatDuration`/`formatCount`), which own the privacy masking (`•••`), Chinese numerals (万/亿), sub-cent cost precision, and the fixed ×7 CNY conversion — no inline formatting.
- **Shared UI atoms** (`Card`, `StatCell`, `WidgetHeader`, `RankRow`, `ProportionBar`, `OfflineBadge`, `MessageView`) live in `views/shared.tsx`; extend these rather than duplicating layout in the size files.
- **Untrusted input**: `sanitizeSettings()`, `parsePreset()`, and the `api.ts` decoders validate field-by-field (`oneOf`, `clampDays`, `isHexColour`) instead of casting — follow this for any new field.

## On-device debugging

The settings sheet's Developer section provides `Widget.preview` (with the preset list injected as parameter options) and a reload button. Add a widget with Parameter `{"mock":true}` to exercise every layout without a network or API key. Prefer `Widget.reloadTestWidgets()` during development loops to avoid churning real widgets' refresh budget.

# Vibe Usage Widgets

iOS home-screen widgets for [Vibe Usage](https://vibecafe.ai/usage), built on the [Scripting](https://scriptingapp.github.io/) app. Track your AI coding token usage, estimated cost, active time and cache ratio at a glance, in small, medium and large sizes.

[English](#english) · [中文说明](#中文说明)

---

## English

### What it is

[Vibe Usage](https://github.com/vibe-cafe/vibe-usage) collects token usage from AI coding tools (Claude Code, Codex, Cursor, Gemini CLI and about thirty others) on your machines and syncs it to vibecafe.ai. This project turns that data into native iOS widgets: it fetches your usage from the Vibe Usage cloud API, aggregates it on-device, and renders dashboards that follow the visual language of the official Vibe Usage macOS app.

No server of its own, no analytics, no third parties: the only network call is to `vibecafe.ai`, authorised by your own API key, which is stored in the iOS Keychain.

### Features

- **Three widget sizes** with distinct layouts, plus a minimal lock-screen (accessory) fallback
  - **Small**: total tokens, cost with monthly forecast, 7-day mini bars, active time and cache ratio
  - **Medium**: four stat cells and a 14-day stacked trend, with a tap-to-refresh button
  - **Large**: 2×2 KPI cards plus one of four switchable sections, and a session summary footer
- **Four large/medium views**: `overview` (daily trend and top agents), `active` (activity pulse and session stats), `models` (donut distribution and ranking), `projects` (project ranking)
- **Metrics**: total tokens (input + output + reasoning + cached), estimated cost, active time, cache ratio, sessions, messages, user messages, total duration, linear monthly cost forecast
- **Offline-first**: responses are cached; on network failure the widget falls back to the cache and shows an offline badge with the data timestamp
- **Refresh**: automatic reload roughly every 30 minutes (10 on failure), plus a manual refresh button on medium and large widgets
- **Appearance**: dark theme matching the official Vibe Usage design tokens, a tuned light theme, follow-system mode, custom accent colours, and iOS 18 tinted-mode awareness
- **Languages**: English and Chinese, following the system by default; Chinese numerals (万/亿) for token counts
- **Extras**: privacy mode (masks money and token figures), USD/CNY display (fixed ×7), per-widget configuration via the widget parameter

### Requirements

- iOS with the [Scripting](https://scriptingapp.github.io/) app installed (available on the App Store)
- A [Vibe Usage](https://vibecafe.ai/usage) account with data syncing from your development machine(s)
- Your Vibe Usage API key (`vbu_...`) — see [Getting your API key](#getting-your-api-key)

### Installation

Everything below can be done entirely on your iPhone; no computer or terminal is needed.

**Option A — import from the repository link (recommended)**

Scripting supports importing scripts straight from a URL via its `scripting://import_scripts` URL scheme. On your iPhone, copy the line below, paste it into Safari's address bar and go; Scripting opens and imports the script:

```
scripting://import_scripts?urls=https%3A%2F%2Fgithub.com%2Fzkbkb%2Fvibe-usage-widgets
```

**Option B — via iCloud Drive and the Files app**

Scripting loads scripts from its iCloud Drive folder. In Safari, open this repository and download it via **Code → Download ZIP**; in the **Files** app, tap the ZIP to extract the folder and move it to:

```
iCloud Drive / Scripting / scripts / vibe-usage-widgets
```

The script then appears in the Scripting app automatically.

**Option C — for desktop users**

Clone the repository into the same iCloud folder from a Mac:

```bash
git clone https://github.com/zkbkb/vibe-usage-widgets.git "$HOME/Library/Mobile Documents/iCloud~com~thomfang~Scripting/Documents/scripts/vibe-usage-widgets"
```

### Getting your API key

The widgets read your data through the Vibe Usage cloud API, authorised by a personal API key:

1. If you have not used Vibe Usage yet, set it up first: run `npx @vibe-cafe/vibe-usage` on your development machine and sign in when the browser opens — this creates your account and starts syncing your usage data to [vibecafe.ai/usage](https://vibecafe.ai/usage).
2. Once signed in, open [vibecafe.ai/usage/setup](https://vibecafe.ai/usage/setup) (works on your phone too) to generate and copy your API key. It starts with `vbu_`.
3. Keep the key private: anyone holding it can read your usage data. In this project it is stored only in the iOS Keychain and sent only to `vibecafe.ai`.

### Setup

1. Open the script in the Scripting app. The settings page appears.
2. Paste your `vbu_` API key and tap **Test connection**.
3. Adjust the statistics period (1/7/30/90 days), ranking sort, theme, language and other options as you like. Settings save immediately.
4. Add a widget to your home screen: long-press the home screen, add a **Scripting** widget in the size you want, then in **Edit Widget** select this script.

### Per-widget parameters

Every widget instance can carry its own configuration. In **Edit Widget**, set the **Parameter** field to a JSON object; any field given there overrides the global settings for that widget only.

| Field | Values | Meaning |
| --- | --- | --- |
| `view` | `"overview"` `"active"` `"models"` `"projects"` | Section shown on medium and large widgets |
| `days` | 1–90 | Statistics window |
| `sort` | `"tokens"` `"cost"` | Ranking sort key |
| `accent` | `"#RRGGBB"` | Accent colour |
| `theme` | `"system"` `"dark"` `"light"` | Appearance |
| `privacy` | `true` / `false` | Mask money and token figures |
| `currency` | `"USD"` `"CNY"` | Display currency |
| `mock` | `true` | Render deterministic demo data (no network) |

Examples (also available to copy from the in-app settings page):

```json
{"view":"models","days":30}
{"view":"projects","sort":"cost"}
{"view":"active"}
{"view":"overview","privacy":true}
{"accent":"#6199FF","days":30}
{"mock":true}
```

A bare keyword such as `models` is accepted as shorthand for `{"view":"models"}`. Invalid parameters are ignored field by field, falling back to the global settings.

### How it works

```
widget.tsx ──> Storage cache (fresh within 15 min? use it)
     │                │ otherwise
     │                └──> GET vibecafe.ai/api/usage  (Bearer vbu_..., 10 s timeout)
     │                         │ success: cache + render      │ failure: cached data
     │                         v                              v  + offline badge
     └── aggregate on-device (by day / model / project / agent) ──> render by Widget.family
```

- The Vibe Usage API returns raw 30-minute usage buckets and session records; there are no server-side breakdown endpoints, so all grouping (per day, model, project, agent) happens on-device, the same way the official macOS app does it.
- Estimated cost comes from the server (`estimatedCost`); the pricing table is not public, so it is consumed, not recomputed.
- When the monthly forecast is enabled, a single request is widened to the start of the month and sliced locally, never two requests per refresh.
- The manual refresh button runs an App Intent that fetches with the widget's own window, writes the cache, and reloads all widgets.
- The API key lives in the Keychain with `first_unlock` accessibility so background refreshes work on a locked device. The response decoder treats every field as optional and coerces types defensively, so a server-side schema change degrades to the cached data instead of crashing.
- All charts (stacked day bars, activity pulse, donut ring, proportion bars) are hand-drawn with shapes rather than Swift Charts, for exact colour control and a small memory footprint under WidgetKit's limit.

### Project structure

| Path | Responsibility |
| --- | --- |
| `widget.tsx` | Widget entry: config, cache/fetch pipeline, size routing, reload policy |
| `index.tsx` | In-app entry: presents the settings page |
| `app_intents.tsx` | `RefreshUsageIntent` behind the widget refresh button |
| `api.ts` | URL building, fetch with timeout, defensive payload decoding |
| `store.ts` | Storage cache and Keychain access |
| `settings.ts` | Settings model, widget-parameter parsing, precedence resolution |
| `aggregate.ts` | Pure aggregation: totals, per-day rows, rankings, forecast |
| `format.ts` | Token/cost/duration/percent formatting, privacy masking |
| `theme.ts` | Dark and light token palettes, accent resolution |
| `mock.ts` | Deterministic demo data for `{"mock":true}` |
| `l10n/` | English and Chinese string tables |
| `views/` | Small/medium/large layouts, shared components, hand-drawn charts, settings UI |

### Notes and limitations

- The Vibe Usage server is closed-source; the response schema was reconstructed from the official clients and may change without notice (the decoder is defensive for this reason).
- The monthly forecast is a linear extrapolation of month-to-date cost.
- CNY display uses the official app's fixed ×7 conversion, not a live rate.
- Some sources upload buckets without session records, so session and message counts can undercount relative to tokens.
- Widget refresh timing is ultimately budgeted by iOS; the 30-minute policy is a request, not a guarantee.

### Credits

- [vibe-cafe/vibe-usage](https://github.com/vibe-cafe/vibe-usage) and [vibe-cafe/vibe-usage-app](https://github.com/vibe-cafe/vibe-usage-app), whose design language this project follows
- [Scripting](https://scriptingapp.github.io/), the iOS app that makes TSX-defined native widgets possible

This is an unofficial companion project and is not affiliated with Vibe Cafe.

---

## 中文说明

### 项目简介

[Vibe Usage](https://github.com/vibe-cafe/vibe-usage) 会在你的电脑上收集各类 AI 编程工具（Claude Code、Codex、Cursor、Gemini CLI 等约三十种）的 Token 用量并同步到 vibecafe.ai。本项目基于 iOS 上的 [Scripting](https://scriptingapp.github.io/) 应用，将这些数据变成原生桌面小组件：从 Vibe Usage 云端 API 拉取用量、在设备端聚合，并以与官方 macOS 应用一致的设计语言呈现仪表盘。

项目本身没有服务器、不做任何统计上报：唯一的网络请求指向 `vibecafe.ai`，由你自己的 API 密钥授权，密钥保存在 iOS 钥匙串中。

### 功能特性

- **三种小组件尺寸**，各有独立布局，另含极简锁屏（accessory）兜底
  - **小号**：Token 总量、费用与月度预测、7 日迷你条形图、活跃时长与缓存占比
  - **中号**：四项指标 + 14 日堆叠趋势图，右上角手动刷新按钮
  - **大号**：2×2 指标卡 + 四种可切换视图区块 + 会话统计脚注
- **四种视图**：`overview`（每日趋势 + Top 客户端）、`active`（活跃脉冲 + 会话统计）、`models`（模型分布环形图 + 排行）、`projects`（项目排行）
- **指标**：Token 总量（输入+输出+推理+缓存）、预估费用、活跃时长、缓存占比、会话数、消息数、用户消息数、总时长、月度费用线性预测
- **离线优先**：响应自动缓存；网络失败时回退到缓存数据，并显示离线徽标与数据时间
- **刷新机制**：约每 30 分钟自动刷新（失败后 10 分钟重试），中号与大号支持点击手动刷新
- **外观**：深色主题复刻官方设计 token，浅色主题为适配调校版，支持跟随系统、自定义强调色，并适配 iOS 18 着色模式
- **语言**：中文、英文、跟随系统；中文环境下 Token 数量以 万/亿 计
- **其他**：隐私模式（遮蔽金额与 Token 数值）、USD/CNY 显示（固定 ×7）、通过 Parameter 为每个小组件独立配置

### 使用前提

- 已安装 [Scripting](https://scriptingapp.github.io/)（App Store 有售）的 iOS 设备
- 已开始同步数据的 [Vibe Usage](https://vibecafe.ai/usage) 账户
- Vibe Usage 的 API 密钥（`vbu_...`），获取方式见下文

### 安装（手机即可完成，无需电脑）

**方式一：通过仓库链接直接导入（推荐）**

Scripting 支持 `scripting://import_scripts` URL Scheme 从链接直接导入脚本。在 iPhone 上复制下面这行，粘贴到 Safari 地址栏并前往，Scripting 会自动打开并导入：

```
scripting://import_scripts?urls=https%3A%2F%2Fgithub.com%2Fzkbkb%2Fvibe-usage-widgets
```

**方式二：通过 iCloud 云盘与「文件」App**

在 Safari 中打开本仓库，通过 **Code → Download ZIP** 下载；在「文件」App 中点按 ZIP 解压，将解压出的文件夹移动到：

```
iCloud 云盘 / Scripting / scripts / vibe-usage-widgets
```

脚本随即自动出现在 Scripting 应用中。（电脑用户也可直接 `git clone` 到上述 iCloud 目录。）

### 获取 API 密钥

小组件通过 Vibe Usage 云端 API 读取数据，需要你的个人密钥授权：

1. 若尚未使用过 Vibe Usage：先在电脑上运行 `npx @vibe-cafe/vibe-usage`，按提示在浏览器中登录——这一步会创建账户并开始将用量数据同步到 [vibecafe.ai/usage](https://vibecafe.ai/usage)
2. 登录后打开 [vibecafe.ai/usage/setup](https://vibecafe.ai/usage/setup)（手机上也可操作），生成并复制以 `vbu_` 开头的 API 密钥
3. 请妥善保管密钥：持有它即可读取你的用量数据。本项目仅将密钥存于 iOS 钥匙串，且只发送给 `vibecafe.ai`

### 配置步骤

1. 在 Scripting 中打开脚本，进入设置页，粘贴 `vbu_` 密钥并点击「测试连接」
2. 按需调整统计周期（1/7/30/90 天）、排行排序、主题、语言等，设置即时保存
3. 回到主屏幕长按添加 **Scripting** 小组件，选择所需尺寸，在「编辑小组件」中选定本脚本

### 小组件参数（Parameter）

在「编辑小组件」的 Parameter 字段填入 JSON，即可让该小组件拥有独立配置（未填写的字段沿用全局设置）。可用字段：`view` / `days` / `sort` / `accent` / `theme` / `privacy` / `currency` / `mock`，含义见上方英文表格。设置页内置了可一键复制的常用预设，例如：

```json
{"view":"models","days":30}
{"view":"projects","sort":"cost"}
{"mock":true}
```

也支持直接填写 `models` 这样的裸关键词作为 `{"view":"models"}` 的简写；非法参数会被逐字段忽略并回退全局设置。

### 已知限制

- Vibe Usage 服务端闭源，响应结构由官方客户端逆向整理而来，可能随时变化（解码器已做防御性处理，异常时降级为缓存数据）
- 月度预测为月内已发生费用的线性外推；CNY 为固定 ×7 换算，非实时汇率
- 部分数据源不上报会话记录，会话与消息计数可能相对 Token 偏低
- 小组件刷新时机最终由 iOS 系统调度，30 分钟为请求值而非保证值

### 致谢

感谢 [vibe-cafe/vibe-usage](https://github.com/vibe-cafe/vibe-usage)、[vibe-cafe/vibe-usage-app](https://github.com/vibe-cafe/vibe-usage-app) 与 [Scripting](https://scriptingapp.github.io/)。本项目为非官方社区作品，与 Vibe Cafe 无隶属关系。

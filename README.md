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
  - **Small**: one bold anchor metric with a 7-day sparkline
  - **Medium**: four stat cells over a 14-day composition chart, with a manual refresh button
  - **Large**: a shared hero band (30pt anchor metric plus trailing mini stats), a full-width section, and a session summary footer
- **Three views**, selectable globally or per widget: `overview` (daily composition trend and top agents), `models` (donut distribution and ranking), `active` (activity pulse and session stats)
- **Two trend styles**, switchable in settings: `stacked` (smooth stacked area, the default) and `multilines` (four independent smooth lines)
- **Metric basis**: rank and chart by **tokens** or by **cost**. In cost mode the trend, the legend percentages and the peak label all switch to money, so expensive output and reasoning tokens stop hiding behind cheap cache volume.
- **Composition breakdown** in four colours: input (blue), output (green), reasoning (violet), cached (sky), with a labelled legend carrying true percentages
- **Metrics**: total tokens (input + output + reasoning + cached), estimated cost, active time, cache ratio, sessions, messages, user messages, total duration, linear monthly cost forecast
- **Offline-first**: responses are cached; on network failure the widget falls back to the cache and shows an offline badge with the data timestamp
- **Refresh**: automatic reload roughly every 30 minutes (10 on failure), plus a manual refresh button on medium and large widgets
- **Appearance**: a dark palette matching the official Vibe Usage design tokens and a tuned light palette. In follow-system mode the widget sets no background of its own, so it stays compatible with the system's translucent and tinted widget rendering.
- **Languages**: English and Chinese, following the system by default
- **Per-widget configuration**: any widget instance can override the global settings through its Parameter field

### Requirements

- iOS with the [Scripting](https://scriptingapp.github.io/) app installed (available on the App Store)
- A [Vibe Usage](https://vibecafe.ai/usage) account with data syncing from your development machine(s)
- Your Vibe Usage API key (`vbu_...`), see [Getting your API key](#getting-your-api-key)

### Installation

Everything below can be done entirely on your iPhone; no computer or terminal is needed.

**Option A, import from the repository link (recommended)**

Scripting supports importing scripts straight from a URL via its `scripting://import_scripts` URL scheme. On your iPhone, copy the line below, paste it into Safari's address bar and go; Scripting opens and imports the script:

```
scripting://import_scripts?urls=https%3A%2F%2Fgithub.com%2Fzkbkb%2Fvibe-usage-widgets
```

**Option B, via iCloud Drive and the Files app**

Scripting loads scripts from its iCloud Drive folder. In Safari, open this repository and download it via **Code → Download ZIP**; in the **Files** app, tap the ZIP to extract the folder and move it to:

```
iCloud Drive / Scripting / scripts / Vibe Usage Widgets
```

The script then appears in the Scripting app automatically.

**Option C, for desktop users**

Clone the repository into the same iCloud folder from a Mac:

```bash
git clone https://github.com/zkbkb/vibe-usage-widgets.git "$HOME/Library/Mobile Documents/iCloud~com~thomfang~Scripting/Documents/scripts/Vibe Usage Widgets"
```

### Getting your API key

The widgets read your data through the Vibe Usage cloud API, authorised by a personal API key:

1. If you have not used Vibe Usage yet, set it up first: run `npx @vibe-cafe/vibe-usage` on your development machine and sign in when the browser opens. This creates your account and starts syncing your usage data to [vibecafe.ai/usage](https://vibecafe.ai/usage).
2. Once signed in, open [vibecafe.ai/usage/setup](https://vibecafe.ai/usage/setup) (works on your phone too) to generate and copy your API key. It starts with `vbu_`.
3. Keep the key private: anyone holding it can read your usage data. In this project it is stored only in the iOS Keychain and sent only to `vibecafe.ai`.

### Setup

1. Open the script in the Scripting app. The settings page appears.
2. Paste your `vbu_` API key and tap **Test connection**.
3. Adjust the options below as you like; settings save immediately.
4. Add a widget to your home screen: long-press the home screen, add a **Scripting** widget in the size you want, then in **Edit Widget** select this script.

| Setting | Options |
| --- | --- |
| Statistics period | 1 / 7 / 30 / 90 days |
| Metric basis | By tokens / By cost |
| Chart style | Area (stacked) / Lines |
| Default view | Overview / Activity / Models |
| Monthly forecast | On / off |
| Theme | System / Dark / Light |
| Currency | USD / CNY |
| Language | System / English / 中文 |

The settings page also lists the widget presets below (tap to copy) and a developer section with a preview size picker, an in-app preview button and a manual reload button.

### What each size shows

| | Overview | Models | Activity |
| --- | --- | --- | --- |
| **Small** | Token total, cost with forecast arrow, 7-day trend line, active time and cache ratio | Top 3 models with share bars, plus totals | Active time, session count, 7-day bars, message counts |
| **Medium** | Four stat cells, 14-day composition chart, composition legend | Donut ring with cost and token centre, top 3 models | Four session stat cells, 14-day activity bars |
| **Large** | Hero band, 14-day composition chart with day labels and legend, top 3 agents | Hero band, large donut ring, top 5 models | Hero band, 14-day activity pulse with day labels |

Rankings keep the top 5 entries and fold the remainder into an "Other" bucket. Lock-screen accessory widgets show the token total and cost only.

### Per-widget parameters

Every widget instance can carry its own configuration. In **Edit Widget**, set the **Parameter** field to a JSON object; any field given there overrides the global settings for that widget only.

| Field | Values | Meaning |
| --- | --- | --- |
| `view` | `"overview"` `"models"` `"active"` | Section shown on this widget |
| `days` | 1 to 90 | Statistics window |
| `sort` | `"tokens"` `"cost"` | Metric basis for ranking and charts |
| `chartStyle` | `"stacked"` `"multilines"` | Trend chart style |
| `peakTag` | `"badge"` `"ruler"` `"single"` `"none"` | Peak value label on the trend chart |
| `theme` | `"system"` `"dark"` `"light"` | Appearance |
| `currency` | `"USD"` `"CNY"` | Display currency |
| `mock` | `true` | Render deterministic demo data (no network) |

The presets offered on the settings page:

```json
{"view":"overview","chartStyle":"stacked"}
{"view":"overview","chartStyle":"multilines"}
{"view":"overview","days":30,"sort":"cost"}
{"view":"models","days":30}
{"view":"models","days":30,"sort":"cost"}
{"view":"active","days":30}
```

A bare keyword such as `models` is accepted as shorthand for `{"view":"models"}`. Invalid parameters are ignored field by field, falling back to the global settings. `peakTag` has no settings-page control and is available through the Parameter field only.

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
- Estimated cost comes from the server (`estimatedCost`); the pricing table is not public, so it is consumed, not recomputed. To support the cost basis, each bucket's cost is split across the four token categories by standard LLM pricing weights (cached input 0.15x, input 1x, output and reasoning 4x). This is an approximation used for proportions only; category totals always sum back to the server's figure.
- When the monthly forecast is enabled, a single request is widened to the start of the month and sliced locally, never two requests per refresh. The forecast is only computed when the fetched window actually covers the month.
- The manual refresh button runs an App Intent that fetches with the widget's own window, writes the cache, and reloads all widgets.
- The API key lives in the Keychain with `first_unlock` accessibility so background refreshes work on a locked device. The response decoder treats every field as optional and coerces types defensively, so a server-side schema change degrades to the cached data instead of crashing.
- All charts are hand-drawn with `Path2D` and `PathShape` rather than Swift Charts, for exact colour control and a small memory footprint under WidgetKit's limit. Lines are Catmull-Rom smoothed into cubic Bézier segments.
- Two scaling rules keep real data readable. Line and bar charts switch to a square-root scale when one day dwarfs the rest (peak over mean above 6), so quiet days stay visible while the peak still clearly stands out. The stacked area chart scales each category by a 0.65 power and reserves a minimum band thickness for the small ones, so reasoning and output remain legible next to cache volumes that are routinely 90% of the total.

### Project structure

| Path | Responsibility |
| --- | --- |
| `widget.tsx` | Widget entry: config, cache/fetch pipeline, size routing, reload policy, accessory view |
| `index.tsx` | In-app entry: presents the settings page |
| `app_intents.tsx` | `RefreshUsageIntent` behind the widget refresh button |
| `_preview.tsx` | Development harness rendering any size, view and theme from mock data; `spike:"1"` injects an extreme day to test outlier softening |
| `api.ts` | URL building, fetch with timeout, defensive payload decoding |
| `store.ts` | Storage cache and Keychain access |
| `settings.ts` | Settings model, widget-parameter parsing, precedence resolution |
| `aggregate.ts` | Pure aggregation: totals, per-day rows, cost decomposition, rankings, forecast |
| `format.ts` | Token, cost, duration and percentage formatting |
| `theme.ts` | Dark and light token palettes, gradient and translucency helpers |
| `mock.ts` | Deterministic demo data for `{"mock":true}` |
| `l10n/` | English and Chinese string tables |
| `views/charts.tsx` | Hand-drawn chart primitives: trend line, trend bars, multi-lines, stacked area, donut ring, pill bar |
| `views/shared.tsx` | Shared widget atoms: card, stat cell, header, rank row, composition legend, message view |
| `views/small,medium,large.tsx` | Per-size layouts |
| `views/settings_view.tsx` | In-app settings UI |

Number formatting is uniform across languages: token counts always use K/M/B with two decimals (for example `3.93B`), costs fall back to four decimals below 0.01 and drop to whole units above 10,000, durations omit the minutes tail past 100 hours, and a non-zero share never rounds down to a misleading 0%.

### Notes and limitations

- The Vibe Usage server is closed-source; the response schema was reconstructed from the official clients and may change without notice (the decoder is defensive for this reason).
- The monthly forecast is a linear extrapolation of month-to-date cost.
- CNY display uses the official app's fixed x7 conversion, not a live rate.
- Some sources upload buckets without session records, so session and message counts can undercount relative to tokens.
- Widget refresh timing is ultimately budgeted by iOS; the 30-minute policy is a request, not a guarantee.
- `Widget.preview()` fails with "Message channel not found" when a `parameters` payload is passed, so the in-app preview button previews your stored settings at a chosen size instead. Per-widget presets are still testable by pasting them into a real widget's Parameter field, or through `_preview.tsx`.
- `views/charts.tsx` also exports `RidgeChart`, `CompositionBar` and a `KnobBar` alias, which are not wired into any current layout.

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
  - **小号**：一项醒目的核心指标 + 7 日迷你趋势图
  - **中号**：四项指标卡 + 14 日构成图，带手动刷新按钮
  - **大号**：共享顶部信息带（30pt 锚点指标 + 右侧迷你指标）+ 通栏内容区 + 会话统计脚注
- **三种视图**，可全局设置或按小组件单独指定：`overview`（每日构成趋势 + Top 客户端）、`models`（模型分布环形图 + 排行）、`active`（活跃脉冲 + 会话统计）
- **两种趋势线样式**，设置页可切换：`stacked`（平滑堆叠面积图，默认）与 `multilines`（四条独立平滑折线）
- **参考基准**：排行与图表可按 **Token 用量** 或 **预估费用** 驱动。切到费用后，趋势图、图例百分比与峰值标注同步转为金额，单价高的输出与推理 Token 便不会再被廉价的缓存用量淹没。
- **构成拆分**为四色：输入（蓝）、输出（绿）、推理（紫）、缓存（天蓝），图例带标签与真实百分比
- **指标**：Token 总量（输入+输出+推理+缓存）、预估费用、活跃时长、缓存占比、会话数、消息数、用户消息数、总时长、月度费用线性预测
- **离线优先**：响应自动缓存；网络失败时回退到缓存数据，并显示离线徽标与数据时间
- **刷新机制**：约每 30 分钟自动刷新（失败后 10 分钟重试），中号与大号支持点击手动刷新
- **外观**：深色配色复刻官方设计 token，浅色为适配调校版。跟随系统时小组件不设置自身背景，因此能与系统的半透明、着色渲染保持兼容。
- **语言**：中文、英文、跟随系统
- **按小组件配置**：任一小组件都可通过 Parameter 字段覆盖全局设置

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
iCloud 云盘 / Scripting / scripts / Vibe Usage Widgets
```

脚本随即自动出现在 Scripting 应用中。（电脑用户也可直接 `git clone` 到上述 iCloud 目录。）

### 获取 API 密钥

小组件通过 Vibe Usage 云端 API 读取数据，需要你的个人密钥授权：

1. 若尚未使用过 Vibe Usage：先在电脑上运行 `npx @vibe-cafe/vibe-usage`，按提示在浏览器中登录。这一步会创建账户并开始将用量数据同步到 [vibecafe.ai/usage](https://vibecafe.ai/usage)
2. 登录后打开 [vibecafe.ai/usage/setup](https://vibecafe.ai/usage/setup)（手机上也可操作），生成并复制以 `vbu_` 开头的 API 密钥
3. 请妥善保管密钥：持有它即可读取你的用量数据。本项目仅将密钥存于 iOS 钥匙串，且只发送给 `vibecafe.ai`

### 配置步骤

1. 在 Scripting 中打开脚本，进入设置页，粘贴 `vbu_` 密钥并点击「测试连接」
2. 按需调整下列选项，设置即时保存
3. 回到主屏幕长按添加 **Scripting** 小组件，选择所需尺寸，在「编辑小组件」中选定本脚本

| 设置项 | 可选值 |
| --- | --- |
| 统计周期 | 1 / 7 / 30 / 90 天 |
| 参考基准 | 按 Token 用量 / 按预估费用 |
| 趋势线样式 | 面积 / 折线 |
| 默认视图 | 概览 / 活跃 / 模型 |
| 月度预测 | 开 / 关 |
| 主题 | 跟随系统 / 深色 / 浅色 |
| 货币 | USD / CNY |
| 语言 | 跟随系统 / English / 中文 |

设置页还提供下文的参数预设（点击即复制），以及开发者区的预览尺寸选择、应用内预览与立即刷新按钮。

### 各尺寸呈现内容

| | 概览 | 模型 | 活跃 |
| --- | --- | --- | --- |
| **小号** | Token 总量、费用与预测箭头、7 日趋势线、活跃时长与缓存占比 | Top 3 模型占比条 + 合计 | 活跃时长、会话数、7 日条形图、消息计数 |
| **中号** | 四项指标卡 + 14 日构成图 + 构成图例 | 环形图（中心含费用与 Token）+ Top 3 模型 | 四项会话指标卡 + 14 日活跃条形图 |
| **大号** | 顶部信息带 + 带日期标签的 14 日构成图与图例 + Top 3 客户端 | 顶部信息带 + 大号环形图 + Top 5 模型 | 顶部信息带 + 带日期标签的 14 日活跃脉冲 |

排行保留前 5 名，其余归入「其他」桶。锁屏 accessory 小组件仅显示 Token 总量与费用。

### 小组件参数（Parameter）

在「编辑小组件」的 Parameter 字段填入 JSON，即可让该小组件拥有独立配置（未填写的字段沿用全局设置）：

| 字段 | 可选值 | 含义 |
| --- | --- | --- |
| `view` | `"overview"` `"models"` `"active"` | 该小组件显示的视图 |
| `days` | 1 至 90 | 统计周期 |
| `sort` | `"tokens"` `"cost"` | 排行与图表的参考基准 |
| `chartStyle` | `"stacked"` `"multilines"` | 趋势图样式 |
| `peakTag` | `"badge"` `"ruler"` `"single"` `"none"` | 趋势图上的峰值标注形式 |
| `theme` | `"system"` `"dark"` `"light"` | 外观 |
| `currency` | `"USD"` `"CNY"` | 显示货币 |
| `mock` | `true` | 使用确定性演示数据（不联网） |

设置页内置的预设：

```json
{"view":"overview","chartStyle":"stacked"}
{"view":"overview","chartStyle":"multilines"}
{"view":"overview","days":30,"sort":"cost"}
{"view":"models","days":30}
{"view":"models","days":30,"sort":"cost"}
{"view":"active","days":30}
```

也支持直接填写 `models` 这样的裸关键词作为 `{"view":"models"}` 的简写；非法参数会被逐字段忽略并回退全局设置。`peakTag` 在设置页没有对应控件，仅能通过 Parameter 指定。

### 实现要点

- Vibe Usage API 只返回 30 分钟粒度的原始用量桶与会话记录，服务端没有任何分组统计接口，因此按日 / 模型 / 项目 / 客户端的聚合全部在设备端完成，与官方 macOS 应用的做法一致
- 预估费用来自服务端字段 `estimatedCost`，官方定价表未公开，故只消费不重算。为支撑「按费用」基准，每个桶的费用会按通用 LLM 定价权重（缓存输入 0.15x、输入 1x、输出与推理 4x）拆分到四个 Token 分类。这只是用于计算占比的近似，各分类合计始终等于服务端给出的金额。
- 开启月度预测时，只是把同一次请求的窗口拓宽到月初再在本地切片，不会每次刷新发两次请求；且仅当实际拉取的窗口确实覆盖当月时才计算预测值
- 手动刷新按钮走 App Intent，它会以该小组件自己的统计窗口发起请求、写入缓存并刷新全部小组件
- API 密钥以 `first_unlock` 可访问性存于钥匙串，因此锁屏状态下的后台刷新仍可工作。响应解码器将所有字段视为可选并做防御性类型转换，服务端结构变动时会降级为缓存数据而非崩溃
- 所有图表均以 `Path2D` + `PathShape` 手绘，而非 Swift Charts，以获得精确的配色控制并在 WidgetKit 内存上限内保持轻量；折线经 Catmull-Rom 平滑为三次贝塞尔曲线
- 两套缩放策略保证真实数据可读：当某天远超其余（峰值与均值之比大于 6）时，折线与条形图切换为平方根刻度，让低谷日仍然可见、同时峰值依旧明显更高；堆叠面积图则对各分类取 0.65 次幂，并为小分类保留最小可见厚度，使推理与输出在常年占比 90% 的缓存量旁边依然清晰

### 项目结构

| 路径 | 职责 |
| --- | --- |
| `widget.tsx` | 小组件入口：配置解析、缓存/请求流水线、尺寸路由、刷新策略、accessory 视图 |
| `index.tsx` | 应用内入口：呈现设置页 |
| `app_intents.tsx` | 刷新按钮背后的 `RefreshUsageIntent` |
| `_preview.tsx` | 开发预览载体，可用模拟数据渲染任意尺寸、视图与主题；`spike:"1"` 可注入极端值以验证离群值柔化 |
| `api.ts` | URL 构造、带超时的请求、防御性响应解码 |
| `store.ts` | Storage 缓存与钥匙串读写 |
| `settings.ts` | 设置模型、Parameter 解析、优先级合并 |
| `aggregate.ts` | 纯聚合：总量、按日行、费用拆分、排行、预测 |
| `format.ts` | Token / 费用 / 时长 / 百分比格式化 |
| `theme.ts` | 深浅色配色 token、渐变与半透明辅助函数 |
| `mock.ts` | `{"mock":true}` 使用的确定性演示数据 |
| `l10n/` | 中英文案表 |
| `views/charts.tsx` | 手绘图表原语：趋势线、趋势条、多折线、堆叠面积、环形图、胶囊条 |
| `views/shared.tsx` | 共享 UI 原子：卡片、指标格、表头、排行行、构成图例、消息视图 |
| `views/small,medium,large.tsx` | 各尺寸布局 |
| `views/settings_view.tsx` | 应用内设置界面 |

数值格式在各语言下保持统一：Token 一律以 K/M/B 加两位小数呈现（例如 `3.93B`）；费用低于 0.01 时保留四位小数、高于 10000 时取整；时长超过 100 小时后省略分钟；非零占比不会被四舍五入成误导性的 0%。

### 已知限制

- Vibe Usage 服务端闭源，响应结构由官方客户端逆向整理而来，可能随时变化（解码器已做防御性处理，异常时降级为缓存数据）
- 月度预测为月内已发生费用的线性外推；CNY 为固定 x7 换算，非实时汇率
- 部分数据源不上报会话记录，会话与消息计数可能相对 Token 偏低
- 小组件刷新时机最终由 iOS 系统调度，30 分钟为请求值而非保证值
- `Widget.preview()` 一旦传入 `parameters` 就会报 "Message channel not found"，因此设置页的预览按钮改为按所选尺寸预览当前已保存的设置。若要验证各预设，可将其粘贴到真实小组件的 Parameter 字段，或使用 `_preview.tsx`
- `views/charts.tsx` 另外导出了 `RidgeChart`、`CompositionBar` 以及 `KnobBar` 别名，目前未被任何布局使用

### 致谢

感谢 [vibe-cafe/vibe-usage](https://github.com/vibe-cafe/vibe-usage)、[vibe-cafe/vibe-usage-app](https://github.com/vibe-cafe/vibe-usage-app) 与 [Scripting](https://scriptingapp.github.io/)。本项目为非官方社区作品，与 Vibe Cafe 无隶属关系。

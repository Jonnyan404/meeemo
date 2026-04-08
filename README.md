<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="Meeemo icon" />
</p>

<h1 align="center">Meeemo</h1>

<p align="center">
  <b>A translucent, Raycast-style memo app that lives in your macOS menu bar.</b>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#development">Development</a> ·
  <a href="#中文说明">中文说明</a>
</p>

---

## Update Log

### v0.2.0

**TODO Task**
- **Task Reminders & Notify** — Set due date & time on any todo. Notified via tray dropdown popup (with color-highlighted due status) or system notification. Configurable lead time and notification type (tray / system / both).
- **Overdue Tracking** — Tray badge shows overdue count (`2!·4`). Overdue tasks highlighted in amber with auto-expanding alert banner.
- **Recycle Bin** — Deleted tasks move to a trash tab. Restore or permanently delete anytime.

**Note Editor**
- **Image Support** — Paste or drag images into the editor. Stored locally in `~/meeemo/assets`.
- **Configurable Shortcut Landing** — Global hotkey target is now configurable: open command palette, notes, or todo panel.
- **Inline Calculator** — Type `10 + 20 =` and a ghost result appears. Press Tab to confirm. Supports complex math (`sqrt(144)`, `2^10`, `sin(45 deg)`), unit conversion (`5 kg to lb`, `100 cm to inch`), and full-width CJK symbols (`（）×÷，`).

**Bug Fixes**
- Fixed bullet points (`-`) not rendering in Markdown editor mode.

---

## Features

- **Command Palette** — Press `⌥ Space` to summon a Raycast-style palette. Search, create, and open memos instantly.
- **Translucent Editor** — Frameless, frosted-glass window with native macOS vibrancy. Adjustable opacity, panel color, and font color.
- **Markdown & Plain Text** — Switch between a rich Tiptap editor (with task lists) and a plain-text mode. All memos are stored as `.md` files.
- **Todo from Tray** — Click the menu bar icon to pop open a lightweight todo panel. Drag to reorder, organize with multiple tabs.
- **Always on Top** — Pin the editor above all windows, keep it at normal level, or push it behind everything.
- **Local-first** — All data lives in `~/meeemo` as plain Markdown files. No account, no cloud, no telemetry.
- **Configurable Shortcut** — Remap the global hotkey in Settings.
- **Multi-monitor** — Palette and editor always appear on the display where your cursor is.

## Installation

Download the latest `.dmg` from [Releases](https://github.com/KasparChen/meeemo/releases), open it and drag **Meeemo** to Applications.

> Requires macOS 12+.

## Usage

| Action | How |
|---|---|
| Open palette | `⌥ Space` (default, configurable) |
| Create memo | Type a name in the palette and press Enter |
| Search memos | Start typing in the palette |
| Open todo | Click the ✓ icon in the menu bar |
| Toggle always-on-top | Editor header → Menu → Always on Top |
| Switch Markdown / Plain Text | Editor header toggle button |
| Change appearance | Editor header → Settings (opacity, color, blur) |
| Change storage path | Editor header → Settings → Storage Path |

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build Apple Silicon DMG
npm run dist:mac:arm64

# Build Intel DMG (targets macOS 12.7.6)
npm run dist:mac:x64
```

### CI release

- GitHub Actions workflow: `.github/workflows/build-macos-dmg.yml`
- Trigger methods:
  - Manually via `workflow_dispatch`
  - Publish a GitHub Release
- Outputs:
  - `Meeemo-<version>-mac-arm64.dmg`
  - `Meeemo-<version>-mac-x64.dmg`
- The Intel (`x64`) build is generated on `macos-15-intel` and pins `MACOSX_DEPLOYMENT_TARGET=12.7` with `minimumSystemVersion=12.7.6` to keep compatibility with Intel Macs running macOS 12.7.6.

### Tech stack

- **Electron** + **electron-vite** — app shell & build tooling
- **React 19** + **TypeScript** — renderer
- **Tailwind CSS 4** — styling
- **Tiptap** — rich-text / Markdown editor
- **Native macOS vibrancy** addon (N-API) — real frosted-glass effect

### Project structure

```
src/
  main/          # Electron main process
    index.ts     # App entry, global shortcut, IPC
    windows.ts   # Palette / Editor / Todo window management
    memo-service.ts   # CRUD for Markdown memo files
    todo-service.ts   # Todo list persistence
    tray.ts      # Menu bar tray icon + badge
    config.ts    # App config (~/meeemo/config.json)
  preload/       # Context bridge
  renderer/
    src/
      palette/   # Command palette UI
      editor/    # Memo editor (Tiptap + plain text)
      todo/      # Todo panel UI
native/          # macOS vibrancy N-API addon
resources/       # App icon
```

---

## 中文说明

### 简介

Meeemo 是一款 macOS 桌面便签应用，灵感来自 Raycast。按下快捷键即可唤起命令面板，快速创建、搜索和编辑备忘录。编辑器窗口支持原生毛玻璃半透明效果，可自定义透明度、面板颜色和字体颜色。

### 更新日志

#### v0.2.0

**TODO 待办**
- **任务提醒与通知** — 为待办设置到期时间，通过 Tray 下拉弹窗（带颜色高亮的 due 状态）或系统通知提醒，支持配置提前通知时间和通知方式
- **逾期追踪** — Tray 角标显示逾期数量（`2!·4`），逾期任务 amber 高亮，自动展开提醒横幅
- **回收站** — 删除的任务进入回收站 Tab，可恢复或永久删除

**笔记编辑器**
- **图片支持** — 编辑器内粘贴或拖拽图片，本地存储于 `~/meeemo/assets`
- **快捷键落地配置** — 全局热键目标可配置：打开命令面板、笔记或待办
- **内联计算器** — 输入 `10 + 20 =` 后出现半透明预测结果，按 Tab 确认。支持复杂运算（`sqrt(144)`、`2^10`、`sin(45 deg)`）、单位换算（`5 kg to lb`、`100 cm to inch`），以及中文全角符号（`（）×÷，`）

**Bug 修复**
- 修复 Markdown 编辑模式下 `-` 列表不显示 bullet point 的问题

### 主要特性

- **命令面板** — 按 `⌥ Space` 唤起，即搜即创建
- **半透明编辑器** — 无边框毛玻璃窗口，原生 macOS vibrancy 效果
- **Markdown & 纯文本** — 富文本编辑器（支持任务列表）与纯文本模式一键切换，所有内容以 `.md` 文件存储
- **菜单栏待办** — 点击菜单栏图标弹出轻量待办面板，支持拖拽排序和多标签页
- **窗口置顶** — 编辑器可置顶、常规层级或置底
- **本地优先** — 数据保存在 `~/meeemo`，纯 Markdown 文件，无需账号、无云端、无遥测
- **自定义快捷键** — 在设置中修改全局热键
- **多显示器** — 面板和编辑器始终出现在光标所在的屏幕

### 安装

从 [Releases](https://github.com/KasparChen/meeemo/releases) 下载最新 `.dmg`，打开后将 **Meeemo** 拖入"应用程序"文件夹。

> 需要 macOS 12 及以上版本。

### 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建 Apple Silicon DMG
npm run dist:mac:arm64

# 构建 Intel DMG（目标兼容 macOS 12.7.6）
npm run dist:mac:x64
```

### CI 自动构建

- GitHub Actions 工作流：`.github/workflows/build-macos-dmg.yml`
- 触发方式：
  - 手动执行 `workflow_dispatch`
  - 发布 GitHub Release
- 产物：
  - `Meeemo-<version>-mac-arm64.dmg`
  - `Meeemo-<version>-mac-x64.dmg`
- Intel (`x64`) 构建运行在 `macos-15-intel`，并固定 `MACOSX_DEPLOYMENT_TARGET=12.7` 与 `minimumSystemVersion=12.7.6`，用于兼容 macOS 12.7.6 的 Intel 机器。

---

## License

[GPL-3.0](LICENSE)

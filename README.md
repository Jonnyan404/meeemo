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

# Build distributable DMG
npm run dist
```

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

# 构建 DMG 安装包
npm run dist
```

---

## License

[GPL-3.0](LICENSE)

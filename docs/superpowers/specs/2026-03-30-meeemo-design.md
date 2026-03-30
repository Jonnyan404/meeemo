# Meeemo — Desktop Memo & TODO App Design Spec

## Overview

A Raycast-style desktop app for macOS that provides a global hotkey-activated command palette for quick access to memos and TODO lists. Memos are floating, always-accessible editor windows with window control capabilities (transparency, z-level, drag, resize). TODOs are accessible from both the system tray and the memo editor.

**Visual style**: Frosted glass (vibrancy) material throughout — all panels use background transparency + gaussian blur. Supports light and dark mode (default: light). User can adjust blur intensity, panel background color, and font color in settings.

## Tech Stack

- **Framework**: Electron
- **Frontend**: React
- **WYSIWYG Editor**: Tiptap (ProseMirror-based)
- **Plain Text**: Native `<textarea>`
- **Storage**: Local Markdown/JSON files on disk
- **Build**: electron-builder

## Data Storage

### Directory Structure

```
~/meeemo/                      # Default root, configurable in settings
├── memo/
│   ├── meeting-notes.md
│   ├── ideas.md
│   └── ...
├── todo/
│   ├── work.md
│   ├── life.md
│   └── ...
└── config.json                # App settings (directory path, pinned memos, window state)
```

### Memo Files

Standard `.md` files. Filename = title (user can rename via editor title bar). No frontmatter required for MVP; pin state and metadata stored in `config.json`.

### TODO Files

Each `.md` file is one TODO list. Filename = list name. Standard Markdown checkbox format:

```markdown
- [ ] Buy coffee
- [x] Write weekly report
- [ ] Review PR #42
```

Task order in the file = display order (drag-to-reorder writes back to file). Completed tasks are always sorted to the bottom.

### config.json

```json
{
  "storagePath": "~/meeemo",
  "pinnedMemos": ["ideas.md", "meeting-notes.md"],
  "globalShortcut": "Alt+Space",
  "theme": "light",
  "lastWindowState": {
    "x": 1200,
    "y": 100,
    "width": 400,
    "height": 450,
    "opacity": 1.0,
    "blur": 20,
    "panelColor": "#ffffff",
    "fontColor": "#1a1a1a",
    "alwaysOnTop": "normal"
  }
}
```

## Windows

### 1. Command Palette

**Trigger**: Global shortcut (default `Option+Space`, user-configurable in settings)

**Window properties**:
- `BrowserWindow`, frameless, centered on screen
- `show: false` by default, toggled by shortcut
- Fixed width (~600px), dynamic height based on results
- Rounded corners, subtle shadow

**Layout — Default (no search input)**:

```
┌──────────────────────────────────┐
│  🔍 Search memos...              │
├──────────────────────────────────┤
│  ✏️  Create New Memo              │
│  ☑️  Check Tasks                  │
│  ─────────────────               │
│  📌 Pinned Memo A                │
│  📌 Pinned Memo B                │
│  ─────────────────               │
│  📄 Recent Memo C                │
│  📄 Recent Memo D                │
│  📄 ...                          │
└──────────────────────────────────┘
```

- Quick actions (Create New Memo, Check Tasks) at top
- Pinned memos below quick actions
- All other memos sorted by last modified time

**Layout — Search active**:

```
┌──────────────────────────────────┐
│  🔍 "meeting"                    │
├──────────────────────────────────┤
│  📄 Meeting Notes (title match)  │
│  📄 Q1 Planning (content match)  │
│  ─────────────────               │
│  ✏️  Create "meeting"             │
└──────────────────────────────────┘
```

- Fuzzy match against filename + full file content (substring match)
- Most relevant results first
- "Create {query}" pinned at bottom

**Keyboard navigation**: Arrow keys to select, Enter to open, Esc to close palette

**Actions**:
- Select memo → open Memo Editor window
- Select "Create New Memo" → create `.md` file → open in editor
- Select "Check Tasks" → open TODO popover from tray

### 2. Memo Editor

**Window properties**:
- `BrowserWindow`, frameless, custom title bar
- Default position: top-right of screen
- Default size: width ~400px, height ~1/3 screen height
- Resizable, draggable
- `setOpacity()` and `setAlwaysOnTop()` controllable
- Remembers last position/size/opacity/level in config.json

**Layout — Default state** (only editor + close button visible):

```
┌─────────────────────────────────────────┐
│                                       x │
│                                         │
│           Editor area                   │
│                                         │
└─────────────────────────────────────────┘
```

**Layout — Hover on top edge** (header revealed with fade-in):

```
┌─────────────────────────────────────────┐
│ ⚙ T↕      [Document Title]         ≡ x │
├─────────────────────────────────────────┤
│                                         │
│           Editor area                   │
│                                         │
└─────────────────────────────────────────┘
```

**Header controls**:

- **⚙ (Settings popover)**:
  - Opacity slider (0.3 ~ 1.0)
  - Blur intensity slider (0 ~ 30px)
  - Panel background color picker
  - Font color picker
  - Window level: Always on top / Always on bottom / Normal
  - Theme toggle: Light / Dark
  - Storage directory setting
- **T↕**: Toggle between plain text mode and WYSIWYG mode
- **[Document Title]**: Centered, click to edit (renames the `.md` file)
- **≡ (Menu popover)**:
  - Top row: [New] [Pin/Unpin] [Delete] — horizontal icon buttons
  - Below: Switch to TODO view
  - Below: Document list (switch to another memo)
  - (Rename is done by clicking the title in header, not in this menu)
- **x**: Close window (always visible, even without hover)

**Plain text mode**: `<textarea>` with monospace font, no formatting, raw Markdown source

**WYSIWYG mode**: Tiptap editor with:
- Headings (H1-H3)
- Bold, italic, strikethrough
- Bullet/numbered lists
- Task lists (checkboxes)
- Code blocks
- Links
- Markdown shortcuts (type `##` → H2, `**text**` → bold, etc.)

Both modes read/write the same `.md` file.

### 3. TODO Tray Popover

**Trigger**: Click system tray icon

**Tray icon**: App icon with badge showing total uncompleted task count across all lists

**Layout**:

```
┌──────────────────────────┐
│ ☐ Buy coffee             │
│ ☐ Review PR #42          │
│ ☑ Write weekly report    │  ← completed tasks at bottom (filterable)
│ + Add task...            │
├──────────────────────────┤
│ Work │ Life │ + │  🔽  ⚙ │
└──────────────────────────┘
```

**Task area**:
- Uncompleted tasks on top, completed tasks at bottom
- Click checkbox to toggle completion
- Drag to reorder tasks (writes order back to `.md` file)
- Hover on task → show delete button
- "Add task..." input at bottom of task list
- 🔽 filter button: toggle show/hide completed tasks

**Bottom tab bar**:
- Tabs for each TODO list (from filenames in `~/meeemo/todo/`)
- `+` button to create new list
- `⚙` for list management (rename, delete list)

**Editor entry**: TODO files can also be opened and edited in the Memo Editor via the ≡ menu, where Tiptap's task list extension provides WYSIWYG checkbox editing.

## IPC Architecture

```
Main Process
├── GlobalShortcut registration
├── Tray icon management
├── File system operations (CRUD on .md files)
├── Window management (create, position, opacity, level)
│
│── IPC Channels:
│   ├── memo:list        → return all memo files with metadata
│   ├── memo:search      → search filename + content, return matches
│   ├── memo:read        → read .md file content
│   ├── memo:write       → write .md file content
│   ├── memo:create      → create new .md file
│   ├── memo:delete      → delete .md file
│   ├── memo:rename      → rename .md file
│   ├── memo:pin         → toggle pin state in config
│   ├── todo:list        → return all todo lists
│   ├── todo:read        → read todo list
│   ├── todo:write       → write full todo list (reorder/toggle/add/delete)
│   ├── todo:create-list → create new todo list
│   ├── todo:delete-list → delete todo list
│   ├── window:set-opacity    → set window opacity
│   ├── window:set-level      → set always-on-top level
│   └── config:get/set        → read/write config.json
│
Renderer Process(es)
├── Command Palette (React)
├── Memo Editor (React + Tiptap / textarea)
└── TODO Panel (React)
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| electron | Desktop app framework |
| react, react-dom | UI framework |
| @tiptap/react | WYSIWYG editor |
| @tiptap/starter-kit | Basic Tiptap extensions |
| @tiptap/extension-task-list | Checkbox/task list support |
| @tiptap/extension-task-item | Task item nodes |
| electron-builder | Packaging and distribution |

## Scope & Non-Goals

**In scope (MVP)**:
- Global hotkey → command palette
- Memo CRUD with pin support
- Full-text search (substring match on filename + content)
- Dual-mode editor (plain text + WYSIWYG)
- Window controls (opacity, z-level, drag, resize)
- TODO lists with tray popover
- Drag-to-reorder tasks
- Filter completed tasks
- Tray icon with uncompleted count badge
- Configurable storage directory (default `~/meeemo/`)

**Not in scope (future)**:
- Cloud sync / multi-device
- Search indexing (for large file counts)
- Tags / categories for memos
- Markdown export to other formats (PDF, HTML)
- Multiple simultaneous memo editor windows
- Plugins or extensions

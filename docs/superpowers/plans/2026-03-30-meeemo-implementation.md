# Meeemo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Raycast-style desktop memo & TODO app with global hotkey, floating editor, and tray-based TODO management.

**Architecture:** Electron app with electron-vite build tooling. Main process handles file I/O, window management, global shortcuts, and tray. Three renderer views (Command Palette, Memo Editor, TODO Popover) share a React codebase loaded via different HTML entry points. IPC via contextBridge preload.

**Tech Stack:** Electron 35, electron-vite, React 19, TypeScript, Tiptap (with Markdown + TaskList extensions), Tailwind CSS 4

---

## File Structure

```
meeemo/
├── electron.vite.config.ts          # electron-vite build config
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── tailwind.config.ts
├── src/
│   ├── main/
│   │   ├── index.ts                 # App entry: creates windows, registers shortcuts, tray
│   │   ├── config.ts                # Config read/write (config.json)
│   │   ├── memo-service.ts          # Memo CRUD + search (file system)
│   │   ├── todo-service.ts          # TODO CRUD (file system)
│   │   ├── ipc.ts                   # All ipcMain.handle registrations
│   │   ├── windows.ts               # Window creation helpers (palette, editor, todo)
│   │   └── tray.ts                  # Tray icon + badge management
│   ├── preload/
│   │   └── index.ts                 # contextBridge exposing IPC methods
│   └── renderer/
│       ├── index.html               # Command Palette entry
│       ├── editor.html              # Memo Editor entry
│       ├── todo.html                # TODO Popover entry
│       ├── src/
│       │   ├── main.tsx             # React mount for Command Palette
│       │   ├── editor-main.tsx      # React mount for Memo Editor
│       │   ├── todo-main.tsx        # React mount for TODO Popover
│       │   ├── styles/
│       │   │   └── global.css       # Tailwind + base styles
│       │   ├── hooks/
│       │   │   └── use-ipc.ts       # Typed wrapper around window.api
│       │   ├── palette/
│       │   │   ├── CommandPalette.tsx
│       │   │   └── PaletteItem.tsx
│       │   ├── editor/
│       │   │   ├── MemoEditor.tsx       # Main editor container
│       │   │   ├── EditorHeader.tsx     # Hover-reveal header bar
│       │   │   ├── PlainTextEditor.tsx  # Textarea mode
│       │   │   ├── TiptapEditor.tsx     # WYSIWYG mode
│       │   │   ├── SettingsPopover.tsx  # Opacity + level controls
│       │   │   └── MenuPopover.tsx      # Doc list + actions
│       │   └── todo/
│       │       ├── TodoPopover.tsx      # Main TODO container
│       │       ├── TodoItem.tsx         # Single task row
│       │       └── TodoTabBar.tsx       # Bottom tab bar
│       └── types/
│           └── api.d.ts             # Type declarations for window.api
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Create: `src/renderer/index.html`, `src/renderer/editor.html`, `src/renderer/todo.html`
- Create: `src/main/index.ts` (minimal)
- Create: `src/preload/index.ts` (minimal)
- Create: `src/renderer/src/main.tsx` (minimal)
- Create: `src/renderer/src/styles/global.css`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd /Users/bytedance/Desktop/Projects/meeemo
npm init -y
npm install electron electron-vite react react-dom @tiptap/react @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/markdown tailwindcss @tailwindcss/vite
npm install -D typescript @types/react @types/react-dom @types/node vite
```

- [ ] **Step 2: Create package.json with correct scripts and main field**

Update `package.json`:

```json
{
  "name": "meeemo",
  "version": "0.1.0",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  },
  "dependencies": {
    "@tiptap/extension-task-item": "^2.0.0",
    "@tiptap/extension-task-list": "^2.0.0",
    "@tiptap/markdown": "^3.0.0",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "electron": "^35.0.0",
    "electron-vite": "^3.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 3: Create electron-vite config**

Create `electron.vite.config.ts`:

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          palette: resolve(__dirname, 'src/renderer/index.html'),
          editor: resolve(__dirname, 'src/renderer/editor.html'),
          todo: resolve(__dirname, 'src/renderer/todo.html')
        }
      }
    }
  }
})
```

- [ ] **Step 4: Create TypeScript configs**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true
  },
  "include": ["src/main/**/*", "src/preload/**/*", "electron.vite.config.ts"]
}
```

Create `tsconfig.web.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "outDir": "./out",
    "rootDir": "./src/renderer/src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true,
    "paths": {
      "@/*": ["./src/renderer/src/*"]
    }
  },
  "include": ["src/renderer/src/**/*", "src/renderer/types/**/*"]
}
```

- [ ] **Step 5: Create HTML entry points**

Create `src/renderer/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeemo</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/main.tsx"></script>
</body>
</html>
```

Create `src/renderer/editor.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeemo Editor</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/editor-main.tsx"></script>
</body>
</html>
```

Create `src/renderer/todo.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeemo TODO</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/todo-main.tsx"></script>
</body>
</html>
```

- [ ] **Step 6: Create minimal main process entry**

Create `src/main/index.ts`:

```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createPaletteWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/palette/index.html'))
  }

  win.once('ready-to-show', () => win.show())
  return win
}

app.whenReady().then(() => {
  createPaletteWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 7: Create minimal preload script**

Create `src/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
})
```

- [ ] **Step 8: Create minimal React entry and global styles**

Create `src/renderer/src/styles/global.css`:

```css
@import 'tailwindcss';

:root {
  --panel-bg: rgba(255, 255, 255, 0.85);
  --panel-blur: 20px;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: rgba(0, 0, 0, 0.1);
  --accent: #007aff;
}

[data-theme="dark"] {
  --panel-bg: rgba(28, 28, 30, 0.85);
  --text-primary: #f2f2f2;
  --text-secondary: #8e8e93;
  --border-color: rgba(255, 255, 255, 0.1);
  --accent: #5b8def;
}

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text-primary);
  -webkit-app-region: no-drag;
  user-select: none;
}

.frosted-glass {
  background: var(--panel-bg);
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
}
```

Create `src/renderer/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

function App() {
  return <div className="p-4 text-white">Meeemo Command Palette</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Create `src/renderer/src/editor-main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

function App() {
  return <div className="p-4 text-white">Meeemo Editor</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Create `src/renderer/src/todo-main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

function App() {
  return <div className="p-4 text-white">Meeemo TODO</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 9: Verify the app launches**

Run: `cd /Users/bytedance/Desktop/Projects/meeemo && npm run dev`

Expected: Electron window opens showing "Meeemo Command Palette" text.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold electron-vite project with React + Tailwind"
```

---

### Task 2: Config & File Service (Main Process)

**Files:**
- Create: `src/main/config.ts`
- Create: `src/main/memo-service.ts`
- Create: `src/main/todo-service.ts`

- [ ] **Step 1: Create config service**

Create `src/main/config.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
  blur: number
  panelColor: string
  fontColor: string
  alwaysOnTop: 'always' | 'normal' | 'bottom'
}

export interface AppConfig {
  storagePath: string
  pinnedMemos: string[]
  globalShortcut: string
  theme: 'light' | 'dark'
  lastWindowState: WindowState
}

const DEFAULT_CONFIG: AppConfig = {
  storagePath: join(homedir(), 'meeemo'),
  pinnedMemos: [],
  globalShortcut: 'Alt+Space',
  theme: 'light',
  lastWindowState: {
    x: -1,
    y: -1,
    width: 400,
    height: 450,
    opacity: 0.85,
    blur: 20,
    panelColor: '#ffffff',
    fontColor: '#1a1a1a',
    alwaysOnTop: 'normal'
  }
}

function configPath(storagePath: string): string {
  return join(storagePath, 'config.json')
}

export function ensureStorageDirs(storagePath: string): void {
  mkdirSync(join(storagePath, 'memo'), { recursive: true })
  mkdirSync(join(storagePath, 'todo'), { recursive: true })
}

export function loadConfig(): AppConfig {
  const defaultPath = DEFAULT_CONFIG.storagePath
  const cfgFile = configPath(defaultPath)

  if (!existsSync(cfgFile)) {
    ensureStorageDirs(defaultPath)
    writeFileSync(cfgFile, JSON.stringify(DEFAULT_CONFIG, null, 2))
    return { ...DEFAULT_CONFIG }
  }

  const raw = readFileSync(cfgFile, 'utf-8')
  const saved = JSON.parse(raw) as Partial<AppConfig>
  const config = { ...DEFAULT_CONFIG, ...saved }
  ensureStorageDirs(config.storagePath)
  return config
}

export function saveConfig(config: AppConfig): void {
  ensureStorageDirs(config.storagePath)
  writeFileSync(configPath(config.storagePath), JSON.stringify(config, null, 2))
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const config = loadConfig()
  const updated = { ...config, ...partial }
  saveConfig(updated)
  return updated
}
```

- [ ] **Step 2: Create memo service**

Create `src/main/memo-service.ts`:

```typescript
import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync, statSync } from 'fs'
import { join, basename, extname } from 'path'
import { loadConfig } from './config'

export interface MemoMeta {
  filename: string
  title: string
  modifiedAt: number
  preview: string
}

function memoDir(): string {
  return join(loadConfig().storagePath, 'memo')
}

export function listMemos(): MemoMeta[] {
  const dir = memoDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))

  return files
    .map((filename) => {
      const filepath = join(dir, filename)
      const stat = statSync(filepath)
      const content = readFileSync(filepath, 'utf-8')
      const firstLine = content.split('\n').find((l) => l.trim().length > 0) || ''
      return {
        filename,
        title: basename(filename, '.md'),
        modifiedAt: stat.mtimeMs,
        preview: firstLine.slice(0, 100)
      }
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
}

export function searchMemos(query: string): MemoMeta[] {
  const q = query.toLowerCase()
  const all = listMemos()

  return all
    .map((memo) => {
      const titleMatch = memo.title.toLowerCase().includes(q)
      const content = readFileSync(join(memoDir(), memo.filename), 'utf-8').toLowerCase()
      const contentMatch = content.includes(q)
      if (!titleMatch && !contentMatch) return null

      const contentSnippet = contentMatch ? extractSnippet(content, q) : ''
      return {
        ...memo,
        preview: titleMatch ? `Title match` : contentSnippet,
        _score: titleMatch ? 2 : 1
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b as any)._score - (a as any)._score) as MemoMeta[]
}

function extractSnippet(content: string, query: string): string {
  const idx = content.indexOf(query)
  if (idx === -1) return ''
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + query.length + 30)
  return '...' + content.slice(start, end).replace(/\n/g, ' ') + '...'
}

export function readMemo(filename: string): string {
  return readFileSync(join(memoDir(), filename), 'utf-8')
}

export function writeMemo(filename: string, content: string): void {
  writeFileSync(join(memoDir(), filename), content)
}

export function createMemo(title: string): string {
  const filename = `${title}.md`
  const filepath = join(memoDir(), filename)
  writeFileSync(filepath, '')
  return filename
}

export function deleteMemo(filename: string): void {
  unlinkSync(join(memoDir(), filename))
}

export function renameMemo(oldFilename: string, newTitle: string): string {
  const newFilename = `${newTitle}.md`
  renameSync(join(memoDir(), oldFilename), join(memoDir(), newFilename))
  return newFilename
}
```

- [ ] **Step 3: Create todo service**

Create `src/main/todo-service.ts`:

```typescript
import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs'
import { join, basename } from 'path'
import { loadConfig } from './config'

export interface TodoTask {
  text: string
  done: boolean
}

export interface TodoList {
  filename: string
  name: string
  tasks: TodoTask[]
}

function todoDir(): string {
  return join(loadConfig().storagePath, 'todo')
}

function parseTodoMd(content: string): TodoTask[] {
  return content
    .split('\n')
    .filter((line) => line.match(/^- \[([ x])\] /))
    .map((line) => ({
      done: line.startsWith('- [x]'),
      text: line.replace(/^- \[[ x]\] /, '')
    }))
}

function serializeTodoMd(tasks: TodoTask[]): string {
  return tasks.map((t) => `- [${t.done ? 'x' : ' '}] ${t.text}`).join('\n') + '\n'
}

export function listTodoLists(): TodoList[] {
  const dir = todoDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))

  return files.map((filename) => {
    const content = readFileSync(join(dir, filename), 'utf-8')
    return {
      filename,
      name: basename(filename, '.md'),
      tasks: parseTodoMd(content)
    }
  })
}

export function readTodoList(filename: string): TodoList {
  const content = readFileSync(join(todoDir(), filename), 'utf-8')
  return {
    filename,
    name: basename(filename, '.md'),
    tasks: parseTodoMd(content)
  }
}

export function writeTodoList(filename: string, tasks: TodoTask[]): void {
  writeFileSync(join(todoDir(), filename), serializeTodoMd(tasks))
}

export function createTodoList(name: string): string {
  const filename = `${name}.md`
  writeFileSync(join(todoDir(), filename), '')
  return filename
}

export function deleteTodoList(filename: string): void {
  unlinkSync(join(todoDir(), filename))
}

export function renameTodoList(oldFilename: string, newName: string): string {
  const newFilename = `${newName}.md`
  renameSync(join(todoDir(), oldFilename), join(todoDir(), newFilename))
  return newFilename
}

export function totalUncompleted(): number {
  return listTodoLists().reduce(
    (sum, list) => sum + list.tasks.filter((t) => !t.done).length,
    0
  )
}
```

- [ ] **Step 4: Verify files compile**

Run: `cd /Users/bytedance/Desktop/Projects/meeemo && npx tsc --noEmit -p tsconfig.node.json`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/main/config.ts src/main/memo-service.ts src/main/todo-service.ts
git commit -m "feat: add config, memo, and todo file services"
```

---

### Task 3: IPC Handlers & Preload

**Files:**
- Create: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Create: `src/renderer/types/api.d.ts`

- [ ] **Step 1: Create IPC handler registrations**

Create `src/main/ipc.ts`:

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import { listMemos, searchMemos, readMemo, writeMemo, createMemo, deleteMemo, renameMemo } from './memo-service'
import { listTodoLists, readTodoList, writeTodoList, createTodoList, deleteTodoList, renameTodoList, totalUncompleted } from './todo-service'
import { loadConfig, updateConfig, type AppConfig } from './config'

export function registerIpcHandlers(): void {
  // Memo
  ipcMain.handle('memo:list', () => listMemos())
  ipcMain.handle('memo:search', (_e, query: string) => searchMemos(query))
  ipcMain.handle('memo:read', (_e, filename: string) => readMemo(filename))
  ipcMain.handle('memo:write', (_e, filename: string, content: string) => writeMemo(filename, content))
  ipcMain.handle('memo:create', (_e, title: string) => createMemo(title))
  ipcMain.handle('memo:delete', (_e, filename: string) => deleteMemo(filename))
  ipcMain.handle('memo:rename', (_e, oldFilename: string, newTitle: string) => renameMemo(oldFilename, newTitle))

  ipcMain.handle('memo:pin', (_e, filename: string) => {
    const config = loadConfig()
    const idx = config.pinnedMemos.indexOf(filename)
    if (idx >= 0) {
      config.pinnedMemos.splice(idx, 1)
    } else {
      config.pinnedMemos.push(filename)
    }
    return updateConfig({ pinnedMemos: config.pinnedMemos })
  })

  // TODO
  ipcMain.handle('todo:list', () => listTodoLists())
  ipcMain.handle('todo:read', (_e, filename: string) => readTodoList(filename))
  ipcMain.handle('todo:write', (_e, filename: string, tasks: any[]) => writeTodoList(filename, tasks))
  ipcMain.handle('todo:create-list', (_e, name: string) => createTodoList(name))
  ipcMain.handle('todo:delete-list', (_e, filename: string) => deleteTodoList(filename))
  ipcMain.handle('todo:rename-list', (_e, oldFilename: string, newName: string) => renameTodoList(oldFilename, newName))
  ipcMain.handle('todo:uncompleted-count', () => totalUncompleted())

  // Config
  ipcMain.handle('config:get', () => loadConfig())
  ipcMain.handle('config:set', (_e, partial: Partial<AppConfig>) => updateConfig(partial))

  // Window control (operates on the sender's BrowserWindow)
  ipcMain.handle('window:set-opacity', (e, opacity: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.setOpacity(opacity)
  })

  ipcMain.handle('window:set-level', (e, level: 'always' | 'normal' | 'bottom') => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (level === 'always') {
      win.setAlwaysOnTop(true, 'floating')
    } else if (level === 'bottom') {
      win.setAlwaysOnTop(true, 'utility', -1)
    } else {
      win.setAlwaysOnTop(false)
    }
  })

  ipcMain.handle('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
}
```

- [ ] **Step 2: Expand preload script with typed API**

Replace `src/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Memo
  memoList: () => ipcRenderer.invoke('memo:list'),
  memoSearch: (query: string) => ipcRenderer.invoke('memo:search', query),
  memoRead: (filename: string) => ipcRenderer.invoke('memo:read', filename),
  memoWrite: (filename: string, content: string) => ipcRenderer.invoke('memo:write', filename, content),
  memoCreate: (title: string) => ipcRenderer.invoke('memo:create', title),
  memoDelete: (filename: string) => ipcRenderer.invoke('memo:delete', filename),
  memoRename: (oldFilename: string, newTitle: string) => ipcRenderer.invoke('memo:rename', oldFilename, newTitle),
  memoPin: (filename: string) => ipcRenderer.invoke('memo:pin', filename),

  // TODO
  todoList: () => ipcRenderer.invoke('todo:list'),
  todoRead: (filename: string) => ipcRenderer.invoke('todo:read', filename),
  todoWrite: (filename: string, tasks: { text: string; done: boolean }[]) => ipcRenderer.invoke('todo:write', filename, tasks),
  todoCreateList: (name: string) => ipcRenderer.invoke('todo:create-list', name),
  todoDeleteList: (filename: string) => ipcRenderer.invoke('todo:delete-list', filename),
  todoRenameList: (oldFilename: string, newName: string) => ipcRenderer.invoke('todo:rename-list', oldFilename, newName),
  todoUncompletedCount: () => ipcRenderer.invoke('todo:uncompleted-count'),

  // Config
  configGet: () => ipcRenderer.invoke('config:get'),
  configSet: (partial: Record<string, unknown>) => ipcRenderer.invoke('config:set', partial),

  // Window
  windowSetOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  windowSetLevel: (level: 'always' | 'normal' | 'bottom') => ipcRenderer.invoke('window:set-level', level),
  windowClose: () => ipcRenderer.invoke('window:close'),

  // Events from main
  onOpenMemo: (callback: (filename: string) => void) => {
    ipcRenderer.on('open-memo', (_e, filename: string) => callback(filename))
  },
  onShowTodo: (callback: () => void) => {
    ipcRenderer.on('show-todo', () => callback())
  }
}

contextBridge.exposeInMainWorld('api', api)

export type MeeemoAPI = typeof api
```

- [ ] **Step 3: Create type declarations for renderer**

Create `src/renderer/types/api.d.ts`:

```typescript
interface TodoTask {
  text: string
  done: boolean
}

interface MemoMeta {
  filename: string
  title: string
  modifiedAt: number
  preview: string
}

interface TodoList {
  filename: string
  name: string
  tasks: TodoTask[]
}

interface AppConfig {
  storagePath: string
  pinnedMemos: string[]
  globalShortcut: string
  theme: 'light' | 'dark'
  lastWindowState: {
    x: number
    y: number
    width: number
    height: number
    opacity: number
    blur: number
    panelColor: string
    fontColor: string
    alwaysOnTop: 'always' | 'normal' | 'bottom'
  }
}

interface MeeemoAPI {
  memoList(): Promise<MemoMeta[]>
  memoSearch(query: string): Promise<MemoMeta[]>
  memoRead(filename: string): Promise<string>
  memoWrite(filename: string, content: string): Promise<void>
  memoCreate(title: string): Promise<string>
  memoDelete(filename: string): Promise<void>
  memoRename(oldFilename: string, newTitle: string): Promise<string>
  memoPin(filename: string): Promise<AppConfig>

  todoList(): Promise<TodoList[]>
  todoRead(filename: string): Promise<TodoList>
  todoWrite(filename: string, tasks: TodoTask[]): Promise<void>
  todoCreateList(name: string): Promise<string>
  todoDeleteList(filename: string): Promise<void>
  todoRenameList(oldFilename: string, newName: string): Promise<string>
  todoUncompletedCount(): Promise<number>

  configGet(): Promise<AppConfig>
  configSet(partial: Partial<AppConfig>): Promise<AppConfig>

  windowSetOpacity(opacity: number): Promise<void>
  windowSetLevel(level: 'always' | 'normal' | 'bottom'): Promise<void>
  windowClose(): Promise<void>

  onOpenMemo(callback: (filename: string) => void): void
  onShowTodo(callback: () => void): void
}

declare global {
  interface Window {
    api: MeeemoAPI
  }
}

export {}
```

- [ ] **Step 4: Create useIpc hook**

Create `src/renderer/src/hooks/use-ipc.ts`:

```typescript
export function useApi(): MeeemoAPI {
  return window.api
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc.ts src/preload/index.ts src/renderer/types/api.d.ts src/renderer/src/hooks/use-ipc.ts
git commit -m "feat: add IPC handlers, typed preload bridge, and API types"
```

---

### Task 4: Window Management & Tray

**Files:**
- Create: `src/main/windows.ts`
- Create: `src/main/tray.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: Create window management helpers**

Create `src/main/windows.ts`:

```typescript
import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { loadConfig, updateConfig } from './config'

let paletteWindow: BrowserWindow | null = null
let editorWindow: BrowserWindow | null = null
let todoWindow: BrowserWindow | null = null

function preloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

function rendererUrl(page: string): string {
  if (process.env.ELECTRON_RENDERER_URL) {
    return `${process.env.ELECTRON_RENDERER_URL}/${page}.html`
  }
  return join(__dirname, `../renderer/${page}/index.html`)
}

function loadPage(win: BrowserWindow, page: string): void {
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${page}.html`)
  } else {
    win.loadFile(join(__dirname, `../renderer/${page}/index.html`))
  }
}

export function createPaletteWindow(): BrowserWindow {
  if (paletteWindow && !paletteWindow.isDestroyed()) {
    paletteWindow.show()
    paletteWindow.focus()
    return paletteWindow
  }

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  paletteWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: Math.round((screenW - 600) / 2),
    y: Math.round(screenH * 0.2),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    vibrancy: 'under-window',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  loadPage(paletteWindow, 'palette')

  paletteWindow.once('ready-to-show', () => paletteWindow?.show())
  paletteWindow.on('blur', () => paletteWindow?.hide())
  paletteWindow.on('closed', () => { paletteWindow = null })

  return paletteWindow
}

export function togglePalette(): void {
  if (paletteWindow && !paletteWindow.isDestroyed() && paletteWindow.isVisible()) {
    paletteWindow.hide()
  } else {
    createPaletteWindow()
  }
}

export function createEditorWindow(filename?: string): BrowserWindow {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.show()
    editorWindow.focus()
    if (filename) {
      editorWindow.webContents.send('open-memo', filename)
    }
    return editorWindow
  }

  const config = loadConfig()
  const ws = config.lastWindowState
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize
  const { height: screenH } = screen.getPrimaryDisplay().workAreaSize

  editorWindow = new BrowserWindow({
    width: ws.width,
    height: ws.height,
    x: ws.x >= 0 ? ws.x : screenW - ws.width - 40,
    y: ws.y >= 0 ? ws.y : 40,
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    minimizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  editorWindow.setOpacity(ws.opacity)
  if (ws.alwaysOnTop === 'always') {
    editorWindow.setAlwaysOnTop(true, 'floating')
  } else if (ws.alwaysOnTop === 'bottom') {
    editorWindow.setAlwaysOnTop(true, 'utility', -1)
  }

  loadPage(editorWindow, 'editor')

  editorWindow.once('ready-to-show', () => {
    editorWindow?.show()
    if (filename) {
      editorWindow?.webContents.send('open-memo', filename)
    }
  })

  editorWindow.on('close', () => {
    if (editorWindow && !editorWindow.isDestroyed()) {
      const bounds = editorWindow.getBounds()
      updateConfig({
        lastWindowState: {
          ...config.lastWindowState,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        }
      })
    }
  })

  editorWindow.on('closed', () => { editorWindow = null })

  return editorWindow
}

export function createTodoWindow(trayBounds?: Electron.Rectangle): BrowserWindow {
  if (todoWindow && !todoWindow.isDestroyed()) {
    if (todoWindow.isVisible()) {
      todoWindow.hide()
      return todoWindow
    }
    todoWindow.show()
    todoWindow.focus()
    return todoWindow
  }

  const w = 300
  const h = 400
  let x = 0
  let y = 0

  if (trayBounds) {
    x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2)
    y = trayBounds.y + trayBounds.height + 4
  }

  todoWindow = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  loadPage(todoWindow, 'todo')

  todoWindow.once('ready-to-show', () => todoWindow?.show())
  todoWindow.on('blur', () => todoWindow?.hide())
  todoWindow.on('closed', () => { todoWindow = null })

  return todoWindow
}

export function hidePalette(): void {
  if (paletteWindow && !paletteWindow.isDestroyed()) paletteWindow.hide()
}

export { paletteWindow, editorWindow, todoWindow }
```

- [ ] **Step 2: Create tray manager**

Create `src/main/tray.ts`:

```typescript
import { Tray, nativeImage } from 'electron'
import { join } from 'path'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

export function createTray(): Tray {
  // Use a simple template icon (16x16 circle for now, replace with real icon later)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  tray.setToolTip('Meeemo')
  updateTrayBadge()

  tray.on('click', (_event, bounds) => {
    createTodoWindow(bounds)
  })

  return tray
}

export function updateTrayBadge(): void {
  if (!tray) return
  const count = totalUncompleted()
  tray.setTitle(count > 0 ? `${count}` : '')
}

export function getTray(): Tray | null {
  return tray
}
```

- [ ] **Step 3: Wire everything in main index**

Replace `src/main/index.ts`:

```typescript
import { app, globalShortcut } from 'electron'
import { registerIpcHandlers } from './ipc'
import { loadConfig } from './config'
import { togglePalette, createEditorWindow, hidePalette } from './windows'
import { createTray, updateTrayBadge } from './tray'

app.whenReady().then(() => {
  const config = loadConfig()

  registerIpcHandlers()
  createTray()

  // Register global shortcut
  const shortcut = config.globalShortcut || 'Alt+Space'
  globalShortcut.register(shortcut, () => {
    togglePalette()
  })

  // IPC for opening editor from palette
  const { ipcMain } = require('electron')
  ipcMain.on('open-editor', (_e: any, filename: string) => {
    hidePalette()
    createEditorWindow(filename)
  })

  ipcMain.on('show-todo-from-palette', () => {
    hidePalette()
    const { getTray } = require('./tray')
    const tray = getTray()
    if (tray) {
      createTodoWindow(tray.getBounds())
    }
  })

  ipcMain.on('update-tray-badge', () => {
    updateTrayBadge()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running (tray app)
})
```

- [ ] **Step 4: Verify the app launches with tray**

Run: `npm run dev`

Expected: App launches with a tray icon. `Alt+Space` toggles the palette window.

- [ ] **Step 5: Commit**

```bash
git add src/main/windows.ts src/main/tray.ts src/main/index.ts
git commit -m "feat: add window management, tray icon, and global shortcut"
```

---

### Task 5: Command Palette UI

**Files:**
- Create: `src/renderer/src/palette/CommandPalette.tsx`
- Create: `src/renderer/src/palette/PaletteItem.tsx`
- Modify: `src/renderer/src/main.tsx`

- [ ] **Step 1: Create PaletteItem component**

Create `src/renderer/src/palette/PaletteItem.tsx`:

```tsx
interface PaletteItemProps {
  icon: string
  label: string
  sublabel?: string
  badge?: string
  selected: boolean
  onClick: () => void
}

export function PaletteItem({ icon, label, sublabel, badge, selected, onClick }: PaletteItemProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg mx-2 ${
        selected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate">{label}</div>
        {sublabel && <div className="text-xs text-white/40 truncate">{sublabel}</div>}
      </div>
      {badge && (
        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create CommandPalette component**

Create `src/renderer/src/palette/CommandPalette.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { PaletteItem } from './PaletteItem'
import { useApi } from '../hooks/use-ipc'

interface ListItem {
  id: string
  icon: string
  label: string
  sublabel?: string
  badge?: string
  action: () => void
}

export function CommandPalette() {
  const api = useApi()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ListItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDefaultItems = useCallback(async () => {
    const [memos, config, todoCount] = await Promise.all([
      api.memoList(),
      api.configGet(),
      api.todoUncompletedCount()
    ])

    const pinnedSet = new Set(config.pinnedMemos)
    const pinned = memos.filter((m) => pinnedSet.has(m.filename))
    const recent = memos.filter((m) => !pinnedSet.has(m.filename))

    const result: ListItem[] = [
      {
        id: 'create',
        icon: '+',
        label: 'Create New Memo',
        action: async () => {
          const title = `Untitled ${new Date().toLocaleDateString()}`
          const filename = await api.memoCreate(title)
          window.api.invoke?.('open-editor', filename)
        }
      },
      {
        id: 'tasks',
        icon: '☑',
        label: 'Check Tasks',
        badge: todoCount > 0 ? `${todoCount}` : undefined,
        action: () => {
          const { ipcRenderer } = window as any
          // Send to main process
          api.configGet() // dummy, we use send below
        }
      },
      ...pinned.map((m) => ({
        id: `pin:${m.filename}`,
        icon: '📌',
        label: m.title,
        sublabel: formatTime(m.modifiedAt),
        action: () => openMemo(m.filename)
      })),
      ...recent.map((m) => ({
        id: `memo:${m.filename}`,
        icon: '📄',
        label: m.title,
        sublabel: formatTime(m.modifiedAt),
        action: () => openMemo(m.filename)
      }))
    ]

    setItems(result)
    setSelectedIndex(0)
  }, [api])

  const loadSearchResults = useCallback(async (q: string) => {
    const results = await api.memoSearch(q)
    const result: ListItem[] = [
      ...results.map((m) => ({
        id: `result:${m.filename}`,
        icon: '📄',
        label: m.title,
        sublabel: m.preview,
        action: () => openMemo(m.filename)
      })),
      {
        id: 'create-search',
        icon: '+',
        label: `Create "${q}"`,
        action: async () => {
          const filename = await api.memoCreate(q)
          openMemo(filename)
        }
      }
    ]
    setItems(result)
    setSelectedIndex(0)
  }, [api])

  function openMemo(filename: string) {
    // Use ipcRenderer.send for fire-and-forget to main
    (window as any).__electron_ipc_send?.('open-editor', filename)
  }

  useEffect(() => {
    if (query.trim()) {
      loadSearchResults(query.trim())
    } else {
      loadDefaultItems()
    }
  }, [query, loadDefaultItems, loadSearchResults])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      window.api.windowClose()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1c1c1e] rounded-xl overflow-hidden border border-white/10">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <span className="text-white/40 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search memos..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
        />
        <span className="text-white/30 text-xs">⌥ Space</span>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto py-1">
        {items.map((item, i) => (
          <PaletteItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            sublabel={item.sublabel}
            badge={item.badge}
            selected={i === selectedIndex}
            onClick={item.action}
          />
        ))}
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}
```

- [ ] **Step 3: Update main.tsx to use CommandPalette**

Replace `src/renderer/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CommandPalette } from './palette/CommandPalette'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CommandPalette />
  </StrictMode>
)
```

- [ ] **Step 4: Add ipcRenderer.send to preload for fire-and-forget messages**

Add to `src/preload/index.ts`, before the `contextBridge.exposeInMainWorld` call:

```typescript
// Also expose send for fire-and-forget messages
contextBridge.exposeInMainWorld('__electron_ipc_send', (channel: string, ...args: unknown[]) => {
  const ALLOWED_SEND = ['open-editor', 'show-todo-from-palette', 'update-tray-badge']
  if (ALLOWED_SEND.includes(channel)) {
    ipcRenderer.send(channel, ...args)
  }
})
```

- [ ] **Step 5: Verify palette shows and lists items**

Run: `npm run dev`

Expected: `Alt+Space` opens the command palette centered on screen with search bar and default items. Arrow keys navigate, Esc closes.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/palette/ src/renderer/src/main.tsx src/preload/index.ts
git commit -m "feat: implement Command Palette with search and keyboard navigation"
```

---

### Task 6: Memo Editor — Plain Text Mode

**Files:**
- Create: `src/renderer/src/editor/PlainTextEditor.tsx`
- Create: `src/renderer/src/editor/MemoEditor.tsx`
- Modify: `src/renderer/src/editor-main.tsx`

- [ ] **Step 1: Create PlainTextEditor component**

Create `src/renderer/src/editor/PlainTextEditor.tsx`:

```tsx
import { useEffect, useRef } from 'react'

interface PlainTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function PlainTextEditor({ content, onChange }: PlainTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== content) {
      textareaRef.current.value = content
    }
  }, [content])

  return (
    <textarea
      ref={textareaRef}
      defaultValue={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="w-full h-full bg-transparent text-white/85 text-sm leading-relaxed resize-none outline-none p-6 font-mono placeholder:text-white/30"
      placeholder="Start writing..."
    />
  )
}
```

- [ ] **Step 2: Create MemoEditor container**

Create `src/renderer/src/editor/MemoEditor.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { useApi } from '../hooks/use-ipc'

export function MemoEditor() {
  const api = useApi()
  const [filename, setFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')
  const [headerVisible, setHeaderVisible] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Listen for open-memo from main process
  useEffect(() => {
    api.onOpenMemo((fname) => {
      setFilename(fname)
    })
  }, [api])

  // Load content when filename changes
  useEffect(() => {
    if (!filename) return
    api.memoRead(filename).then(setContent)
  }, [filename, api])

  // Auto-save with debounce
  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      if (!filename) return

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        api.memoWrite(filename, newContent)
      }, 500)
    },
    [filename, api]
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHeaderVisible(e.clientY < 48)
  }, [])

  return (
    <div
      className="flex flex-col h-screen bg-[#1c1c1e] rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHeaderVisible(false)}
    >
      {/* Close button - always visible */}
      <button
        onClick={() => api.windowClose()}
        className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 z-50 transition-colors"
        title="Close"
      />

      {/* Header - shown on hover */}
      <div
        className={`flex items-center gap-2 px-3 h-10 border-b border-white/10 bg-[#222224] transition-all duration-200 ${
          headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <button className="text-white/50 hover:text-white/80 text-sm" title="Settings">
          ⚙
        </button>
        <button
          onClick={() => setMode(mode === 'plain' ? 'wysiwyg' : 'plain')}
          className="text-xs bg-white/10 px-2 py-1 rounded text-white/70 hover:text-white/90"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          T↕
        </button>

        <span className="flex-1 text-center text-sm text-white/70 truncate">
          {filename ? filename.replace('.md', '') : 'Untitled'}
        </span>

        <button className="text-white/50 hover:text-white/80 text-lg" title="Menu">
          ≡
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor content={content} onChange={handleChange} />
        ) : (
          /* Tiptap editor placeholder - will be added in Task 7 */
          <PlainTextEditor content={content} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update editor-main.tsx**

Replace `src/renderer/src/editor-main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoEditor } from './editor/MemoEditor'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoEditor />
  </StrictMode>
)
```

- [ ] **Step 4: Verify editor opens from palette**

Run: `npm run dev`

Expected: Create a test memo file in `~/meeemo/memo/test.md`, open palette, select it. Editor window opens at top-right, plain text mode works. Hover top edge shows header. Close button works.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/editor/ src/renderer/src/editor-main.tsx
git commit -m "feat: implement Memo Editor with plain text mode and auto-save"
```

---

### Task 7: Memo Editor — Tiptap WYSIWYG Mode

**Files:**
- Create: `src/renderer/src/editor/TiptapEditor.tsx`
- Modify: `src/renderer/src/editor/MemoEditor.tsx`

- [ ] **Step 1: Create TiptapEditor component**

Create `src/renderer/src/editor/TiptapEditor.tsx`:

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from '@tiptap/markdown'
import { useEffect, useRef } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const isUpdatingRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({ markedOptions: { gfm: true } })
    ],
    content,
    contentType: 'markdown',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return
      const md = editor.markdown.serialize(editor.state.doc.toJSON())
      onChange(md)
    }
  })

  // Sync content from outside (e.g., file switch)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    isUpdatingRef.current = true
    editor.commands.setContent(content, false, { preserveWhitespace: 'full' })
    isUpdatingRef.current = false
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tiptap-editor p-6 text-white/85 text-sm leading-relaxed min-h-full">
      <EditorContent editor={editor} />
      <style>{`
        .tiptap-editor .tiptap {
          outline: none;
          min-height: 100%;
        }
        .tiptap-editor .tiptap h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; }
        .tiptap-editor .tiptap h2 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0 0.25em; }
        .tiptap-editor .tiptap h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; }
        .tiptap-editor .tiptap p { margin: 0.25em 0; }
        .tiptap-editor .tiptap ul, .tiptap-editor .tiptap ol { padding-left: 1.5em; }
        .tiptap-editor .tiptap code { background: rgba(255,255,255,0.1); padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; }
        .tiptap-editor .tiptap pre { background: rgba(255,255,255,0.05); padding: 0.75em 1em; border-radius: 6px; overflow-x: auto; }
        .tiptap-editor .tiptap pre code { background: none; padding: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li label { margin-top: 0.15em; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; opacity: 0.5; }
        .tiptap-editor .tiptap a { color: #5b8def; text-decoration: underline; }
        .tiptap-editor .tiptap blockquote { border-left: 3px solid rgba(255,255,255,0.2); padding-left: 1em; margin-left: 0; color: rgba(255,255,255,0.6); }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Wire TiptapEditor into MemoEditor**

In `src/renderer/src/editor/MemoEditor.tsx`, replace the placeholder comment in the editor area:

Replace this section in the `{/* Editor */}` div:

```tsx
      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor content={content} onChange={handleChange} />
        ) : (
          /* Tiptap editor placeholder - will be added in Task 7 */
          <PlainTextEditor content={content} onChange={handleChange} />
        )}
      </div>
```

With:

```tsx
      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor content={content} onChange={handleChange} />
        ) : (
          <TiptapEditor content={content} onChange={handleChange} />
        )}
      </div>
```

And add the import at the top of `MemoEditor.tsx`:

```typescript
import { TiptapEditor } from './TiptapEditor'
```

- [ ] **Step 3: Verify WYSIWYG mode**

Run: `npm run dev`

Expected: Open a memo with markdown content. WYSIWYG mode renders headings, lists, checkboxes. Click T↕ to switch between plain text and WYSIWYG. Content persists across mode switches. Typing Markdown shortcuts (## → heading, ** → bold) works.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/editor/TiptapEditor.tsx src/renderer/src/editor/MemoEditor.tsx
git commit -m "feat: add Tiptap WYSIWYG editor with Markdown serialization"
```

---

### Task 8: Memo Editor — Header Popovers

**Files:**
- Create: `src/renderer/src/editor/SettingsPopover.tsx`
- Create: `src/renderer/src/editor/MenuPopover.tsx`
- Create: `src/renderer/src/editor/EditorHeader.tsx`
- Modify: `src/renderer/src/editor/MemoEditor.tsx`

- [ ] **Step 1: Create SettingsPopover**

Create `src/renderer/src/editor/SettingsPopover.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useApi } from '../hooks/use-ipc'

interface SettingsPopoverProps {
  onClose: () => void
}

export function SettingsPopover({ onClose }: SettingsPopoverProps) {
  const api = useApi()
  const [opacity, setOpacity] = useState(0.85)
  const [blur, setBlur] = useState(20)
  const [panelColor, setPanelColor] = useState('#ffffff')
  const [fontColor, setFontColor] = useState('#1a1a1a')
  const [level, setLevel] = useState<'always' | 'normal' | 'bottom'>('normal')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    api.configGet().then((config) => {
      const ws = config.lastWindowState
      setOpacity(ws.opacity)
      setBlur(ws.blur)
      setPanelColor(ws.panelColor)
      setFontColor(ws.fontColor)
      setLevel(ws.alwaysOnTop)
      setTheme(config.theme)
    })
  }, [api])

  const updateWindowState = (partial: Record<string, unknown>) => {
    api.configSet({ lastWindowState: partial } as any)
  }

  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    api.windowSetOpacity(value)
    updateWindowState({ opacity: value })
  }

  const handleBlurChange = (value: number) => {
    setBlur(value)
    document.documentElement.style.setProperty('--panel-blur', `${value}px`)
    updateWindowState({ blur: value })
  }

  const handlePanelColorChange = (value: string) => {
    setPanelColor(value)
    updateWindowState({ panelColor: value })
  }

  const handleFontColorChange = (value: string) => {
    setFontColor(value)
    document.documentElement.style.setProperty('--text-primary', value)
    updateWindowState({ fontColor: value })
  }

  const handleLevelChange = (newLevel: 'always' | 'normal' | 'bottom') => {
    setLevel(newLevel)
    api.windowSetLevel(newLevel)
    updateWindowState({ alwaysOnTop: newLevel })
  }

  const handleThemeToggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    api.configSet({ theme: next })
  }

  return (
    <div
      className="absolute top-10 left-2 w-56 frosted-glass rounded-lg border border-[var(--border-color)] shadow-xl z-50 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Theme toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider">THEME</span>
        <button
          onClick={handleThemeToggle}
          className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white"
        >
          {theme === 'light' ? '☀ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="border-t border-[var(--border-color)] my-2" />

      {/* Opacity */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">OPACITY</div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="range" min="30" max="100"
          value={Math.round(opacity * 100)}
          onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="text-xs text-[var(--text-secondary)] w-8 text-right">{Math.round(opacity * 100)}%</span>
      </div>

      {/* Blur */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">BLUR</div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="range" min="0" max="30"
          value={blur}
          onChange={(e) => handleBlurChange(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="text-xs text-[var(--text-secondary)] w-8 text-right">{blur}px</span>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">PANEL</div>
          <input
            type="color" value={panelColor}
            onChange={(e) => handlePanelColorChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer border-0"
          />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">FONT</div>
          <input
            type="color" value={fontColor}
            onChange={(e) => handleFontColorChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer border-0"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] my-2" />

      {/* Window level */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">WINDOW LEVEL</div>
      {(['always', 'normal', 'bottom'] as const).map((l) => (
        <button
          key={l}
          onClick={() => handleLevelChange(l)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm ${
            level === l ? 'bg-[var(--accent)]/15 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="mr-2">{level === l ? '●' : '○'}</span>
          {l === 'always' ? 'Always on Top' : l === 'normal' ? 'Normal' : 'Always on Bottom'}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create MenuPopover**

Create `src/renderer/src/editor/MenuPopover.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useApi } from '../hooks/use-ipc'

interface MenuPopoverProps {
  currentFilename: string | null
  onSwitchMemo: (filename: string) => void
  onClose: () => void
}

export function MenuPopover({ currentFilename, onSwitchMemo, onClose }: MenuPopoverProps) {
  const api = useApi()
  const [memos, setMemos] = useState<MemoMeta[]>([])
  const [config, setConfig] = useState<AppConfig | null>(null)

  useEffect(() => {
    Promise.all([api.memoList(), api.configGet()]).then(([m, c]) => {
      setMemos(m)
      setConfig(c)
    })
  }, [api])

  const pinnedSet = new Set(config?.pinnedMemos || [])

  const handleNewMemo = async () => {
    const title = `Untitled ${new Date().toLocaleDateString()}`
    const filename = await api.memoCreate(title)
    onSwitchMemo(filename)
    onClose()
  }

  const handleDelete = async () => {
    if (!currentFilename) return
    await api.memoDelete(currentFilename)
    const remaining = memos.filter((m) => m.filename !== currentFilename)
    if (remaining.length > 0) {
      onSwitchMemo(remaining[0].filename)
    }
    onClose()
  }

  const handlePin = async () => {
    if (!currentFilename) return
    await api.memoPin(currentFilename)
    const c = await api.configGet()
    setConfig(c)
  }

  const handleSwitchToTodo = () => {
    ;(window as any).__electron_ipc_send?.('show-todo-from-palette')
    onClose()
  }

  return (
    <div
      className="absolute top-10 right-8 w-56 frosted-glass rounded-lg border border-[var(--border-color)] shadow-xl z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Horizontal action buttons */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border-color)]">
        <button
          onClick={handleNewMemo}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)]"
          title="New Memo"
        >
          <span className="text-lg">+</span>
          <span className="text-[10px]">New</span>
        </button>
        <button
          onClick={handlePin}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)]"
          title={currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}
        >
          <span className="text-lg">{currentFilename && pinnedSet.has(currentFilename) ? '📌' : '📍'}</span>
          <span className="text-[10px]">{currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-red-500/10 text-red-400/70"
          title="Delete"
        >
          <span className="text-lg">🗑</span>
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      {/* Switch to TODO */}
      <button
        onClick={handleSwitchToTodo}
        className="w-full text-left px-3 py-2 text-sm text-[var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 border-b border-[var(--border-color)]"
      >
        Switch to TODO
      </button>

      {/* Document list */}
      <div className="p-2 max-h-48 overflow-y-auto">
        <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider px-2 py-1">DOCUMENTS</div>
        {memos.map((m) => (
          <button
            key={m.filename}
            onClick={() => { onSwitchMemo(m.filename); onClose() }}
            className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
              m.filename === currentFilename ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {pinnedSet.has(m.filename) ? '📌 ' : '📄 '}{m.title}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create EditorHeader component**

Create `src/renderer/src/editor/EditorHeader.tsx`:

```tsx
import { useState } from 'react'
import { SettingsPopover } from './SettingsPopover'
import { MenuPopover } from './MenuPopover'
import { useApi } from '../hooks/use-ipc'

interface EditorHeaderProps {
  visible: boolean
  filename: string | null
  mode: 'plain' | 'wysiwyg'
  onToggleMode: () => void
  onSwitchMemo: (filename: string) => void
  onRename: (newTitle: string) => void
}

export function EditorHeader({ visible, filename, mode, onToggleMode, onSwitchMemo, onRename }: EditorHeaderProps) {
  const api = useApi()
  const [showSettings, setShowSettings] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const title = filename ? filename.replace('.md', '') : 'Untitled'

  const startRename = () => {
    setTitleDraft(title)
    setIsEditing(true)
  }

  const commitRename = () => {
    setIsEditing(false)
    if (titleDraft.trim() && titleDraft !== title) {
      onRename(titleDraft.trim())
    }
  }

  return (
    <div
      className={`relative flex items-center gap-2 px-3 h-10 border-b border-white/10 bg-[#222224] transition-all duration-200 flex-shrink-0 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => { setShowSettings(!showSettings); setShowMenu(false) }}
          className="text-white/50 hover:text-white/80 text-sm px-1"
        >
          ⚙
        </button>
        <button
          onClick={onToggleMode}
          className="text-xs bg-white/10 px-2 py-1 rounded text-white/70 hover:text-white/90"
        >
          {mode === 'plain' ? 'TXT' : 'MD'}
        </button>
      </div>

      {/* Center title */}
      <div className="flex-1 text-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isEditing ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename() }}
            className="bg-transparent text-white/80 text-sm text-center outline-none border-b border-white/30 w-full max-w-[200px]"
          />
        ) : (
          <span
            onClick={startRename}
            className="text-sm text-white/70 truncate cursor-pointer hover:text-white/90"
          >
            {title}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowSettings(false) }}
          className="text-white/50 hover:text-white/80 text-lg px-1"
        >
          ≡
        </button>
      </div>

      {/* Popovers */}
      {showSettings && <SettingsPopover onClose={() => setShowSettings(false)} />}
      {showMenu && (
        <MenuPopover
          currentFilename={filename}
          onSwitchMemo={onSwitchMemo}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Refactor MemoEditor to use EditorHeader**

Replace `src/renderer/src/editor/MemoEditor.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorHeader } from './EditorHeader'
import { useApi } from '../hooks/use-ipc'

export function MemoEditor() {
  const api = useApi()
  const [filename, setFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')
  const [headerVisible, setHeaderVisible] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.onOpenMemo((fname) => setFilename(fname))
  }, [api])

  useEffect(() => {
    if (!filename) return
    api.memoRead(filename).then(setContent)
  }, [filename, api])

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      if (!filename) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        api.memoWrite(filename, newContent)
      }, 500)
    },
    [filename, api]
  )

  const handleRename = useCallback(
    async (newTitle: string) => {
      if (!filename) return
      const newFilename = await api.memoRename(filename, newTitle)
      setFilename(newFilename)
    },
    [filename, api]
  )

  const handleSwitchMemo = useCallback(
    (newFilename: string) => {
      // Flush pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        if (filename) api.memoWrite(filename, content)
      }
      setFilename(newFilename)
    },
    [filename, content, api]
  )

  return (
    <div
      className="flex flex-col h-screen bg-[#1c1c1e] rounded-xl overflow-hidden"
      onMouseMove={(e) => setHeaderVisible(e.clientY < 48)}
      onMouseLeave={() => setHeaderVisible(false)}
    >
      <button
        onClick={() => api.windowClose()}
        className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 z-50 transition-colors"
      />

      <EditorHeader
        visible={headerVisible}
        filename={filename}
        mode={mode}
        onToggleMode={() => setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))}
        onSwitchMemo={handleSwitchMemo}
        onRename={handleRename}
      />

      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor content={content} onChange={handleChange} />
        ) : (
          <TiptapEditor content={content} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify header popovers work**

Run: `npm run dev`

Expected: Open editor, hover top edge → header appears. Click ⚙ → opacity slider and level radio. Click ≡ → document list, actions, switch to TODO. Click title → editable rename field.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/editor/
git commit -m "feat: add editor header with settings and menu popovers"
```

---

### Task 9: TODO Tray Popover

**Files:**
- Create: `src/renderer/src/todo/TodoItem.tsx`
- Create: `src/renderer/src/todo/TodoTabBar.tsx`
- Create: `src/renderer/src/todo/TodoPopover.tsx`
- Modify: `src/renderer/src/todo-main.tsx`

- [ ] **Step 1: Create TodoItem component**

Create `src/renderer/src/todo/TodoItem.tsx`:

```tsx
interface TodoItemProps {
  text: string
  done: boolean
  onToggle: () => void
  onDelete: () => void
  dragHandleProps?: Record<string, unknown>
}

export function TodoItem({ text, done, onToggle, onDelete, dragHandleProps }: TodoItemProps) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg mx-1">
      {/* Drag handle */}
      <span
        className="text-white/15 text-xs cursor-grab active:cursor-grabbing select-none"
        {...dragHandleProps}
      >
        ⋮⋮
      </span>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
          done
            ? 'bg-green-500/80 border-green-500/80'
            : 'border-white/25 hover:border-white/40'
        }`}
      >
        {done && <span className="text-white text-xs leading-none">✓</span>}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm truncate ${
          done ? 'line-through text-white/30' : 'text-white/85'
        }`}
      >
        {text}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-xs transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create TodoTabBar component**

Create `src/renderer/src/todo/TodoTabBar.tsx`:

```tsx
import { useState } from 'react'

interface TodoTabBarProps {
  lists: { filename: string; name: string }[]
  activeFilename: string
  onSelect: (filename: string) => void
  onCreateList: (name: string) => void
  onSettings: () => void
}

export function TodoTabBar({ lists, activeFilename, onSelect, onCreateList, onSettings }: TodoTabBarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateList(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-[#262628] border-t border-white/10">
      {lists.map((list) => (
        <button
          key={list.filename}
          onClick={() => onSelect(list.filename)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            list.filename === activeFilename
              ? 'bg-blue-500 text-white'
              : 'bg-white/8 text-white/50 hover:text-white/70'
          }`}
        >
          {list.name}
        </button>
      ))}

      {isCreating ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleCreate}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreating(false) }}
          className="bg-white/10 text-white text-xs px-2 py-1.5 rounded-lg outline-none w-16"
          placeholder="Name..."
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="px-2 py-1.5 rounded-lg text-xs bg-white/8 text-white/40 hover:text-white/60"
        >
          +
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={onSettings}
        className="text-white/40 hover:text-white/60 text-sm"
      >
        ⚙
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create TodoPopover container**

Create `src/renderer/src/todo/TodoPopover.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { TodoItem } from './TodoItem'
import { TodoTabBar } from './TodoTabBar'
import { useApi } from '../hooks/use-ipc'

export function TodoPopover() {
  const api = useApi()
  const [lists, setLists] = useState<TodoList[]>([])
  const [activeFilename, setActiveFilename] = useState<string>('')
  const [newTaskText, setNewTaskText] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)

  const loadLists = useCallback(async () => {
    const all = await api.todoList()
    setLists(all)
    if (!activeFilename && all.length > 0) {
      setActiveFilename(all[0].filename)
    }
  }, [api, activeFilename])

  useEffect(() => { loadLists() }, [loadLists])

  const activeList = lists.find((l) => l.filename === activeFilename)
  const tasks = activeList?.tasks || []
  const uncompleted = tasks.filter((t) => !t.done)
  const completed = tasks.filter((t) => t.done)
  const displayTasks = showCompleted ? [...uncompleted, ...completed] : uncompleted

  const saveTasks = useCallback(
    async (newTasks: TodoTask[]) => {
      if (!activeFilename) return
      await api.todoWrite(activeFilename, newTasks)
      ;(window as any).__electron_ipc_send?.('update-tray-badge')
      loadLists()
    },
    [activeFilename, api, loadLists]
  )

  const handleToggle = (index: number) => {
    const allTasks = [...tasks]
    // Find the actual task from displayTasks
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], done: !allTasks[realIndex].done }
      // Re-sort: uncompleted first
      const unc = allTasks.filter((t) => !t.done)
      const comp = allTasks.filter((t) => t.done)
      saveTasks([...unc, ...comp])
    }
  }

  const handleDelete = (index: number) => {
    const task = displayTasks[index]
    const newTasks = tasks.filter((t) => !(t.text === task.text && t.done === task.done))
    saveTasks(newTasks)
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    const newTask: TodoTask = { text: newTaskText.trim(), done: false }
    // Insert before completed tasks
    const unc = tasks.filter((t) => !t.done)
    const comp = tasks.filter((t) => t.done)
    saveTasks([...unc, newTask, ...comp])
    setNewTaskText('')
  }

  const handleCreateList = async (name: string) => {
    const filename = await api.todoCreateList(name)
    setActiveFilename(filename)
    loadLists()
  }

  return (
    <div className="flex flex-col h-screen bg-[#1c1c1e] rounded-xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <span className="text-sm font-semibold text-white/90">{activeList?.name || 'TODO'}</span>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`text-xs px-2 py-1 rounded ${
            showCompleted ? 'bg-white/8 text-white/50' : 'bg-blue-500 text-white'
          }`}
        >
          {showCompleted ? '🔽 All' : '🔽 Active'}
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto py-1">
        {displayTasks.map((task, i) => (
          <TodoItem
            key={`${task.text}-${i}`}
            text={task.text}
            done={task.done}
            onToggle={() => handleToggle(i)}
            onDelete={() => handleDelete(i)}
          />
        ))}

        {!showCompleted && completed.length > 0 && (
          <div className="text-center text-xs text-white/30 py-2">
            {completed.length} completed task{completed.length > 1 ? 's' : ''} hidden
          </div>
        )}

        {/* Add task input */}
        <div className="px-3 py-2">
          <input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
            placeholder="+ Add task..."
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/30 focus:bg-white/8"
          />
        </div>
      </div>

      {/* Tab bar */}
      <TodoTabBar
        lists={lists.map((l) => ({ filename: l.filename, name: l.name }))}
        activeFilename={activeFilename}
        onSelect={setActiveFilename}
        onCreateList={handleCreateList}
        onSettings={() => {}}
      />
    </div>
  )
}
```

- [ ] **Step 4: Update todo-main.tsx**

Replace `src/renderer/src/todo-main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TodoPopover } from './todo/TodoPopover'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TodoPopover />
  </StrictMode>
)
```

- [ ] **Step 5: Verify TODO popover**

Run: `npm run dev`

Create a test file `~/meeemo/todo/work.md`:
```
- [ ] Draft Q2 roadmap
- [ ] Review PR
- [x] Write weekly report
```

Expected: Click tray icon → TODO popover appears below tray. Tasks show with checkboxes, completed at bottom. Can toggle, add, delete tasks. Tab bar shows lists, can create new list. Filter button toggles completed visibility.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/todo/ src/renderer/src/todo-main.tsx
git commit -m "feat: implement TODO tray popover with task management and tab bar"
```

---

### Task 10: Drag-to-Reorder for TODO

**Files:**
- Modify: `src/renderer/src/todo/TodoPopover.tsx`
- Modify: `src/renderer/src/todo/TodoItem.tsx`

- [ ] **Step 1: Install dnd-kit for drag and drop**

```bash
cd /Users/bytedance/Desktop/Projects/meeemo && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Update TodoPopover with drag-and-drop**

Replace the task list section in `src/renderer/src/todo/TodoPopover.tsx`:

Add imports at top:

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
```

Add inside the `TodoPopover` component, before the return:

```tsx
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayTasks.findIndex((_, i) => `task-${i}` === active.id)
    const newIndex = displayTasks.findIndex((_, i) => `task-${i}` === over.id)

    const reordered = [...displayTasks]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    // Merge back with hidden completed if filtered
    if (!showCompleted) {
      saveTasks([...reordered, ...completed])
    } else {
      saveTasks(reordered)
    }
  }
```

Replace the task list `<div>` in the return JSX with:

```tsx
      <div className="flex-1 overflow-y-auto py-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayTasks.map((_, i) => `task-${i}`)} strategy={verticalListSortingStrategy}>
            {displayTasks.map((task, i) => (
              <SortableTodoItem
                key={`task-${i}`}
                id={`task-${i}`}
                text={task.text}
                done={task.done}
                onToggle={() => handleToggle(i)}
                onDelete={() => handleDelete(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!showCompleted && completed.length > 0 && (
          <div className="text-center text-xs text-white/30 py-2">
            {completed.length} completed task{completed.length > 1 ? 's' : ''} hidden
          </div>
        )}

        <div className="px-3 py-2">
          <input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
            placeholder="+ Add task..."
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/30 focus:bg-white/8"
          />
        </div>
      </div>
```

Add the SortableTodoItem wrapper. Add this import and component before `TodoPopover`:

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTodoItem({ id, text, done, onToggle, onDelete }: {
  id: string; text: string; done: boolean; onToggle: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        text={text}
        done={done}
        onToggle={onToggle}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify drag-and-drop reordering**

Run: `npm run dev`

Expected: In TODO popover, grab the ⋮⋮ drag handle on any task and drag up/down to reorder. After dropping, order persists in the `.md` file.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/todo/ package.json package-lock.json
git commit -m "feat: add drag-to-reorder for TODO tasks"
```

---

### Task 11: Polish & Integration

**Files:**
- Modify: `src/main/tray.ts` (real icon)
- Modify: `src/main/windows.ts` (fix loading paths)
- Modify: `src/renderer/src/palette/CommandPalette.tsx` (wire open-editor and show-todo)

- [ ] **Step 1: Fix palette actions to use IPC send**

In `src/renderer/src/palette/CommandPalette.tsx`, replace the `openMemo` function and fix the "Check Tasks" action:

Replace the `openMemo` function:

```typescript
  function openMemo(filename: string) {
    (window as any).__electron_ipc_send?.('open-editor', filename)
  }
```

Fix the "Create New Memo" action's inner call:

```typescript
      {
        id: 'create',
        icon: '+',
        label: 'Create New Memo',
        action: async () => {
          const title = `Untitled ${new Date().toLocaleDateString()}`
          const filename = await api.memoCreate(title)
          openMemo(filename)
        }
      },
```

Fix the "Check Tasks" action:

```typescript
      {
        id: 'tasks',
        icon: '☑',
        label: 'Check Tasks',
        badge: todoCount > 0 ? `${todoCount}` : undefined,
        action: () => {
          (window as any).__electron_ipc_send?.('show-todo-from-palette')
        }
      },
```

- [ ] **Step 2: Create a simple tray icon**

In `src/main/tray.ts`, replace the empty icon with a generated one:

```typescript
import { Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  // Create a simple 16x16 template icon (dark circle with checkmark)
  const size = 22
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="18" height="18" rx="4" fill="none" stroke="black" stroke-width="1.5"/>
      <text x="11" y="15" text-anchor="middle" font-size="12" fill="black">✓</text>
    </svg>
  `
  const buf = Buffer.from(canvas)
  const icon = nativeImage.createFromBuffer(buf)
  icon.setTemplateImage(true)
  return icon
}

export function createTray(): Tray {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('Meeemo')
  updateTrayBadge()

  tray.on('click', (_event, bounds) => {
    createTodoWindow(bounds)
  })

  return tray
}

export function updateTrayBadge(): void {
  if (!tray) return
  const count = totalUncompleted()
  tray.setTitle(count > 0 ? `${count}` : '')
}

export function getTray(): Tray | null {
  return tray
}
```

- [ ] **Step 3: Ensure default memo and todo files exist on first launch**

In `src/main/config.ts`, add to `ensureStorageDirs`:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

// Add after mkdirSync calls in ensureStorageDirs:
export function ensureStorageDirs(storagePath: string): void {
  mkdirSync(join(storagePath, 'memo'), { recursive: true })
  mkdirSync(join(storagePath, 'todo'), { recursive: true })

  // Create a welcome memo if empty
  const memoDir = join(storagePath, 'memo')
  if (readdirSync(memoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(memoDir, 'Welcome.md'),
      '# Welcome to Meeemo!\n\nThis is your first memo. Press **⌥ Space** to open the command palette.\n\n- Create new memos\n- Search across all your notes\n- Pin your favorites\n\nHappy writing!'
    )
  }

  // Create a default todo list if empty
  const todoDir = join(storagePath, 'todo')
  if (readdirSync(todoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(todoDir, 'Inbox.md'),
      '- [ ] Try creating a new task\n- [ ] Explore the command palette (⌥ Space)\n'
    )
  }
}
```

- [ ] **Step 4: Full integration test**

Run: `npm run dev`

Test the full flow:
1. `Alt+Space` → Command Palette opens centered
2. See "Welcome" memo in list, pinned items at top
3. Arrow keys navigate, Enter opens editor
4. Editor opens at top-right, content displays
5. Hover top edge → header reveals
6. T↕ toggles plain text ↔ WYSIWYG
7. ⚙ → opacity slider works, level toggle works
8. ≡ → document list, create new memo, delete, rename, pin
9. Click tray icon → TODO popover
10. Add tasks, toggle checkboxes, drag to reorder
11. Filter button toggles completed visibility
12. Tab bar switches lists, + creates new list
13. Close editor → window state saved, reopens in same position
14. Esc from palette closes it

Expected: All 14 checks pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish integration — tray icon, welcome content, palette wiring"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffold | None |
| 2 | Config & file services | Task 1 |
| 3 | IPC handlers & preload | Task 2 |
| 4 | Window management & tray | Task 3 |
| 5 | Command Palette UI | Task 4 |
| 6 | Memo Editor — plain text | Task 4 |
| 7 | Memo Editor — Tiptap WYSIWYG | Task 6 |
| 8 | Memo Editor — header popovers | Task 7 |
| 9 | TODO tray popover | Task 4 |
| 10 | TODO drag-to-reorder | Task 9 |
| 11 | Polish & integration | Tasks 5, 8, 10 |

Tasks 5, 6, and 9 can be parallelized (they all depend on Task 4 but are independent of each other).

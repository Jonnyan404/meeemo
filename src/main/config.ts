import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
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

  const memoDir = join(storagePath, 'memo')
  if (readdirSync(memoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(memoDir, 'Welcome.md'),
      '# Welcome to Meeemo!\n\nThis is your first memo. Press **⌥ Space** to open the command palette.\n\n- Create new memos\n- Search across all your notes\n- Pin your favorites\n\nHappy writing!'
    )
  }

  const todoDir = join(storagePath, 'todo')
  if (readdirSync(todoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(todoDir, 'Inbox.md'),
      '- [ ] Try creating a new task\n- [ ] Explore the command palette (⌥ Space)\n'
    )
  }
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

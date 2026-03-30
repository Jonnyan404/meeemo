import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { loadConfig, updateConfig } from './config'

// Native macOS vibrancy addon — bypasses Electron's broken built-in vibrancy
// Must use absolute path because electron-vite bundles main process
function loadNativeVibrancy() {
  try {
    const addonPath = join(app.getAppPath(), 'native/macos-vibrancy')
    return require(addonPath)
  } catch (e) {
    console.warn('[vibrancy] Native addon not available:', (e as Error).message)
    return { setVibrancy() {}, removeVibrancy() {} }
  }
}

let paletteWindow: BrowserWindow | null = null
let editorWindow: BrowserWindow | null = null
let todoWindow: BrowserWindow | null = null

function preloadPath(): string {
  return join(__dirname, '../preload/index.js')
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
    // Reposition to cursor's display for multi-monitor
    const cur = screen.getCursorScreenPoint()
    const disp = screen.getDisplayNearestPoint(cur)
    const pw = paletteWindow.getBounds().width
    paletteWindow.setPosition(
      Math.round(disp.workArea.x + (disp.workArea.width - pw) / 2),
      Math.round(disp.workArea.y + disp.workArea.height * 0.2)
    )
    paletteWindow.show()
    paletteWindow.focus()
    return paletteWindow
  }

  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  const { x: dx, y: dy, width: dw, height: dh } = display.workArea

  paletteWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: Math.round(dx + (dw - 600) / 2),
    y: Math.round(dy + dh * 0.2),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    visibleOnAllWorkspaces: true,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  paletteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  loadPage(paletteWindow, 'palette')

  paletteWindow.once('ready-to-show', () => {
    paletteWindow?.show()
    if (paletteWindow) {
      loadNativeVibrancy().setVibrancy(paletteWindow.getNativeWindowHandle(), 'popover')
    }
  })
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
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

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

  // Native vibrancy always on — blur is fixed, opacity via CSS --panel-bg alpha
  loadNativeVibrancy().setVibrancy(editorWindow.getNativeWindowHandle(), 'under-window')

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

function todoPosition(trayBounds?: Electron.Rectangle): { x: number; y: number } {
  const w = 300
  if (trayBounds) {
    return {
      x: Math.round(trayBounds.x + trayBounds.width / 2 - w / 2),
      y: trayBounds.y + trayBounds.height + 4
    }
  }
  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  return {
    x: display.bounds.x + display.bounds.width - w - 20,
    y: display.bounds.y + 30
  }
}

export function createTodoWindow(trayBounds?: Electron.Rectangle): BrowserWindow {
  if (todoWindow && !todoWindow.isDestroyed()) {
    if (todoWindow.isVisible()) {
      todoWindow.hide()
      return todoWindow
    }
    const pos = todoPosition(trayBounds)
    todoWindow.setPosition(pos.x, pos.y)
    todoWindow.show()
    return todoWindow
  }

  const w = 300
  const h = 400
  const pos = todoPosition(trayBounds)

  todoWindow = new BrowserWindow({
    width: w,
    height: h,
    x: pos.x,
    y: pos.y,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    type: 'panel',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  loadPage(todoWindow, 'todo')

  todoWindow.once('ready-to-show', () => {
    todoWindow?.show()
    if (todoWindow) {
      loadNativeVibrancy().setVibrancy(todoWindow.getNativeWindowHandle(), 'popover')
    }
  })
  todoWindow.on('blur', () => todoWindow?.hide())
  todoWindow.on('closed', () => { todoWindow = null })

  return todoWindow
}

export function hidePalette(): void {
  if (paletteWindow && !paletteWindow.isDestroyed()) paletteWindow.hide()
}

export { paletteWindow, editorWindow, todoWindow }

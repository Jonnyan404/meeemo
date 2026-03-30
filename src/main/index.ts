import { app, globalShortcut, ipcMain } from 'electron'
import { registerIpcHandlers } from './ipc'
import { loadConfig } from './config'
import { createMemo } from './memo-service'
import { togglePalette, createEditorWindow, hidePalette, createTodoWindow } from './windows'
import { createTray, updateTrayBadge, getTray } from './tray'

app.whenReady().then(() => {
  // Hide dock icon — this is a menu bar app. Also prevents space switching
  // when showing tray popover windows (no app activation = no space switch).
  if (process.platform === 'darwin') app.dock.hide()

  const config = loadConfig()

  registerIpcHandlers()
  createTray()

  const shortcut = config.globalShortcut || 'Alt+Space'
  globalShortcut.register(shortcut, () => {
    togglePalette()
  })

  ipcMain.on('open-editor', (_e, filename: string) => {
    hidePalette()
    createEditorWindow(filename)
  })

  ipcMain.on('create-and-open-memo', (_e, title: string) => {
    hidePalette()
    const filename = createMemo(title)
    createEditorWindow(filename)
  })

  ipcMain.on('show-todo-from-palette', () => {
    hidePalette()
    const tray = getTray()
    if (tray) {
      createTodoWindow(tray.getBounds())
    }
  })

  ipcMain.on('update-tray-badge', () => {
    updateTrayBadge()
  })

  ipcMain.on('app-quit', () => {
    app.quit()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running (tray app)
})

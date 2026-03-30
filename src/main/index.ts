import { app, globalShortcut, ipcMain } from 'electron'
import { registerIpcHandlers } from './ipc'
import { loadConfig } from './config'
import { togglePalette, createEditorWindow, hidePalette, createTodoWindow } from './windows'
import { createTray, updateTrayBadge, getTray } from './tray'

app.whenReady().then(() => {
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
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running (tray app)
})

import { ipcMain, BrowserWindow } from 'electron'
import { listMemos, searchMemos, readMemo, writeMemo, createMemo, deleteMemo, renameMemo } from './memo-service'
import { listTodoLists, readTodoList, writeTodoList, createTodoList, deleteTodoList, renameTodoList, totalUncompleted } from './todo-service'
import { loadConfig, updateConfig, type AppConfig } from './config'

export function registerIpcHandlers(): void {
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
    if (idx >= 0) { config.pinnedMemos.splice(idx, 1) } else { config.pinnedMemos.push(filename) }
    return updateConfig({ pinnedMemos: config.pinnedMemos })
  })
  ipcMain.handle('todo:list', () => listTodoLists())
  ipcMain.handle('todo:read', (_e, filename: string) => readTodoList(filename))
  ipcMain.handle('todo:write', (_e, filename: string, tasks: any[]) => writeTodoList(filename, tasks))
  ipcMain.handle('todo:create-list', (_e, name: string) => createTodoList(name))
  ipcMain.handle('todo:delete-list', (_e, filename: string) => deleteTodoList(filename))
  ipcMain.handle('todo:rename-list', (_e, oldFilename: string, newName: string) => renameTodoList(oldFilename, newName))
  ipcMain.handle('todo:uncompleted-count', () => totalUncompleted())
  ipcMain.handle('config:get', () => loadConfig())
  ipcMain.handle('config:set', (_e, partial: Partial<AppConfig>) => updateConfig(partial))
  ipcMain.handle('window:set-opacity', (e, opacity: number) => {
    BrowserWindow.fromWebContents(e.sender)?.setOpacity(opacity)
  })
  ipcMain.handle('window:set-level', (e, level: 'always' | 'normal' | 'bottom') => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (level === 'always') win.setAlwaysOnTop(true, 'floating')
    else if (level === 'bottom') win.setAlwaysOnTop(true, 'utility', -1)
    else win.setAlwaysOnTop(false)
  })
  ipcMain.handle('window:close', (e) => { BrowserWindow.fromWebContents(e.sender)?.close() })
}

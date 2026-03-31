import { contextBridge, ipcRenderer } from 'electron'

const api = {
  memoList: () => ipcRenderer.invoke('memo:list'),
  memoSearch: (query: string) => ipcRenderer.invoke('memo:search', query),
  memoRead: (filename: string) => ipcRenderer.invoke('memo:read', filename),
  memoWrite: (filename: string, content: string) => ipcRenderer.invoke('memo:write', filename, content),
  memoCreate: (title: string) => ipcRenderer.invoke('memo:create', title),
  memoDelete: (filename: string) => ipcRenderer.invoke('memo:delete', filename),
  memoRename: (oldFilename: string, newTitle: string) => ipcRenderer.invoke('memo:rename', oldFilename, newTitle),
  memoPin: (filename: string) => ipcRenderer.invoke('memo:pin', filename),
  todoList: () => ipcRenderer.invoke('todo:list'),
  todoRead: (filename: string) => ipcRenderer.invoke('todo:read', filename),
  todoWrite: (filename: string, tasks: { text: string; done: boolean }[]) => ipcRenderer.invoke('todo:write', filename, tasks),
  todoCreateList: (name: string) => ipcRenderer.invoke('todo:create-list', name),
  todoDeleteList: (filename: string) => ipcRenderer.invoke('todo:delete-list', filename),
  todoRenameList: (oldFilename: string, newName: string) => ipcRenderer.invoke('todo:rename-list', oldFilename, newName),
  todoUncompletedCount: () => ipcRenderer.invoke('todo:uncompleted-count'),
  todoReadRaw: (filename: string) => ipcRenderer.invoke('todo:read-raw', filename),
  todoWriteRaw: (filename: string, content: string) => ipcRenderer.invoke('todo:write-raw', filename, content),
  configGet: () => ipcRenderer.invoke('config:get'),
  configSet: (partial: Record<string, unknown>) => ipcRenderer.invoke('config:set', partial),
  windowSetOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  windowSetLevel: (level: 'always' | 'normal' | 'bottom') => ipcRenderer.invoke('window:set-level', level),
  windowSetVibrancy: (vibrancy: string | null) => ipcRenderer.invoke('window:set-vibrancy', vibrancy),
  windowSetShortcut: (shortcut: string) => ipcRenderer.invoke('window:set-shortcut', shortcut),
  appVersion: () => ipcRenderer.invoke('app:version'),
  openUrl: (url: string) => ipcRenderer.invoke('app:open-url', url),
  windowClose: () => ipcRenderer.invoke('window:close'),
  onOpenMemo: (callback: (filename: string) => void) => {
    ipcRenderer.on('open-memo', (_e, filename: string) => callback(filename))
  },
  onShowTodo: (callback: () => void) => {
    ipcRenderer.on('show-todo', () => callback())
  },
  onDataChanged: (callback: () => void) => {
    ipcRenderer.on('data-changed', () => callback())
  }
}

contextBridge.exposeInMainWorld('api', api)

// Also expose send for fire-and-forget messages
contextBridge.exposeInMainWorld('__electron_ipc_send', (channel: string, ...args: unknown[]) => {
  const ALLOWED_SEND = ['open-editor', 'show-todo-from-palette', 'update-tray-badge', 'app-quit', 'create-and-open-memo']
  if (ALLOWED_SEND.includes(channel)) {
    ipcRenderer.send(channel, ...args)
  }
})

export type MeeemoAPI = typeof api

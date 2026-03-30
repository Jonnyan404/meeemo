interface TodoTask { text: string; done: boolean }
interface MemoMeta { filename: string; title: string; modifiedAt: number; preview: string }
interface TodoList { filename: string; name: string; tasks: TodoTask[] }
interface AppConfig {
  storagePath: string
  pinnedMemos: string[]
  globalShortcut: string
  theme: 'light' | 'dark'
  lastWindowState: {
    x: number; y: number; width: number; height: number
    opacity: number; blur: number; panelColor: string; fontColor: string
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
  todoReadRaw(filename: string): Promise<string>
  todoWriteRaw(filename: string, content: string): Promise<void>
  configGet(): Promise<AppConfig>
  configSet(partial: Partial<AppConfig>): Promise<AppConfig>
  windowSetOpacity(opacity: number): Promise<void>
  windowSetLevel(level: 'always' | 'normal' | 'bottom'): Promise<void>
  windowSetVibrancy(vibrancy: string | null): Promise<void>
  windowClose(): Promise<void>
  onOpenMemo(callback: (filename: string) => void): void
  onShowTodo(callback: () => void): void
  onDataChanged(callback: () => void): void
}
declare global { interface Window { api: MeeemoAPI } }
export {}

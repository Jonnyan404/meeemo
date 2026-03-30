import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/use-ipc'

interface MenuPopoverProps {
  currentFilename: string | null
  onSwitchMemo: (filename: string) => void
  onSwitchTodo: (filename: string) => void
  onClose: () => void
}

export function MenuPopover({ currentFilename, onSwitchMemo, onSwitchTodo, onClose }: MenuPopoverProps) {
  const api = useApi()
  const [memos, setMemos] = useState<MemoMeta[]>([])
  const [todoLists, setTodoLists] = useState<TodoList[]>([])
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [listMode, setListMode] = useState<'memo' | 'todo'>('memo')

  const refresh = useCallback(() => {
    Promise.all([api.memoList(), api.configGet(), api.todoList()]).then(([m, c, t]) => {
      setMemos(m)
      setConfig(c)
      setTodoLists(t)
    })
  }, [api])

  useEffect(() => { refresh() }, [refresh])

  const pinnedSet = new Set(config?.pinnedMemos || [])
  // Sort: pinned first, then by modified time (memos already sorted by time from service)
  const pinnedMemos = memos.filter((m) => pinnedSet.has(m.filename))
  const unpinnedMemos = memos.filter((m) => !pinnedSet.has(m.filename))
  const sortedMemos = [...pinnedMemos, ...unpinnedMemos]

  const handleNewMemo = async () => {
    try {
      const title = `Untitled ${new Date().toISOString().slice(0, 10)}`
      const filename = await api.memoCreate(title)
      onSwitchMemo(filename)
      onClose()
    } catch (err) {
      console.error('[Menu] Create failed:', err)
    }
  }

  const handleDelete = async () => {
    if (!currentFilename) return
    const title = currentFilename.replace('.md', '')
    if (!window.confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return
    try {
      await api.memoDelete(currentFilename)
      // Switch to next available memo
      const remaining = memos.filter((m) => m.filename !== currentFilename)
      if (remaining.length > 0) {
        onSwitchMemo(remaining[0].filename)
      }
      onClose()
    } catch (err) {
      console.error('[Menu] Delete failed:', err)
    }
  }

  const handlePin = async () => {
    if (!currentFilename) return
    await api.memoPin(currentFilename)
    refresh() // Refresh to update pin state
  }

  return (
    <div
      className="absolute top-10 right-8 w-56 frosted-glass rounded-lg border border-[var(--border-color)] shadow-xl z-50 overflow-hidden"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Action buttons */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border-color)]">
        <button
          onClick={handleNewMemo}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span className="text-lg">+</span>
          <span className="text-[10px]">New</span>
        </button>
        <button
          onClick={handlePin}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span className="text-lg">{currentFilename && pinnedSet.has(currentFilename) ? '📌' : '📍'}</span>
          <span className="text-[10px]">{currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-red-500/10"
          style={{ color: 'rgba(248,113,113,0.8)' }}
        >
          <span className="text-lg">🗑</span>
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      {/* Memo / TODO tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setListMode('memo')}
          className={`flex-1 text-center text-xs py-2 transition-colors ${
            listMode === 'memo'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Memos
        </button>
        <button
          onClick={() => setListMode('todo')}
          className={`flex-1 text-center text-xs py-2 transition-colors ${
            listMode === 'todo'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          TODOs
        </button>
      </div>

      {/* List */}
      <div className="p-2 max-h-48 overflow-y-auto">
        {listMode === 'memo' ? (
          sortedMemos.length > 0 ? sortedMemos.map((m) => (
            <button
              key={m.filename}
              onClick={() => { onSwitchMemo(m.filename); onClose() }}
              className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
                m.filename === currentFilename
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]'
              }`}
            >
              {pinnedSet.has(m.filename) ? '📌 ' : '📄 '}{m.title}
            </button>
          )) : (
            <div className="px-2 py-2 text-xs text-[var(--text-secondary)] italic">No memos yet</div>
          )
        ) : (
          todoLists.length > 0 ? todoLists.map((t) => (
            <button
              key={t.filename}
              onClick={() => { onSwitchTodo(t.filename); onClose() }}
              className="w-full text-left px-2 py-1.5 rounded text-sm truncate text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]"
            >
              ☑ {t.name}
              <span className="ml-2 text-xs opacity-60">
                {t.tasks.filter(task => !task.done).length} tasks
              </span>
            </button>
          )) : (
            <div className="px-2 py-2 text-xs text-[var(--text-secondary)] italic">No TODO lists yet</div>
          )
        )}
      </div>
    </div>
  )
}

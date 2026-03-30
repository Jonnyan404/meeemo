import { useState, useEffect } from 'react'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    Promise.all([api.memoList(), api.configGet(), api.todoList()]).then(([m, c, t]) => {
      setMemos(m)
      setConfig(c)
      setTodoLists(t)
    })
  }, [api])

  const pinnedSet = new Set(config?.pinnedMemos || [])

  const handleNewMemo = async () => {
    const title = `Untitled ${new Date().toISOString().slice(0, 10)}`
    const filename = await api.memoCreate(title)
    onSwitchMemo(filename)
    onClose()
  }

  const handleDelete = async () => {
    if (!currentFilename) return
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    await api.memoDelete(currentFilename)
    const remaining = memos.filter((m) => m.filename !== currentFilename)
    if (remaining.length > 0) {
      onSwitchMemo(remaining[0].filename)
    }
    setShowDeleteConfirm(false)
    onClose()
  }

  const handlePin = async () => {
    if (!currentFilename) return
    await api.memoPin(currentFilename)
    const c = await api.configGet()
    setConfig(c)
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
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="New Memo"
        >
          <span className="text-lg">+</span>
          <span className="text-[10px]">New</span>
        </button>
        <button
          onClick={handlePin}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}
        >
          <span className="text-lg">{currentFilename && pinnedSet.has(currentFilename) ? '📌' : '📍'}</span>
          <span className="text-[10px]">{currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}</span>
        </button>
        <button
          onClick={handleDelete}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg ${
            showDeleteConfirm ? 'bg-red-500 text-white' : 'hover:bg-red-500/10'
          }`}
          title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
          style={showDeleteConfirm ? {} : { color: 'rgba(248,113,113,0.7)' }}
        >
          <span className="text-lg">{showDeleteConfirm ? '⚠' : '🗑'}</span>
          <span className="text-[10px]">{showDeleteConfirm ? 'Confirm?' : 'Delete'}</span>
        </button>
      </div>

      {/* Memo / TODO toggle tabs */}
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

      {/* Document / TODO list */}
      <div className="p-2 max-h-48 overflow-y-auto">
        {listMode === 'memo' ? (
          <>
            {memos.map((m) => (
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
            ))}
            {memos.length === 0 && (
              <div className="px-2 py-2 text-xs text-[var(--text-secondary)] italic">No memos yet</div>
            )}
          </>
        ) : (
          <>
            {todoLists.map((t) => (
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
            ))}
            {todoLists.length === 0 && (
              <div className="px-2 py-2 text-xs text-[var(--text-secondary)] italic">No TODO lists yet</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

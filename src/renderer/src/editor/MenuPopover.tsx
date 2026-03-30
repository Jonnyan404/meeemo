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
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="New Memo"
        >
          <span className="text-lg">+</span>
          <span className="text-[10px]">New</span>
        </button>
        <button
          onClick={handlePin}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}
        >
          <span className="text-lg">{currentFilename && pinnedSet.has(currentFilename) ? '📌' : '📍'}</span>
          <span className="text-[10px]">{currentFilename && pinnedSet.has(currentFilename) ? 'Unpin' : 'Pin'}</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)]"
          title="Delete"
          style={{ color: 'rgba(248,113,113,0.7)' }}
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
      </div>
    </div>
  )
}

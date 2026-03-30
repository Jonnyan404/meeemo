import { useState, useEffect, useCallback, useRef } from 'react'
import { PaletteItem } from './PaletteItem'
import { useApi } from '../hooks/use-ipc'

interface ListItem {
  id: string
  icon: string
  label: string
  sublabel?: string
  badge?: string
  action: () => void
}

export function CommandPalette() {
  const api = useApi()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ListItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDefaultItems = useCallback(async () => {
    const [memos, config, todoCount] = await Promise.all([
      api.memoList(),
      api.configGet(),
      api.todoUncompletedCount()
    ])

    const pinnedSet = new Set(config.pinnedMemos)
    const pinned = memos.filter((m) => pinnedSet.has(m.filename))
    const recent = memos.filter((m) => !pinnedSet.has(m.filename))

    const result: ListItem[] = [
      {
        id: 'create',
        icon: '+',
        label: 'Create New Memo',
        action: async () => {
          const title = `Untitled ${new Date().toLocaleDateString()}`
          const filename = await api.memoCreate(title)
          openMemo(filename)
        }
      },
      {
        id: 'tasks',
        icon: '☑',
        label: 'Check Tasks',
        badge: todoCount > 0 ? `${todoCount}` : undefined,
        action: () => {
          (window as any).__electron_ipc_send?.('show-todo-from-palette')
        }
      },
      ...pinned.map((m) => ({
        id: `pin:${m.filename}`,
        icon: '📌',
        label: m.title,
        sublabel: formatTime(m.modifiedAt),
        action: () => openMemo(m.filename)
      })),
      ...recent.map((m) => ({
        id: `memo:${m.filename}`,
        icon: '📄',
        label: m.title,
        sublabel: formatTime(m.modifiedAt),
        action: () => openMemo(m.filename)
      }))
    ]

    setItems(result)
    setSelectedIndex(0)
  }, [api])

  const loadSearchResults = useCallback(async (q: string) => {
    const results = await api.memoSearch(q)
    const result: ListItem[] = [
      ...results.map((m) => ({
        id: `result:${m.filename}`,
        icon: '📄',
        label: m.title,
        sublabel: m.preview,
        action: () => openMemo(m.filename)
      })),
      {
        id: 'create-search',
        icon: '+',
        label: `Create "${q}"`,
        action: async () => {
          const filename = await api.memoCreate(q)
          openMemo(filename)
        }
      }
    ]
    setItems(result)
    setSelectedIndex(0)
  }, [api])

  function openMemo(filename: string) {
    (window as any).__electron_ipc_send?.('open-editor', filename)
  }

  useEffect(() => {
    if (query.trim()) {
      loadSearchResults(query.trim())
    } else {
      loadDefaultItems()
    }
  }, [query, loadDefaultItems, loadSearchResults])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      window.api.windowClose()
    }
  }

  return (
    <div className="flex flex-col h-full frosted-glass rounded-xl overflow-hidden border border-[var(--border-color)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
        <span className="text-[var(--text-secondary)] text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search memos..."
          className="flex-1 bg-transparent text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-secondary)]"
        />
        <span className="text-[var(--text-secondary)] text-xs">⌥ Space</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {items.map((item, i) => (
          <PaletteItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            sublabel={item.sublabel}
            badge={item.badge}
            selected={i === selectedIndex}
            onClick={item.action}
          />
        ))}
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

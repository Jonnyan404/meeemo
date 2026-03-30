import { useState } from 'react'

interface TodoTabBarProps {
  lists: { filename: string; name: string }[]
  activeFilename: string
  onSelect: (filename: string) => void
  onCreateList: (name: string) => void
  onSettings: () => void
}

export function TodoTabBar({ lists, activeFilename, onSelect, onCreateList, onSettings }: TodoTabBarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateList(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5"
      style={{
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.03)'
      }}
    >
      {lists.map((list) => (
        <button
          key={list.filename}
          onClick={() => onSelect(list.filename)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: list.filename === activeFilename ? 'var(--accent)' : 'rgba(0,0,0,0.06)',
            color: list.filename === activeFilename ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {list.name}
        </button>
      ))}

      {isCreating ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleCreate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
            if (e.key === 'Escape') setIsCreating(false)
          }}
          className="text-xs px-2 py-1.5 rounded-lg outline-none w-16"
          style={{
            background: 'rgba(0,0,0,0.08)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
          placeholder="Name..."
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="px-2 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            background: 'rgba(0,0,0,0.06)',
            color: 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={onSettings}
        className="text-sm transition-colors"
        style={{ color: 'var(--text-secondary)', border: 'none', background: 'none', cursor: 'pointer' }}
        title="Settings"
      >
        ⚙
      </button>
    </div>
  )
}

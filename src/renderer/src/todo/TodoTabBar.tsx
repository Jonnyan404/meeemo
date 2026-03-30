import { useState, useRef, useEffect } from 'react'

interface TodoTabBarProps {
  lists: { filename: string; name: string }[]
  activeFilename: string
  onSelect: (filename: string) => void
  onCreateList: (name: string) => void
  onDeleteList: (filename: string) => void
  onRenameList: (filename: string, newName: string) => void
}

export function TodoTabBar({ lists, activeFilename, onSelect, onCreateList, onDeleteList, onRenameList }: TodoTabBarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showManage, setShowManage] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const activeList = lists.find((l) => l.filename === activeFilename)

  useEffect(() => {
    if (!showManage) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowManage(false)
        setIsRenaming(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showManage])

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateList(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  const handleStartRename = () => {
    if (activeList) {
      setRenameValue(activeList.name)
      setIsRenaming(true)
    }
  }

  const handleCommitRename = () => {
    if (renameValue.trim() && activeList && renameValue.trim() !== activeList.name) {
      onRenameList(activeFilename, renameValue.trim())
    }
    setIsRenaming(false)
    setShowManage(false)
  }

  const handleDelete = () => {
    if (activeList && lists.length > 1) {
      onDeleteList(activeFilename)
      setShowManage(false)
    }
  }

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 relative"
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
        onClick={() => setShowManage(!showManage)}
        className="text-sm transition-colors"
        style={{ color: 'var(--text-secondary)', border: 'none', background: 'none', cursor: 'pointer' }}
        title="Manage list"
      >
        ⚙
      </button>

      {/* Management popover */}
      {showManage && activeList && (
        <div
          ref={popoverRef}
          className="absolute bottom-full right-1 mb-1 rounded-lg shadow-lg py-1 z-50"
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            minWidth: '140px'
          }}
        >
          {isRenaming ? (
            <div className="px-2 py-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitRename()
                  if (e.key === 'Escape') { setIsRenaming(false); setShowManage(false) }
                }}
                onBlur={handleCommitRename}
                className="text-xs px-2 py-1 rounded outline-none w-full"
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              />
            </div>
          ) : (
            <>
              <button
                onClick={handleStartRename}
                className="w-full text-left text-xs px-3 py-1.5 transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-primary)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Rename "{activeList.name}"
              </button>
              {lists.length > 1 && (
                <button
                  onClick={handleDelete}
                  className="w-full text-left text-xs px-3 py-1.5 transition-colors hover:bg-red-500/10"
                  style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Delete "{activeList.name}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

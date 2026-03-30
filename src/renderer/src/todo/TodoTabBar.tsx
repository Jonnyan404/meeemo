import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TodoTabBarProps {
  lists: { filename: string; name: string }[]
  activeFilename: string
  onSelect: (filename: string) => void
  onCreateList: (name: string) => void
  onDeleteList: (filename: string) => void
  onRenameList: (filename: string, newName: string) => void
  onReorder: (filenames: string[]) => void
}

function SortableTab({ filename, name, isActive, onSelect }: {
  filename: string; name: string; isActive: boolean; onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: filename })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isActive ? 'var(--accent)' : 'rgba(0,0,0,0.06)',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    cursor: 'grab',
    touchAction: 'none',
  }
  return (
    <button
      ref={setNodeRef}
      style={style}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      {name}
    </button>
  )
}

export function TodoTabBar({ lists, activeFilename, onSelect, onCreateList, onDeleteList, onRenameList, onReorder }: TodoTabBarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showManage, setShowManage] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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
    }
    setNewName('')
    setIsCreating(false)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((l) => l.filename === active.id)
      const newIndex = lists.findIndex((l) => l.filename === over.id)
      const reordered = [...lists]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      onReorder(reordered.map((l) => l.filename))
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={lists.map((l) => l.filename)} strategy={horizontalListSortingStrategy}>
          {lists.map((list) => (
            <SortableTab
              key={list.filename}
              filename={list.filename}
              name={list.name}
              isActive={list.filename === activeFilename}
              onSelect={() => onSelect(list.filename)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isCreating ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={() => handleCreate()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
            if (e.key === 'Escape') { setNewName(''); setIsCreating(false) }
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
        &#x22EF;
      </button>

      {showManage && activeList && (
        <div
          ref={popoverRef}
          className="absolute bottom-full right-1 mb-1 frosted-fixed rounded-lg shadow-lg py-1 z-50"
          style={{
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
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
              <button
                onClick={() => { (window as any).__electron_ipc_send?.('app-quit') }}
                className="w-full text-left text-xs px-3 py-1.5 transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-secondary)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Exit Meeemo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface TodoItemProps {
  text: string
  done: boolean
  onToggle: () => void
  onDelete: () => void
  dragHandleProps?: Record<string, unknown>
}

export function TodoItem({ text, done, onToggle, onDelete, dragHandleProps }: TodoItemProps) {
  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg mx-1"
      style={{ transition: 'background 0.1s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Drag handle */}
      <span
        className="text-xs cursor-grab active:cursor-grabbing select-none"
        style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
        {...dragHandleProps}
      >
        ⋮⋮
      </span>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          width: '1.125rem',
          height: '1.125rem',
          borderRadius: '4px',
          border: done ? 'none' : '1.5px solid var(--border-color)',
          background: done ? '#34c759' : 'transparent',
          cursor: 'pointer'
        }}
      >
        {done && <span style={{ color: 'white', fontSize: '10px', lineHeight: 1 }}>✓</span>}
      </button>

      {/* Text */}
      <span
        className="flex-1 text-sm truncate"
        style={{
          color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none'
        }}
      >
        {text}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
        style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ff3b30')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        ✕
      </button>
    </div>
  )
}

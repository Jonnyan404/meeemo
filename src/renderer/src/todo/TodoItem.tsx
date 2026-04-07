import { useRef } from 'react'

function formatReminder(reminder: string): string {
  // Parse "2026-4-7-0900+8" → "4/7 09:00"
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return reminder
  const [, , month, day, hour, minute] = match
  return `${Number(month)}/${Number(day)} ${hour}:${minute}`
}

function getLocalTimezoneOffset(): number {
  return -(new Date().getTimezoneOffset() / 60)
}

function toDatetimeLocal(reminder: string): string {
  // Convert "2026-4-7-0900+8" → "2026-04-07T09:00"
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return ''
  const [, year, month, day, hour, minute] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}`
}

function fromDatetimeLocal(value: string): string {
  // Convert "2026-04-07T09:00" → "2026-4-7-0900+8"
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return ''
  const [year, month, day] = datePart.split('-')
  const [hour, minute] = timePart.split(':')
  const offset = getLocalTimezoneOffset()
  const sign = offset >= 0 ? '+' : ''
  return `${Number(year)}-${Number(month)}-${Number(day)}-${hour}${minute}${sign}${offset}`
}

function parseReminderToDate(reminder: string): Date | null {
  const match = reminder.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(\d{2})([+-]\d{1,2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, offsetStr] = match
  const offset = parseInt(offsetStr, 10)
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00${sign}${String(absOffset).padStart(2, '0')}:00`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function isOverdue(reminder: string): boolean {
  const d = parseReminderToDate(reminder)
  return d ? d.getTime() < Date.now() : false
}

interface TodoItemProps {
  text: string
  done: boolean
  reminder?: string
  onToggle: () => void
  onDelete: () => void
  onSetReminder: (reminder: string | undefined) => void
  dragHandleProps?: Record<string, unknown>
}

export function TodoItem({
  text,
  done,
  reminder,
  onToggle,
  onDelete,
  onSetReminder,
  dragHandleProps
}: TodoItemProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const overdue = !done && reminder ? isOverdue(reminder) : false

  const handleClockClick = () => {
    const input = dateInputRef.current
    if (!input) return
    if (reminder) {
      input.value = toDatetimeLocal(reminder)
    }
    try {
      input.showPicker()
    } catch {
      input.click()
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      onSetReminder(fromDatetimeLocal(value))
    } else {
      onSetReminder(undefined)
    }
  }

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
          color: done ? 'var(--text-secondary)' : overdue ? '#a1845c' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none'
        }}
      >
        {text}
      </span>

      {/* Reminder badge */}
      {reminder && !done && (
        <span
          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
          style={{
            background: overdue ? 'rgba(180, 130, 60, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            color: overdue ? '#a1845c' : '#3b82f6',
            fontSize: '10px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap'
          }}
          title={overdue ? 'Overdue' : ''}
        >
          {overdue ? 'overdue · ' : ''}{formatReminder(reminder)}
        </span>
      )}

      {/* Clock button (reminder picker trigger) */}
      <button
        onClick={handleClockClick}
        className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0"
        style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        🕐
      </button>

      {/* Hidden datetime-local input */}
      <input
        ref={dateInputRef}
        type="datetime-local"
        onChange={handleDateChange}
        onBlur={() => {}}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
        tabIndex={-1}
      />

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

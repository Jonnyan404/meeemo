import { useState, useEffect } from 'react'
import { SettingsPopover } from './SettingsPopover'
import { MenuPopover } from './MenuPopover'

interface EditorHeaderProps {
  visible: boolean
  filename: string | null
  mode: 'plain' | 'wysiwyg'
  onToggleMode: () => void
  onSwitchMemo: (filename: string) => void
  onSwitchTodo: (filename: string) => void
  onRename: (newTitle: string) => void
  onClose: () => void
  onPopoverChange?: (open: boolean) => void
}

export function EditorHeader({ visible, filename, mode, onToggleMode, onSwitchMemo, onSwitchTodo, onRename, onClose, onPopoverChange }: EditorHeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const title = filename ? filename.replace('.md', '') : 'Untitled'

  const anyPopoverOpen = showSettings || showMenu

  useEffect(() => {
    onPopoverChange?.(anyPopoverOpen)
  }, [anyPopoverOpen, onPopoverChange])

  const startRename = () => {
    setTitleDraft(title)
    setIsEditing(true)
  }

  const commitRename = () => {
    setIsEditing(false)
    if (titleDraft.trim() && titleDraft !== title) {
      onRename(titleDraft.trim())
    }
  }

  return (
    <div
      className={`relative flex items-center h-10 border-b border-[var(--border-color)] bg-[var(--panel-bg)] transition-all duration-200 flex-shrink-0 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left controls */}
      <div className="flex items-center gap-1 px-3 z-10" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => { setShowSettings(!showSettings); setShowMenu(false) }}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-1 transition-colors"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" />
          </svg>
        </button>
        <button
          onClick={onToggleMode}
          className="text-xs bg-black/5 px-2 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {mode === 'plain' ? 'TXT' : 'MD'}
        </button>
      </div>

      {/* Center title - absolute positioned for true centering */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {isEditing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename() }}
              className="bg-transparent text-[var(--text-primary)] text-sm text-center outline-none border-b border-[var(--border-color)] w-full max-w-[200px]"
            />
          ) : (
            <span
              onClick={startRename}
              className="text-sm text-[var(--text-secondary)] truncate cursor-pointer hover:text-[var(--text-primary)] transition-colors"
            >
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex-1" />
      <div className="flex items-center gap-1 px-3 z-10" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowSettings(false) }}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg px-1 transition-colors"
          title="Menu"
        >
          ≡
        </button>
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors ml-1"
          title="Close"
        />
      </div>

      {/* Popover backdrop — click outside to close */}
      {anyPopoverOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowSettings(false); setShowMenu(false) }}
        />
      )}

      {/* Popovers */}
      {showSettings && <SettingsPopover onClose={() => setShowSettings(false)} />}
      {showMenu && (
        <MenuPopover
          currentFilename={filename}
          onSwitchMemo={onSwitchMemo}
          onSwitchTodo={onSwitchTodo}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

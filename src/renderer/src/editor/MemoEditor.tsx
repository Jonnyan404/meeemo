import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { useApi } from '../hooks/use-ipc'

export function MemoEditor() {
  const api = useApi()
  const [filename, setFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')
  const [headerVisible, setHeaderVisible] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.onOpenMemo((fname) => setFilename(fname))
  }, [api])

  useEffect(() => {
    if (!filename) return
    api.memoRead(filename).then(setContent)
  }, [filename, api])

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      if (!filename) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        api.memoWrite(filename, newContent)
      }, 500)
    },
    [filename, api]
  )

  return (
    <div
      className="flex flex-col h-screen frosted-glass rounded-xl overflow-hidden"
      onMouseMove={(e) => setHeaderVisible(e.clientY < 48)}
      onMouseLeave={() => setHeaderVisible(false)}
    >
      {/* Close button - always visible */}
      <button
        onClick={() => api.windowClose()}
        className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 z-50 transition-colors"
      />

      {/* Header - shown on hover */}
      <div
        className={`flex items-center gap-2 px-3 h-10 border-b border-[var(--border-color)] bg-[var(--panel-bg)] transition-all duration-200 flex-shrink-0 ${
          headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm" title="Settings">
          ⚙
        </button>
        <button
          onClick={() => setMode(mode === 'plain' ? 'wysiwyg' : 'plain')}
          className="text-xs bg-black/5 px-2 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {mode === 'plain' ? 'TXT' : 'MD'}
        </button>

        <span className="flex-1 text-center text-sm text-[var(--text-secondary)] truncate">
          {filename ? filename.replace('.md', '') : 'Untitled'}
        </span>

        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg" title="Menu">
          ≡
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <PlainTextEditor content={content} onChange={handleChange} />
      </div>
    </div>
  )
}

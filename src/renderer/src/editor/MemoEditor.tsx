import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorHeader } from './EditorHeader'
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

  const handleRename = useCallback(
    async (newTitle: string) => {
      if (!filename) return
      const newFilename = await api.memoRename(filename, newTitle)
      setFilename(newFilename)
    },
    [filename, api]
  )

  const handleSwitchMemo = useCallback(
    (newFilename: string) => {
      // Flush pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        if (filename) api.memoWrite(filename, content)
      }
      setFilename(newFilename)
    },
    [filename, content, api]
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

      <EditorHeader
        visible={headerVisible}
        filename={filename}
        mode={mode}
        onToggleMode={() => setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))}
        onSwitchMemo={handleSwitchMemo}
        onRename={handleRename}
      />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor content={content} onChange={handleChange} />
        ) : (
          <TiptapEditor content={content} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}

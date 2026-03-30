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
  const [popoverOpen, setPopoverOpen] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)

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
      contentRef.current = newContent
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

  const handleToggleMode = useCallback(() => {
    // Flush current content to file before switching to prevent loss
    if (filename && contentRef.current) {
      api.memoWrite(filename, contentRef.current)
    }
    setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))
  }, [filename, api])

  const showHeader = headerVisible || popoverOpen

  return (
    <div
      className="flex flex-col h-screen frosted-glass rounded-xl overflow-hidden"
      onMouseMove={(e) => setHeaderVisible(e.clientY < 48)}
      onMouseLeave={() => setHeaderVisible(false)}
    >
      {/* Close button - shown only when header is hidden */}
      {!showHeader && (
        <button
          onClick={() => api.windowClose()}
          className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 z-50 transition-colors"
        />
      )}

      <EditorHeader
        visible={showHeader}
        filename={filename}
        mode={mode}
        onToggleMode={handleToggleMode}
        onSwitchMemo={handleSwitchMemo}
        onRename={handleRename}
        onClose={() => api.windowClose()}
        onPopoverChange={setPopoverOpen}
      />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'plain' ? (
          <PlainTextEditor key={`plain-${filename}`} content={content} onChange={handleChange} />
        ) : (
          <TiptapEditor key={`wysiwyg-${filename}`} content={content} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}

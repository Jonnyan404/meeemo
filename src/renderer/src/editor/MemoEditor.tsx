import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorHeader } from './EditorHeader'
import { useApi } from '../hooks/use-ipc'

type FileType = 'memo' | 'todo'

export function MemoEditor() {
  const api = useApi()
  const [filename, setFilename] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType>('memo')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')
  const [headerVisible, setHeaderVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)
  const [editorKey, setEditorKey] = useState(0)
  const filenameRef = useRef(filename)
  filenameRef.current = filename

  useEffect(() => {
    api.onOpenMemo((fname) => {
      cancelPendingSave()
      setFilename(fname)
      setFileType('memo')
      setEditorKey((k) => k + 1)
    })
  }, [api])

  // Cross-window sync: re-read file when other windows change data
  useEffect(() => {
    api.onDataChanged(() => {
      if (!filenameRef.current) return
      const fn = filenameRef.current
      const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
      readFn(fn).then((c) => {
        if (c !== contentRef.current) {
          setContent(c)
          contentRef.current = c
          // Force Tiptap remount to pick up new content
          if (mode === 'wysiwyg') setEditorKey((k) => k + 1)
        }
      }).catch(() => {
        // File might have been deleted
      })
    })
  }, [api, fileType, mode])

  // Load content when filename changes
  useEffect(() => {
    if (!filename) return
    const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
    readFn(filename).then((c) => {
      setContent(c)
      contentRef.current = c
    }).catch(() => {})
  }, [filename, fileType, api])

  function cancelPendingSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }

  const writeFn = useCallback(
    (fname: string, c: string) => {
      return fileType === 'memo' ? api.memoWrite(fname, c) : api.todoWriteRaw(fname, c)
    },
    [fileType, api]
  )

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      contentRef.current = newContent
      if (!filenameRef.current) return
      cancelPendingSave()
      const fn = filenameRef.current
      saveTimeoutRef.current = setTimeout(() => {
        writeFn(fn, newContent)
        // Also update tray badge if editing a todo file
        ;(window as any).__electron_ipc_send?.('update-tray-badge')
      }, 500)
    },
    [writeFn]
  )

  const handleRename = useCallback(
    async (newTitle: string) => {
      if (!filename || fileType !== 'memo') return
      const newFilename = await api.memoRename(filename, newTitle)
      setFilename(newFilename)
    },
    [filename, fileType, api]
  )

  // Switch memo: flush current content first, then switch
  const handleSwitchMemo = useCallback(
    async (newFilename: string) => {
      // Flush pending save for current file
      cancelPendingSave()
      if (filename && contentRef.current) {
        await writeFn(filename, contentRef.current).catch(() => {})
      }
      setFileType('memo')
      setFilename(newFilename)
      setEditorKey((k) => k + 1)
    },
    [filename, writeFn]
  )

  const handleSwitchTodo = useCallback(
    async (newFilename: string) => {
      cancelPendingSave()
      if (filename && contentRef.current) {
        await writeFn(filename, contentRef.current).catch(() => {})
      }
      setFileType('todo')
      setFilename(newFilename)
      setEditorKey((k) => k + 1)
    },
    [filename, writeFn]
  )

  const handleToggleMode = useCallback(async () => {
    if (filename && contentRef.current) {
      cancelPendingSave()
      await writeFn(filename, contentRef.current)
      const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
      const freshContent = await readFn(filename)
      setContent(freshContent)
      contentRef.current = freshContent
    }
    setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))
    setEditorKey((k) => k + 1)
  }, [filename, fileType, api, writeFn])

  const showHeader = headerVisible || popoverOpen

  return (
    <div
      className="flex flex-col h-screen frosted-glass rounded-xl overflow-hidden"
      onMouseMove={(e) => setHeaderVisible(e.clientY < 48)}
      onMouseLeave={() => setHeaderVisible(false)}
    >
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
        onSwitchTodo={handleSwitchTodo}
        onRename={handleRename}
        onClose={() => api.windowClose()}
        onPopoverChange={setPopoverOpen}
      />

      <div className="flex-1 overflow-y-auto">
        {filename ? (
          mode === 'plain' ? (
            <PlainTextEditor key={`plain-${editorKey}`} content={content} onChange={handleChange} />
          ) : (
            <TiptapEditor key={`wysiwyg-${editorKey}`} content={content} onChange={handleChange} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
            Open a memo from the command palette (⌥ Space)
          </div>
        )}
      </div>
    </div>
  )
}

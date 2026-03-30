import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorHeader } from './EditorHeader'
import { useApi } from '../hooks/use-ipc'

type FileType = 'memo' | 'todo'

export function MemoEditor() {
  const api = useApi()

  // Core state — monotonic sessionId ensures every file switch is unique
  const [sessionId, setSessionId] = useState(0)
  const [filename, setFilename] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType>('memo')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')

  // UI state
  const [headerVisible, setHeaderVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Refs for async access (closures always get latest value)
  const filenameRef = useRef<string | null>(null)
  const fileTypeRef = useRef<FileType>('memo')
  const contentRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync refs
  filenameRef.current = filename
  fileTypeRef.current = fileType

  // ---- Helpers ----

  function cancelSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  function readFile(fname: string, ftype: FileType) {
    return ftype === 'memo' ? api.memoRead(fname) : api.todoReadRaw(fname)
  }

  function writeFile(fname: string, c: string, ftype: FileType) {
    return ftype === 'memo' ? api.memoWrite(fname, c) : api.todoWriteRaw(fname, c)
  }

  // Open a file: cancel any pending save, bump session, load from disk
  const openFile = useCallback((fname: string, ftype: FileType) => {
    cancelSave()
    setFilename(fname)
    setFileType(ftype)
    setSessionId((s) => s + 1)
    // Content will be loaded by the effect below
  }, [])

  // ---- Effects ----

  // Listen for IPC: main process tells us to open a memo
  useEffect(() => {
    api.onOpenMemo((fname) => openFile(fname, 'memo'))
  }, [api, openFile])

  // Load content whenever session changes (new file opened or mode toggled)
  useEffect(() => {
    if (!filename) return
    readFile(filename, fileType).then((c) => {
      setContent(c)
      contentRef.current = c
    }).catch(() => {})
  }, [sessionId]) // eslint-disable-line -- sessionId encapsulates all file identity changes

  // Cross-window sync
  useEffect(() => {
    api.onDataChanged(() => {
      const fn = filenameRef.current
      const ft = fileTypeRef.current
      if (!fn) return
      readFile(fn, ft).then((c) => {
        if (c !== contentRef.current) {
          setContent(c)
          contentRef.current = c
          // Bump session to remount Tiptap with fresh content
          setSessionId((s) => s + 1)
        }
      }).catch(() => {})
    })
  }, [api])

  // ---- Handlers ----

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent)
    contentRef.current = newContent

    cancelSave()
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    if (!fn) return

    saveTimerRef.current = setTimeout(() => {
      writeFile(fn, newContent, ft)
      ;(window as any).__electron_ipc_send?.('update-tray-badge')
    }, 500)
  }, [api])

  const handleRename = useCallback(async (newTitle: string) => {
    const fn = filenameRef.current
    if (!fn || fileTypeRef.current !== 'memo') return
    cancelSave()
    const newFilename = await api.memoRename(fn, newTitle)
    openFile(newFilename, 'memo')
  }, [api, openFile])

  const handleSwitchMemo = useCallback((newFilename: string) => {
    // Flush current content synchronously before switching
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      writeFile(fn, contentRef.current, ft)
    }
    openFile(newFilename, 'memo')
  }, [api, openFile])

  const handleSwitchTodo = useCallback((newFilename: string) => {
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      writeFile(fn, contentRef.current, ft)
    }
    openFile(newFilename, 'todo')
  }, [api, openFile])

  const handleToggleMode = useCallback(async () => {
    // Save current content, re-read for clean round-trip, then switch mode
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      await writeFile(fn, contentRef.current, ft)
    }
    setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))
    setSessionId((s) => s + 1) // forces re-read and remount
  }, [api])

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
            <PlainTextEditor key={`p-${sessionId}`} content={content} onChange={handleChange} />
          ) : (
            <TiptapEditor key={`w-${sessionId}`} content={content} onChange={handleChange} />
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

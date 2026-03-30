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

  useEffect(() => {
    api.onOpenMemo((fname) => {
      setFilename(fname)
      setFileType('memo')
    })
  }, [api])

  useEffect(() => {
    api.onDataChanged(() => {
      if (filename) {
        const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
        readFn(filename).then((c) => {
          // Only update if content actually changed (avoid cursor jump)
          if (c !== contentRef.current) {
            setContent(c)
            contentRef.current = c
          }
        })
      }
    })
  }, [api, filename, fileType])

  // Load content when filename changes
  useEffect(() => {
    if (!filename) return
    const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
    readFn(filename).then((c) => {
      setContent(c)
      contentRef.current = c
    })
  }, [filename, fileType, api])

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
      if (!filename) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        writeFn(filename, newContent)
      }, 500)
    },
    [filename, writeFn]
  )

  const handleRename = useCallback(
    async (newTitle: string) => {
      if (!filename || fileType !== 'memo') return
      const newFilename = await api.memoRename(filename, newTitle)
      setFilename(newFilename)
    },
    [filename, fileType, api]
  )

  const handleSwitchMemo = useCallback(
    (newFilename: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        if (filename) writeFn(filename, contentRef.current)
      }
      setFileType('memo')
      setFilename(newFilename)
    },
    [filename, writeFn]
  )

  const handleSwitchTodo = useCallback(
    (newFilename: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        if (filename) writeFn(filename, contentRef.current)
      }
      setFileType('todo')
      setFilename(newFilename)
    },
    [filename, writeFn]
  )

  const handleToggleMode = useCallback(async () => {
    if (filename && contentRef.current) {
      await writeFn(filename, contentRef.current)
      const readFn = fileType === 'memo' ? api.memoRead : api.todoReadRaw
      const freshContent = await readFn(filename)
      setContent(freshContent)
      contentRef.current = freshContent
    }
    setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))
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
        {mode === 'plain' ? (
          <PlainTextEditor key={`plain-${filename}-${mode}`} content={content} onChange={handleChange} />
        ) : (
          <TiptapEditor key={`wysiwyg-${filename}-${mode}`} content={content} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}

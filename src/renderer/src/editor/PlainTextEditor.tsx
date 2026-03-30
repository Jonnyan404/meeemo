import { useEffect, useRef } from 'react'

interface PlainTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function PlainTextEditor({ content, onChange }: PlainTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== content) {
      textareaRef.current.value = content
    }
  }, [content])

  return (
    <textarea
      ref={textareaRef}
      defaultValue={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="w-full h-full bg-transparent text-[var(--text-primary)] text-sm leading-relaxed resize-none outline-none p-6 font-mono placeholder:text-[var(--text-secondary)]"
      placeholder="Start writing..."
    />
  )
}

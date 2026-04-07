import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { Markdown } from '@tiptap/markdown'
import { useRef } from 'react'
import { useApi } from '../hooks/use-ipc'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

async function fileToBase64(file: File): Promise<{ base64: string; ext: string }> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  return { base64, ext }
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const isInternalRef = useRef(false)
  const api = useApi()
  const editorRef = useRef<any>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Markdown.configure({ html: false })
    ],
    content,
    contentType: 'markdown' as any,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isInternalRef.current) return
      const md = (editor as any).getMarkdown?.() ?? editor.getText()
      onChange(md)
    }
  })

  editorRef.current = editor

  const handleImageFiles = async (files: FileList | File[]) => {
    const ed = editorRef.current
    if (!ed) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const { base64, ext } = await fileToBase64(file)
        const relativePath = await api.imageSave(base64, ext)
        ed.chain().focus().setImage({ src: `asset://${relativePath}` }).run()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleImageFiles([file])
        return
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const hasImage = Array.from(files).some((f) => f.type.startsWith('image/'))
    if (hasImage) {
      e.preventDefault()
      handleImageFiles(files)
    }
  }

  return (
    <div
      className="tiptap-editor p-6 text-[var(--text-primary)] text-sm leading-snug min-h-full"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <EditorContent editor={editor} />
      <style>{`
        .tiptap-editor .tiptap {
          outline: none;
          min-height: 100%;
          color: var(--text-primary);
          line-height: 1.5;
        }
        .tiptap-editor .tiptap h1 { font-size: 1.5em; font-weight: 700; margin: 0.4em 0 0.2em; line-height: 1.3; }
        .tiptap-editor .tiptap h2 { font-size: 1.25em; font-weight: 600; margin: 0.35em 0 0.15em; line-height: 1.3; }
        .tiptap-editor .tiptap h3 { font-size: 1.1em; font-weight: 600; margin: 0.3em 0 0.1em; line-height: 1.3; }
        .tiptap-editor .tiptap p { margin: 0.2em 0; }
        .tiptap-editor .tiptap ul, .tiptap-editor .tiptap ol { padding-left: 1.5em; margin: 0.2em 0; }
        .tiptap-editor .tiptap li { margin: 0.1em 0; }
        .tiptap-editor .tiptap strong { font-weight: 700; }
        .tiptap-editor .tiptap em { font-style: italic; }
        .tiptap-editor .tiptap code { background: rgba(0,0,0,0.06); padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; font-family: ui-monospace, monospace; }
        [data-theme="dark"] .tiptap-editor .tiptap code { background: rgba(255,255,255,0.1); }
        .tiptap-editor .tiptap pre { background: rgba(0,0,0,0.04); padding: 0.75em 1em; border-radius: 6px; overflow-x: auto; margin: 0.3em 0; }
        [data-theme="dark"] .tiptap-editor .tiptap pre { background: rgba(255,255,255,0.05); }
        .tiptap-editor .tiptap pre code { background: none; padding: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; margin: 0.15em 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li label { margin-top: 0.1em; cursor: pointer; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; opacity: 0.5; }
        .tiptap-editor .tiptap a { color: var(--accent); text-decoration: underline; }
        .tiptap-editor .tiptap blockquote { border-left: 3px solid var(--border-color); padding-left: 1em; margin: 0.3em 0; margin-left: 0; color: var(--text-secondary); }
        .tiptap-editor .tiptap hr { border: none; border-top: 1px solid var(--border-color); margin: 0.5em 0; }
        .tiptap-editor .tiptap img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
      `}</style>
    </div>
  )
}

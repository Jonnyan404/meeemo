import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from '@tiptap/markdown'
import { useEffect, useRef } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const isUpdatingRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({ html: false })
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return
      try {
        const md = (editor as any).storage.markdown.getMarkdown()
        onChange(md)
      } catch {
        // fallback: get text content
        onChange(editor.getText())
      }
    }
  })

  return (
    <div className="tiptap-editor p-6 text-[var(--text-primary)] text-sm leading-snug min-h-full">
      <EditorContent editor={editor} />
      <style>{`
        .tiptap-editor .tiptap {
          outline: none;
          min-height: 100%;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .tiptap-editor .tiptap h1 { font-size: 1.5em; font-weight: 700; margin: 0.3em 0 0.15em; line-height: 1.25; color: var(--text-primary); }
        .tiptap-editor .tiptap h2 { font-size: 1.25em; font-weight: 600; margin: 0.3em 0 0.15em; line-height: 1.25; color: var(--text-primary); }
        .tiptap-editor .tiptap h3 { font-size: 1.1em; font-weight: 600; margin: 0.25em 0 0.1em; line-height: 1.3; color: var(--text-primary); }
        .tiptap-editor .tiptap p { margin: 0.15em 0; }
        .tiptap-editor .tiptap ul, .tiptap-editor .tiptap ol { padding-left: 1.5em; }
        .tiptap-editor .tiptap code { background: rgba(0,0,0,0.06); padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; font-family: monospace; }
        [data-theme="dark"] .tiptap-editor .tiptap code { background: rgba(255,255,255,0.1); }
        .tiptap-editor .tiptap pre { background: rgba(0,0,0,0.04); padding: 0.75em 1em; border-radius: 6px; overflow-x: auto; }
        [data-theme="dark"] .tiptap-editor .tiptap pre { background: rgba(255,255,255,0.05); }
        .tiptap-editor .tiptap pre code { background: none; padding: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li label { margin-top: 0.15em; }
        .tiptap-editor .tiptap ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; opacity: 0.5; }
        .tiptap-editor .tiptap a { color: var(--accent); text-decoration: underline; }
        .tiptap-editor .tiptap blockquote { border-left: 3px solid var(--border-color); padding-left: 1em; margin-left: 0; color: var(--text-secondary); }
        .tiptap-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  )
}

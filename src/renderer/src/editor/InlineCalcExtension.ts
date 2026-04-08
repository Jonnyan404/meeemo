import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { evaluate } from 'mathjs'

const pluginKey = new PluginKey('inlineCalc')

// Match: expression followed by = (with optional spaces)
// Captures everything before the = sign on the current line
const CALC_RE = /(.+?)\s*=\s*$/

function normalize(expr: string): string {
  return expr
    .replace(/（/g, '(').replace(/）/g, ')')   // Chinese parens
    .replace(/，/g, ',')                        // Chinese comma
    .replace(/×/g, '*').replace(/÷/g, '/')     // Math symbols
}

function tryEvaluate(expr: string): string | null {
  try {
    const result = evaluate(normalize(expr))
    if (result === undefined || result === null) return null
    // Format numbers nicely
    if (typeof result === 'number') {
      if (!isFinite(result)) return null
      // Avoid overly long decimals
      const str = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString()
      return str
    }
    // mathjs unit results have .toString()
    if (typeof result === 'object' && result.toString) {
      const str = result.toString()
      // Skip matrix/complex results that are too long
      if (str.length > 50) return null
      return str
    }
    return String(result)
  } catch {
    return null
  }
}

function getCalcDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    if (!node.isTextblock) return

    const text = node.textContent
    const match = text.match(CALC_RE)
    if (!match) return

    const expr = match[1].trim()
    if (!expr) return

    const result = tryEvaluate(expr)
    if (!result) return

    // Place the decoration at the end of the text node
    const endPos = pos + node.nodeSize - 1 // before closing tag

    const widget = Decoration.widget(endPos, () => {
      const span = document.createElement('span')
      span.textContent = ` ${result}`
      span.className = 'inline-calc-ghost'
      span.style.opacity = '0.4'
      span.style.fontStyle = 'italic'
      span.style.pointerEvents = 'none'
      span.style.userSelect = 'none'
      return span
    }, { side: 1, key: `calc-${pos}` })

    decorations.push(widget)
  })

  return DecorationSet.create(doc, decorations)
}

export const InlineCalc = Extension.create({
  name: 'inlineCalc',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: pluginKey,

        state: {
          init(_, { doc }) {
            return getCalcDecorations(doc)
          },
          apply(tr, oldDecorations) {
            if (tr.docChanged) {
              return getCalcDecorations(tr.doc)
            }
            return oldDecorations
          }
        },

        props: {
          decorations(state) {
            return pluginKey.getState(state)
          },

          handleKeyDown(view, event) {
            if (event.key !== 'Tab') return false

            const { state } = view
            const { selection } = state
            const { $from } = selection

            // Get the text of the current line
            const lineText = $from.parent.textContent
            const match = lineText.match(CALC_RE)
            if (!match) return false

            const expr = match[1].trim()
            if (!expr) return false

            const result = tryEvaluate(expr)
            if (!result) return false

            // Insert the result at cursor position
            event.preventDefault()
            editor.chain().focus().insertContent(result).run()
            return true
          }
        }
      })
    ]
  }
})

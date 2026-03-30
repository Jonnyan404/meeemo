import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync, statSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { loadConfig } from './config'

export interface MemoMeta {
  filename: string
  title: string
  modifiedAt: number
  preview: string
}

function memoDir(): string {
  return join(loadConfig().storagePath, 'memo')
}

export function listMemos(): MemoMeta[] {
  const dir = memoDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  return files
    .map((filename) => {
      const filepath = join(dir, filename)
      const stat = statSync(filepath)
      const content = readFileSync(filepath, 'utf-8')
      const firstLine = content.split('\n').find((l) => l.trim().length > 0) || ''
      return { filename, title: basename(filename, '.md'), modifiedAt: stat.mtimeMs, preview: firstLine.slice(0, 100) }
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
}

export function searchMemos(query: string): MemoMeta[] {
  const q = query.toLowerCase()
  const all = listMemos()
  return all
    .map((memo) => {
      const titleMatch = memo.title.toLowerCase().includes(q)
      const content = readFileSync(join(memoDir(), memo.filename), 'utf-8').toLowerCase()
      const contentMatch = content.includes(q)
      if (!titleMatch && !contentMatch) return null
      const contentSnippet = contentMatch ? extractSnippet(content, q) : ''
      return { ...memo, preview: titleMatch ? 'Title match' : contentSnippet, _score: titleMatch ? 2 : 1 }
    })
    .filter(Boolean)
    .sort((a, b) => (b as any)._score - (a as any)._score) as MemoMeta[]
}

function extractSnippet(content: string, query: string): string {
  const idx = content.indexOf(query)
  if (idx === -1) return ''
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + query.length + 30)
  return '...' + content.slice(start, end).replace(/\n/g, ' ') + '...'
}

export function readMemo(filename: string): string {
  return readFileSync(join(memoDir(), filename), 'utf-8')
}

export function writeMemo(filename: string, content: string): void {
  // Guard: don't write to a deleted file
  const filepath = join(memoDir(), filename)
  if (!existsSync(filepath)) return
  writeFileSync(filepath, content)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-')
}

export function createMemo(title: string): string {
  const dir = memoDir()
  const base = sanitizeFilename(title)
  let filename = `${base}.md`
  let counter = 1
  // Duplicate detection: add counter suffix
  while (existsSync(join(dir, filename))) {
    counter++
    filename = `${base} ${counter}.md`
  }
  writeFileSync(join(dir, filename), '')
  return filename
}

export function deleteMemo(filename: string): void {
  const filepath = join(memoDir(), filename)
  if (existsSync(filepath)) {
    unlinkSync(filepath)
  }
}

export function renameMemo(oldFilename: string, newTitle: string): string {
  const newFilename = `${sanitizeFilename(newTitle)}.md`
  renameSync(join(memoDir(), oldFilename), join(memoDir(), newFilename))
  return newFilename
}

import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs'
import { join, basename } from 'path'
import { loadConfig } from './config'

export interface TodoTask { text: string; done: boolean }
export interface TodoList { filename: string; name: string; tasks: TodoTask[] }

function todoDir(): string { return join(loadConfig().storagePath, 'todo') }

function parseTodoMd(content: string): TodoTask[] {
  return content.split('\n')
    .filter((line) => line.match(/^- \[([ x])\] /))
    .map((line) => ({ done: line.startsWith('- [x]'), text: line.replace(/^- \[[ x]\] /, '') }))
}

function serializeTodoMd(tasks: TodoTask[]): string {
  return tasks.map((t) => `- [${t.done ? 'x' : ' '}] ${t.text}`).join('\n') + '\n'
}

export function listTodoLists(): TodoList[] {
  const dir = todoDir()
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((filename) => {
    const content = readFileSync(join(dir, filename), 'utf-8')
    return { filename, name: basename(filename, '.md'), tasks: parseTodoMd(content) }
  })
}

export function readTodoList(filename: string): TodoList {
  const content = readFileSync(join(todoDir(), filename), 'utf-8')
  return { filename, name: basename(filename, '.md'), tasks: parseTodoMd(content) }
}

export function writeTodoList(filename: string, tasks: TodoTask[]): void {
  writeFileSync(join(todoDir(), filename), serializeTodoMd(tasks))
}

export function createTodoList(name: string): string {
  const filename = `${name}.md`
  writeFileSync(join(todoDir(), filename), '')
  return filename
}

export function readTodoRaw(filename: string): string {
  return readFileSync(join(todoDir(), filename), 'utf-8')
}

export function writeTodoRaw(filename: string, content: string): void {
  writeFileSync(join(todoDir(), filename), content)
}

export function deleteTodoList(filename: string): void { unlinkSync(join(todoDir(), filename)) }

export function renameTodoList(oldFilename: string, newName: string): string {
  const newFilename = `${newName}.md`
  renameSync(join(todoDir(), oldFilename), join(todoDir(), newFilename))
  return newFilename
}

export function totalUncompleted(): number {
  return listTodoLists().reduce((sum, list) => sum + list.tasks.filter((t) => !t.done).length, 0)
}

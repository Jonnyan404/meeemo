import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TodoItem } from './TodoItem'
import { TodoTabBar } from './TodoTabBar'
import { useApi } from '../hooks/use-ipc'

function SortableTodoItem({
  id,
  text,
  done,
  onToggle,
  onDelete
}: {
  id: string
  text: string
  done: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        text={text}
        done={done}
        onToggle={onToggle}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  )
}

export function TodoPopover() {
  const api = useApi()
  const [lists, setLists] = useState<TodoList[]>([])
  const [activeFilename, setActiveFilename] = useState<string>('')
  const [newTaskText, setNewTaskText] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)

  const loadLists = useCallback(async () => {
    const all = await api.todoList()
    setLists(all)
    if (!activeFilename && all.length > 0) {
      setActiveFilename(all[0].filename)
    }
  }, [api, activeFilename])

  useEffect(() => {
    loadLists()
  }, [loadLists])

  useEffect(() => {
    api.onDataChanged(() => loadLists())
  }, [api, loadLists])

  const activeList = lists.find((l) => l.filename === activeFilename)
  const tasks = activeList?.tasks || []
  const uncompleted = tasks.filter((t) => !t.done)
  const completed = tasks.filter((t) => t.done)
  const displayTasks = showCompleted ? [...uncompleted, ...completed] : uncompleted

  const saveTasks = useCallback(
    async (newTasks: TodoTask[]) => {
      if (!activeFilename) return
      await api.todoWrite(activeFilename, newTasks)
      ;(window as any).__electron_ipc_send?.('update-tray-badge')
      loadLists()
    },
    [activeFilename, api, loadLists]
  )

  const handleToggle = (index: number) => {
    const allTasks = [...tasks]
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], done: !allTasks[realIndex].done }
      const unc = allTasks.filter((t) => !t.done)
      const comp = allTasks.filter((t) => t.done)
      saveTasks([...unc, ...comp])
    }
  }

  const handleDelete = (index: number) => {
    const task = displayTasks[index]
    const newTasks = tasks.filter((t) => !(t.text === task.text && t.done === task.done))
    saveTasks(newTasks)
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    const newTask: TodoTask = { text: newTaskText.trim(), done: false }
    const unc = tasks.filter((t) => !t.done)
    const comp = tasks.filter((t) => t.done)
    saveTasks([...unc, newTask, ...comp])
    setNewTaskText('')
  }

  const handleCreateList = async (name: string) => {
    const filename = await api.todoCreateList(name)
    setActiveFilename(filename)
    loadLists()
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayTasks.findIndex((_, i) => `task-${i}` === active.id)
    const newIndex = displayTasks.findIndex((_, i) => `task-${i}` === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    const reordered = [...displayTasks]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    if (!showCompleted) {
      saveTasks([...reordered, ...completed])
    } else {
      saveTasks(reordered)
    }
  }

  return (
    <div
      className="frosted-fixed flex flex-col h-screen rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {activeList?.name || 'TODO'}
        </span>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{
            background: showCompleted ? 'rgba(0,0,0,0.06)' : 'var(--accent)',
            color: showCompleted ? 'var(--text-secondary)' : '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {showCompleted ? 'All' : 'Active'}
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto py-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayTasks.map((_, i) => `task-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {displayTasks.map((task, i) => (
              <SortableTodoItem
                key={`task-${i}`}
                id={`task-${i}`}
                text={task.text}
                done={task.done}
                onToggle={() => handleToggle(i)}
                onDelete={() => handleDelete(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!showCompleted && completed.length > 0 && (
          <div
            className="text-center text-xs py-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {completed.length} completed task{completed.length > 1 ? 's' : ''} hidden
          </div>
        )}

        {/* Add task input */}
        <div className="px-3 py-2">
          <input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
            }}
            placeholder="+ Add task..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(0,0,0,0.04)',
              color: 'var(--text-primary)',
              border: '1px solid transparent'
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              e.currentTarget.style.border = '1px solid var(--border-color)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.border = '1px solid transparent'
            }}
          />
        </div>
      </div>

      {/* Tab bar */}
      <TodoTabBar
        lists={lists.map((l) => ({ filename: l.filename, name: l.name }))}
        activeFilename={activeFilename}
        onSelect={setActiveFilename}
        onCreateList={handleCreateList}
        onDeleteList={async (filename) => {
          await api.todoDeleteList(filename)
          const remaining = lists.filter((l) => l.filename !== filename)
          if (remaining.length > 0) {
            setActiveFilename(remaining[0].filename)
          }
          loadLists()
        }}
        onRenameList={async (filename, newName) => {
          const newFilename = await api.todoRenameList(filename, newName)
          setActiveFilename(newFilename)
          loadLists()
        }}
      />
    </div>
  )
}

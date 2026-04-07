import { Notification } from 'electron'
import { listTodoLists } from './todo-service'
import { loadConfig } from './config'

// Parse reminder string "2026-4-7-0900+8" into a Date
export function parseReminderToDate(reminder: string): Date | null {
  const match = reminder.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(\d{2})([+-]\d{1,2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, offsetStr] = match
  const offset = parseInt(offsetStr, 10)
  // Build ISO string with explicit offset
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00${sign}${String(absOffset).padStart(2, '0')}:00`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

// Track which reminders have been notified: "lead:text@reminder" or "due:text@reminder"
const notified = new Set<string>()

function checkReminders(): void {
  const config = loadConfig()
  const leadMinutes = config.reminderLeadTime ?? 10
  const now = Date.now()
  const lists = listTodoLists()

  for (const list of lists) {
    for (const task of list.tasks) {
      if (task.done || !task.reminder) continue

      const dueDate = parseReminderToDate(task.reminder)
      if (!dueDate) continue

      const dueMs = dueDate.getTime()
      const leadMs = dueMs - leadMinutes * 60 * 1000

      // Lead-time notification
      if (leadMinutes > 0 && now >= leadMs && now < dueMs) {
        const key = `lead:${task.text}@${task.reminder}`
        if (!notified.has(key)) {
          notified.add(key)
          new Notification({
            title: 'Upcoming Task',
            body: `"${task.text}" is due in ${leadMinutes} min`,
            silent: false
          }).show()
        }
      }

      // Due notification
      if (now >= dueMs && now < dueMs + 60 * 1000) {
        const key = `due:${task.text}@${task.reminder}`
        if (!notified.has(key)) {
          notified.add(key)
          new Notification({
            title: 'Task Due Now',
            body: `"${task.text}" is due now`,
            silent: false
          }).show()
        }
      }
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null

export function startReminderScheduler(): void {
  if (intervalId) return
  // Check every 60 seconds (reminders are minute-precision)
  intervalId = setInterval(checkReminders, 60_000)
  // Also check immediately on start
  checkReminders()
}

export function stopReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

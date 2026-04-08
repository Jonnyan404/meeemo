import { app, Notification, BrowserWindow } from 'electron'
import { execFile } from 'child_process'
import { listTodoLists } from './todo-service'
import { loadConfig } from './config'

// Parse reminder string "2026-4-7-0900+8" into a Date
export function parseReminderToDate(reminder: string): Date | null {
  const match = reminder.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(\d{2})([+-]\d{1,2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, offsetStr] = match
  const offset = parseInt(offsetStr, 10)
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00${sign}${String(absOffset).padStart(2, '0')}:00`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

const notified = new Set<string>()

function broadcastToAll(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

let lastNotification: Notification | null = null

function sendNotification(title: string, body: string): void {
  // Try Electron native first
  try {
    if (Notification.isSupported()) {
      lastNotification = new Notification({ title, body, silent: false })
      lastNotification.show()
      return
    }
  } catch { /* fall through to osascript */ }

  // Fallback: osascript on macOS
  if (process.platform === 'darwin') {
    const safeTitle = title.replace(/["\\]/g, '\\$&')
    const safeBody = body.replace(/["\\]/g, '\\$&')
    execFile('osascript', ['-e', `display notification "${safeBody}" with title "${safeTitle}"`])
  }
}

function checkReminders(): void {
  const config = loadConfig()
  const leadMinutes = config.reminderLeadTime ?? 10
  const notificationType = config.notificationType ?? 'tray'
  const now = Date.now()
  const lists = listTodoLists()
  let newAlerts = false
  const alertMessages: string[] = []

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
          newAlerts = true
          const msg = `[${list.name}] "${task.text}" — due in ${leadMinutes} min`
          alertMessages.push(msg)
          if (notificationType === 'system' || notificationType === 'both') {
            sendNotification(`Upcoming · ${list.name}`, `"${task.text}" is due in ${leadMinutes} min`)
          }
        }
      }

      // Due notification
      if (now >= dueMs) {
        const key = `due:${task.text}@${task.reminder}`
        if (!notified.has(key)) {
          notified.add(key)
          newAlerts = true
          const msg = `[${list.name}] "${task.text}" — due now!`
          alertMessages.push(msg)
          if (notificationType === 'system' || notificationType === 'both') {
            sendNotification(`Due Now · ${list.name}`, `"${task.text}" is due now`)
          }
        }
      }
    }
  }

  // Always update tray badge
  const { updateTrayBadge } = require('./tray')
  updateTrayBadge()

  // When new alerts fire: bounce dock + show reminder popup + notify renderer
  if (newAlerts) {
    // Bounce dock icon for attention
    if (process.platform === 'darwin') {
      app.dock?.bounce?.('informational')
    }

    // Show reminder popup
    if (notificationType === 'tray' || notificationType === 'both') {
      const { getTray } = require('./tray')
      const { createReminderWindow } = require('./windows')
      const tray = getTray()
      createReminderWindow(
        tray?.getBounds(),
        alertMessages.map((msg) => {
          const match = msg.match(/^\[(.+?)\] "(.+?)" — (.+)$/)
          return match
            ? { title: match[2], body: `${match[3]} · ${match[1]}` }
            : { title: msg, body: '' }
        })
      )
    }

    // Tell visible renderers to show overdue banner (skip hidden windows like todo panel)
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && win.isVisible()) {
        win.webContents.send('reminder-alert')
      }
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null

export function startReminderScheduler(): void {
  if (intervalId) return
  checkReminders()
  intervalId = setInterval(checkReminders, 5_000)
}

export function stopReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

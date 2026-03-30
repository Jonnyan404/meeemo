import { Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

// 16x16 PNG checkmark icon embedded as base64 (macOS tray requires PNG)
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWElEQVR4nGNgoCJIAeITROIUXJqJBRiGkKIZq56hZcB/SgwAaYYFHk4D/jNgB8ia8RqQgsUQdM14DUA3BJtmggYgG4JNM1EGwAzBBVD0UJyUkQ0hKzORDQCUpjH8gbiXEQAAAABJRU5ErkJggg=='

export function createTray(): Tray {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Meeemo')
  updateTrayBadge()

  tray.on('click', (_event, bounds) => {
    createTodoWindow(bounds)
  })

  return tray
}

export function updateTrayBadge(): void {
  if (!tray) return
  const count = totalUncompleted()
  tray.setTitle(count > 0 ? `${count}` : '')
}

export function getTray(): Tray | null {
  return tray
}

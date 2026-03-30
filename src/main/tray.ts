import { Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

// 16x16 PNG cat face icon (macOS tray template image)
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVR4nGNgoCL4T4na/2QY8B+bADGGYFX7H5cEHs14DcBmCF412CSJwcPVAFyG4lNLXQOwaSToBXw2EitP0CWkJHfiAQAFrIh4o6hgmQAAAABJRU5ErkJggg=='

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

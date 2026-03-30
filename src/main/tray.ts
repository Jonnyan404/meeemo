import { Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  // 16x16 SVG → dataURL → nativeImage. Template image for macOS menu bar.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="black" stroke-width="1.2"/>
    <polyline points="4,8.5 7,11.5 12,5" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const icon = nativeImage.createFromDataURL(dataUrl)
  const resized = icon.resize({ width: 16, height: 16 })
  resized.setTemplateImage(true)
  return resized
}

export function createTray(): Tray {
  const icon = createTrayIcon()
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

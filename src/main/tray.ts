import { Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { totalUncompleted } from './todo-service'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  // Create a 22x22 template image with a simple checkmark
  const size = 22
  const canvas = Buffer.alloc(size * size * 4) // RGBA

  // Draw a simple square outline with rounded feel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      let alpha = 0

      // Border (2px inset)
      const inBorder = (x >= 3 && x < size - 3 && y >= 3 && y < size - 3) &&
                       (x < 5 || x >= size - 5 || y < 5 || y >= size - 5)
      // Checkmark: simple diagonal lines
      const checkLeft = (x >= 6 && x <= 9 && y >= 10 && y <= 14 && (x - 6) === (y - 10))
      const checkRight = (x >= 9 && x <= 16 && y >= 6 && y <= 14 && (16 - x) === (y - 6))

      if (inBorder || checkLeft || checkRight) alpha = 255

      canvas[idx] = 0     // R
      canvas[idx + 1] = 0 // G
      canvas[idx + 2] = 0 // B
      canvas[idx + 3] = alpha
    }
  }

  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size })
  icon.setTemplateImage(true)
  return icon
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

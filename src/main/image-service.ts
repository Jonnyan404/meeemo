import { writeFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { loadConfig } from './config'

function assetsDir(): string {
  return join(loadConfig().storagePath, 'assets')
}

export function saveImage(buffer: Buffer, ext: string): string {
  const hash = createHash('md5').update(buffer).digest('hex').slice(0, 8)
  const filename = `${Date.now()}-${hash}.${ext}`
  writeFileSync(join(assetsDir(), filename), buffer)
  return `assets/${filename}`
}

import { writeFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { net } from 'electron'
import { loadConfig } from './config'

function assetsDir(): string {
  return join(loadConfig().storagePath, 'assets')
}

function saveLocal(buffer: Buffer, ext: string): string {
  const hash = createHash('md5').update(buffer).digest('hex').slice(0, 8)
  const filename = `${Date.now()}-${hash}.${ext}`
  writeFileSync(join(assetsDir(), filename), buffer)
  return `assets/${filename}`
}

async function uploadToHost(buffer: Buffer, ext: string): Promise<string | null> {
  const config = loadConfig()
  const { type, apiKey, uploadUrl } = config.imageHost

  try {
    if (type === 'smms') {
      const formData = new FormData()
      formData.append('smfile', new Blob([buffer]), `image.${ext}`)
      const res = await net.fetch('https://sm.ms/api/v2/upload', {
        method: 'POST',
        headers: { Authorization: apiKey },
        body: formData as any
      })
      const data = await res.json()
      if (data.success) return data.data.url
      // SM.MS returns existing URL on duplicate
      if (data.code === 'image_repeated') return data.images
      return null
    }

    if (type === 'imgur') {
      const base64 = buffer.toString('base64')
      const res = await net.fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64, type: 'base64' })
      })
      const data = await res.json()
      if (data.success) return data.data.link
      return null
    }

    if (type === 'custom' && uploadUrl) {
      const formData = new FormData()
      formData.append('file', new Blob([buffer]), `image.${ext}`)
      const res = await net.fetch(uploadUrl, {
        method: 'POST',
        headers: apiKey ? { Authorization: apiKey } : {},
        body: formData as any
      })
      const data = await res.json()
      // Try common response patterns
      return data.url || data.data?.url || data.link || data.data?.link || null
    }
  } catch (e) {
    console.error('[image-host] Upload failed:', e)
  }
  return null
}

export async function saveImage(buffer: Buffer, ext: string): Promise<string> {
  const config = loadConfig()
  if (config.imageHost.enabled && config.imageHost.apiKey) {
    const remoteUrl = await uploadToHost(buffer, ext)
    if (remoteUrl) return remoteUrl
    // Fallback to local on failure
    console.warn('[image-host] Upload failed, falling back to local storage')
  }
  return saveLocal(buffer, ext)
}

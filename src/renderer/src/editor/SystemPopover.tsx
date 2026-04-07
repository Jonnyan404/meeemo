import { useState, useEffect } from 'react'
import { useApi } from '../hooks/use-ipc'

interface SystemPopoverProps {
  onClose: () => void
}

export function SystemPopover({ onClose }: SystemPopoverProps) {
  const api = useApi()
  const [shortcut, setShortcut] = useState('Alt+Space')
  const [isRecording, setIsRecording] = useState(false)
  const [shortcutError, setShortcutError] = useState('')
  const [shortcutTarget, setShortcutTarget] = useState<'command' | 'notes' | 'task'>('command')
  const [shortcutTargetOption, setShortcutTargetOption] = useState<'last-edit' | 'new' | 'first'>('last-edit')
  const [storagePath, setStoragePath] = useState('')
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available'>('idle')
  const [latestVersion, setLatestVersion] = useState('')

  useEffect(() => {
    api.configGet().then((config) => {
      setShortcut(config.globalShortcut || 'Alt+Space')
      setShortcutTarget(config.shortcutTarget || 'command')
      setShortcutTargetOption(config.shortcutTargetOption || 'last-edit')
      setStoragePath(config.storagePath || '')
      api.appVersion().then(setVersion)
    })
  }, [api])

  const handleShortcutRecord = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const parts: string[] = []
    if (e.metaKey) parts.push('Command')
    if (e.ctrlKey) parts.push('Control')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    const key = e.key
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
      parts.push(key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key)
      const combo = parts.join('+')
      setIsRecording(false)
      setShortcutError('')
      api.windowSetShortcut(combo).then((res: any) => {
        if (res?.error) {
          setShortcutError(res.error)
        } else {
          setShortcut(combo)
        }
      })
    }
  }

  const handleTargetChange = (target: 'command' | 'notes' | 'task') => {
    setShortcutTarget(target)
    api.configSet({ shortcutTarget: target } as any)
  }

  const handleTargetOptionChange = (option: 'last-edit' | 'new' | 'first') => {
    setShortcutTargetOption(option)
    api.configSet({ shortcutTargetOption: option } as any)
  }

  const checkForUpdates = async () => {
    setUpdateStatus('checking')
    try {
      const res = await fetch('https://api.github.com/repos/KasparChen/meeemo/releases/latest')
      if (!res.ok) { setUpdateStatus('latest'); return }
      const data = await res.json()
      const remote = (data.tag_name || '').replace(/^v/, '')
      if (remote && remote !== version) {
        setLatestVersion(remote)
        setUpdateStatus('available')
      } else {
        setUpdateStatus('latest')
      }
    } catch {
      setUpdateStatus('latest')
    }
  }

  return (
    <div
      className="absolute top-10 left-16 w-56 frosted-fixed rounded-lg border border-[var(--border-color)] shadow-xl z-50 p-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hotkey */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">HOTKEY</div>
      {isRecording ? (
        <div
          className="w-full px-2 py-1.5 rounded text-sm text-center border-2 border-[var(--accent)] text-[var(--accent)] outline-none animate-pulse"
          tabIndex={0}
          ref={(el) => el?.focus()}
          onKeyDown={handleShortcutRecord}
          onBlur={() => setIsRecording(false)}
        >
          Press shortcut...
        </div>
      ) : (
        <button
          onClick={() => { setIsRecording(true); setShortcutError('') }}
          className="w-full px-2 py-1.5 rounded text-sm bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] text-center cursor-pointer hover:bg-black/8"
        >
          {shortcut}
        </button>
      )}
      {shortcutError && (
        <div className="text-[10px] text-red-500 mt-1">{shortcutError}</div>
      )}

      {/* Hotkey Target */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mt-3 mb-2">HOTKEY TARGET</div>
      <select
        value={shortcutTarget}
        onChange={(e) => handleTargetChange(e.target.value as any)}
        className="w-full px-2 py-1.5 rounded text-sm bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] outline-none cursor-pointer"
      >
        <option value="command">Command Palette</option>
        <option value="notes">Notes</option>
        <option value="task">Tasks</option>
      </select>

      {shortcutTarget !== 'command' && (
        <>
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mt-2 mb-1">OPEN BEHAVIOR</div>
          <select
            value={shortcutTargetOption}
            onChange={(e) => handleTargetOptionChange(e.target.value as any)}
            className="w-full px-2 py-1.5 rounded text-sm bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] outline-none cursor-pointer"
          >
            <option value="last-edit">Last Edited</option>
            <option value="new">New</option>
            <option value="first">First</option>
          </select>
        </>
      )}

      {/* Storage path */}
      <div className="border-t border-[var(--border-color)] mt-3 pt-2">
        <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">STORAGE</div>
        <div className="text-[10px] text-[var(--text-secondary)] truncate mb-1" title={storagePath}>
          {storagePath}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => api.openStorage()}
            className="flex-1 text-[10px] px-2 py-1 rounded bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-black/8 cursor-pointer"
          >
            Open Folder
          </button>
          <button
            onClick={async () => {
              const newPath = await api.changeStorage()
              if (newPath) setStoragePath(newPath)
            }}
            className="flex-1 text-[10px] px-2 py-1 rounded bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-black/8 cursor-pointer"
          >
            Change...
          </button>
        </div>
      </div>

      {/* Version & Update */}
      <div className="border-t border-[var(--border-color)] mt-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-secondary)]">v{version}</span>
          {updateStatus === 'idle' && (
            <button
              onClick={checkForUpdates}
              className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
              style={{ border: 'none', background: 'none' }}
            >
              Check for updates
            </button>
          )}
          {updateStatus === 'checking' && (
            <span className="text-[10px] text-[var(--text-secondary)]">Checking...</span>
          )}
          {updateStatus === 'latest' && (
            <span className="text-[10px] text-green-600">Up to date</span>
          )}
          {updateStatus === 'available' && (
            <button
              onClick={() => api.openUrl('https://github.com/KasparChen/meeemo/releases/latest')}
              className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
              style={{ border: 'none', background: 'none' }}
            >
              v{latestVersion} available →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

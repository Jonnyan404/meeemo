import { useState, useEffect } from 'react'
import { useApi } from '../hooks/use-ipc'

interface SettingsPopoverProps {
  onClose: () => void
}

export function SettingsPopover({ onClose }: SettingsPopoverProps) {
  const api = useApi()
  const [opacity, setOpacity] = useState(0.85)
  const [panelColor, setPanelColor] = useState('#ffffff')
  const [fontColor, setFontColor] = useState('#1a1a1a')
  const [level, setLevel] = useState<'always' | 'normal' | 'bottom'>('always')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [shortcut, setShortcut] = useState('Alt+Space')
  const [isRecording, setIsRecording] = useState(false)
  const [shortcutError, setShortcutError] = useState('')

  useEffect(() => {
    api.configGet().then((config) => {
      const ws = config.lastWindowState
      setOpacity(ws.opacity)
      setPanelColor(ws.panelColor)
      setFontColor(ws.fontColor)
      setLevel(ws.alwaysOnTop)
      setTheme(config.theme)
      setShortcut(config.globalShortcut || 'Alt+Space')
      const { r, g, b } = hexToRgb(ws.panelColor)
      document.documentElement.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${ws.opacity})`)
      document.documentElement.style.setProperty('--text-primary', ws.fontColor)
      document.documentElement.setAttribute('data-theme', config.theme)
    })
  }, [api])

  const updateWindowState = (partial: Record<string, unknown>) => {
    api.configSet({ lastWindowState: partial } as any)
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const applyPanelBg = (color: string, alpha: number) => {
    const { r, g, b } = hexToRgb(color)
    document.documentElement.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${alpha})`)
  }

  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    applyPanelBg(panelColor, value)
    updateWindowState({ opacity: value })
  }

  const handlePanelColorChange = (value: string) => {
    setPanelColor(value)
    applyPanelBg(value, opacity)
    updateWindowState({ panelColor: value })
  }

  const handleFontColorChange = (value: string) => {
    setFontColor(value)
    document.documentElement.style.setProperty('--text-primary', value)
    updateWindowState({ fontColor: value })
  }

  const handleLevelChange = (newLevel: 'always' | 'normal' | 'bottom') => {
    setLevel(newLevel)
    api.windowSetLevel(newLevel)
    updateWindowState({ alwaysOnTop: newLevel })
  }

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

  const THEME_DEFAULTS = {
    light: { panelColor: '#ffffff', fontColor: '#1a1a1a' },
    dark: { panelColor: '#1c1c1e', fontColor: '#f2f2f2' }
  }

  const handleThemeToggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    const defaults = THEME_DEFAULTS[next]
    setTheme(next)
    setPanelColor(defaults.panelColor)
    setFontColor(defaults.fontColor)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.removeProperty('--panel-bg')
    document.documentElement.style.removeProperty('--text-primary')
    api.configSet({
      theme: next,
      lastWindowState: { panelColor: defaults.panelColor, fontColor: defaults.fontColor } as any
    })
  }

  return (
    <div
      className="absolute top-10 right-16 w-56 frosted-fixed rounded-lg border border-[var(--border-color)] shadow-xl z-50 p-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Theme toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider">THEME</span>
        <button
          onClick={handleThemeToggle}
          className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white"
        >
          {theme === 'light' ? '☀ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="border-t border-[var(--border-color)] my-2" />

      {/* Opacity */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">OPACITY</div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="range" min="1" max="100"
          value={Math.round(opacity * 100)}
          onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="text-xs text-[var(--text-secondary)] w-8 text-right">{Math.round(opacity * 100)}%</span>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">PANEL</div>
          <input
            type="color" value={panelColor}
            onChange={(e) => handlePanelColorChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer border-0"
          />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">FONT</div>
          <input
            type="color" value={fontColor}
            onChange={(e) => handleFontColorChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer border-0"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] my-2" />

      {/* Window level */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-2">WINDOW LEVEL</div>
      <select
        value={level}
        onChange={(e) => handleLevelChange(e.target.value as 'always' | 'normal' | 'bottom')}
        className="w-full px-2 py-1.5 rounded text-sm bg-black/5 text-[var(--text-primary)] border border-[var(--border-color)] outline-none cursor-pointer"
      >
        <option value="always">Always on Top</option>
        <option value="normal">Normal</option>
        <option value="bottom">Always on Bottom</option>
      </select>

      {/* Shortcut */}
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mt-3 mb-2">SHORTCUT</div>
      {isRecording ? (
        <div
          className="w-full px-2 py-1.5 rounded text-sm text-center border-2 border-[var(--accent)] text-[var(--accent)] outline-none animate-pulse"
          tabIndex={0}
          autoFocus
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
    </div>
  )
}

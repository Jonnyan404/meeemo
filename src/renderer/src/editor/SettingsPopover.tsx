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

  useEffect(() => {
    api.configGet().then((config) => {
      const ws = config.lastWindowState
      setOpacity(ws.opacity)
      setPanelColor(ws.panelColor)
      setFontColor(ws.fontColor)
      setLevel(ws.alwaysOnTop)
      setTheme(config.theme)
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
      className="absolute top-10 left-2 w-56 frosted-glass rounded-lg border border-[var(--border-color)] shadow-xl z-50 p-3"
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
          type="range" min="20" max="100"
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
      {(['always', 'normal', 'bottom'] as const).map((l) => (
        <button
          key={l}
          onClick={() => handleLevelChange(l)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm ${
            level === l ? 'bg-[var(--accent)]/15 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="mr-2">{level === l ? '●' : '○'}</span>
          {l === 'always' ? 'Always on Top' : l === 'normal' ? 'Normal' : 'Always on Bottom'}
        </button>
      ))}

      {/* Close button */}
      <div className="border-t border-[var(--border-color)] mt-2 pt-2">
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1"
        >
          Close
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

interface AlertItem {
  title: string
  body: string
}

export function ReminderPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    const api = (window as any).api
    if (api?.onReminderData) {
      api.onReminderData((data: AlertItem[]) => setAlerts(data))
    }
  }, [])

  // Auto-close after 8 seconds
  useEffect(() => {
    if (alerts.length === 0) return
    const timer = setTimeout(() => {
      ;(window as any).api?.windowClose()
    }, 8000)
    return () => clearTimeout(timer)
  }, [alerts])

  if (alerts.length === 0) return null

  return (
    <div
      className="frosted-fixed rounded-xl overflow-hidden p-3"
      style={{ border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: '#a1845c' }}>
          Task Reminder
        </span>
        <button
          onClick={() => (window as any).api?.windowClose()}
          className="text-xs"
          style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      {alerts.map((a, i) => (
        <div
          key={i}
          className="text-xs py-1.5"
          style={{
            color: 'var(--text-primary)',
            borderTop: i > 0 ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <div className="font-medium">{a.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{a.body}</div>
        </div>
      ))}
    </div>
  )
}

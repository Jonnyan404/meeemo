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
      {alerts.map((a, i) => {
        // body format: "due now! · ListName" or "due in X min · ListName"
        const [dueStatus, listName] = a.body.split(' · ')
        const isNow = dueStatus?.includes('now')

        return (
          <div
            key={i}
            className="py-2"
            style={{
              borderTop: i > 0 ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {a.title}
            </div>
            <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  fontWeight: 700,
                  color: isNow ? '#ef4444' : '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}
              >
                {dueStatus}
              </span>
              {listName && (
                <span style={{ color: 'var(--text-secondary)' }}>· {listName}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PaletteItemProps {
  icon: string
  label: string
  sublabel?: string
  badge?: string
  selected: boolean
  onClick: () => void
}

export function PaletteItem({ icon, label, sublabel, badge, selected, onClick }: PaletteItemProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg mx-2 ${
        selected ? 'bg-[var(--accent)]/10' : 'hover:bg-black/5'
      }`}
      onClick={onClick}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text-primary)] truncate">{label}</div>
        {sublabel && <div className="text-xs text-[var(--text-secondary)] truncate">{sublabel}</div>}
      </div>
      {badge && (
        <span className="bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  )
}

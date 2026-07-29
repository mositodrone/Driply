import { Link } from '@tanstack/react-router'

interface TopBarProps {
  projectName: string
  onOpenFlow: () => void
  hasUnsaved: boolean
  savedAt: Date | null
  onBack: (e: React.MouseEvent) => void
}

export function TopBar({ projectName, onOpenFlow, hasUnsaved, savedAt, onBack }: TopBarProps) {
  return (
    <header data-dash="topbar" className="dash-topbar">
      <div className="flex items-center gap-3">
        {/* Back — handled manually to respect unsaved guard */}
        <Link to="/" className="dash-back-btn" onClick={onBack}>
          ← Back
        </Link>
        <div className="w-px h-5 bg-white/10" />
        <span className="dash-project-name">{projectName}</span>
        <span className="dash-status-badge">
          <span className="dash-status-dot" /> Beta
        </span>

        {hasUnsaved && (
          <span className="text-[0.62rem] text-[#FFD60A]/70 hidden sm:block">
            ● Unsaved
          </span>
        )}
        {!hasUnsaved && savedAt && (
          <span className="text-[0.62rem] text-white/22 hidden sm:block">
            Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="dash-btn-ghost" onClick={onOpenFlow}>
          Export Preview ↓
        </button>
        <button className="dash-btn-lime" onClick={onOpenFlow}>
          Request Quote →
        </button>
      </div>
    </header>
  )
}

import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

interface TopBarProps {
  projectName:      string
  onRename:         (name: string) => void
  onOpenPreview:    () => void   // Export Preview — opens ExportPreviewModal
  onOpenFlow:       () => void   // Request Quote — opens OrderFlowOverlay
  onOpenSubmission: () => void   // Submit Design — opens DesignSubmissionOverlay
  hasUnsaved:       boolean
  savedAt:          Date | null
  onBack:           (e: React.MouseEvent) => void
  canAct:           boolean
  hasGarment:       boolean
  hasElements:      boolean
}

export function TopBar({
  projectName, onRename,
  onOpenPreview, onOpenFlow, onOpenSubmission,
  hasUnsaved, savedAt, onBack,
  canAct, hasGarment, hasElements,
}: TopBarProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(projectName)
  const inputRef              = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(projectName)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function commit() {
    const name = draft.trim() || 'Untitled Design'
    setEditing(false)
    onRename(name)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setEditing(false)            }
  }

  const disabledClass = 'opacity-30 cursor-not-allowed'

  // Granular tooltip — tells user exactly what's missing
  const disabledTitle =
    !hasGarment  ? 'Pick a garment from the selector first' :
    !hasElements ? 'Add at least one element to your design' :
                   ''

  return (
    <header data-dash="topbar" className="dash-topbar">
      <div className="flex items-center gap-3">
        <Link to="/" className="dash-back-btn" onClick={onBack}>
          ← Back
        </Link>
        <div className="w-px h-5 bg-white/10" />

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className="dash-project-name bg-transparent border-b border-white/30 outline-none w-40 text-white placeholder-white/25"
            placeholder="Untitled Design"
            maxLength={48}
            spellCheck={false}
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to rename"
            className="dash-project-name hover:text-white/70 transition-colors cursor-text"
          >
            {projectName}
          </button>
        )}

        <span className="dash-status-badge dash-topbar-meta">
          <span className="dash-status-dot" /> Beta
        </span>

        {hasUnsaved && (
          <span className="dash-topbar-meta text-[0.62rem] text-[#FFD60A]/70">
            ● Unsaved
          </span>
        )}
        {!hasUnsaved && savedAt && (
          <span className="dash-topbar-meta text-[0.62rem] text-white/22">
            Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Submit Design — opens unprocessed order flow */}
        <button
          className={`dash-btn-ghost transition-opacity ${!canAct ? disabledClass : ''}`}
          onClick={canAct ? onOpenSubmission : undefined}
          title={canAct ? 'Submit your design for a quote' : disabledTitle}
          aria-disabled={!canAct}
        >
          Submit Design ✦
        </button>

        {/* Export Preview — disabled until garment + element present */}
        <button
          className={`dash-btn-ghost transition-opacity ${!canAct ? disabledClass : ''}`}
          onClick={canAct ? onOpenPreview : undefined}
          title={canAct ? 'Preview your design' : disabledTitle}
          aria-disabled={!canAct}
        >
          Export Preview ↓
        </button>

        {/* Request Quote — same guard, triggers order flow */}
        <button
          className={`dash-btn-lime transition-opacity ${!canAct ? disabledClass : ''}`}
          onClick={canAct ? onOpenFlow : undefined}
          title={canAct ? 'Request a quote' : disabledTitle}
          aria-disabled={!canAct}
        >
          Request Quote →
        </button>
      </div>
    </header>
  )
}

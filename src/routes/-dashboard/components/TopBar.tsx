import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

interface TopBarProps {
  projectName:    string
  onRename:       (name: string) => void
  onOpenPreview:  () => void   // Export Preview — opens ExportPreviewModal
  onOpenFlow:     () => void   // Request Quote — opens OrderFlowOverlay
  hasUnsaved:     boolean
  savedAt:        Date | null
  onBack:         (e: React.MouseEvent) => void
  /** Both action buttons are disabled until a garment is active AND
   *  at least one design element has been placed on the canvas. */
  canAct:         boolean
}

export function TopBar({
  projectName, onRename,
  onOpenPreview, onOpenFlow,
  hasUnsaved, savedAt, onBack,
  canAct,
}: TopBarProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(projectName)
  const inputRef              = useRef<HTMLInputElement>(null)

  // Which disabled-button hint is being shown via tap (touch devices don't
  // get hover, so clicking a disabled button surfaces the tooltip instead
  // of doing nothing). Hover still works on its own via CSS below — this
  // state only covers the tap case, and auto-dismisses.
  const [tapHint, setTapHint] = useState<'preview' | 'flow' | null>(null)
  const tapHintTimeout        = useRef<ReturnType<typeof setTimeout>>()

  function showTapHint(which: 'preview' | 'flow') {
    setTapHint(which)
    clearTimeout(tapHintTimeout.current)
    tapHintTimeout.current = setTimeout(() => setTapHint(null), 2200)
  }

  useEffect(() => () => clearTimeout(tapHintTimeout.current), [])

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

  // NOTE: no `pointer-events-none` here on purpose — that would block the
  // button from ever receiving hover/click, which is what made the old
  // `title` tooltip unreachable. onClick is guarded per-button instead
  // (see below) so the disabled state still can't trigger the real action.
  const disabledClass = 'opacity-30 cursor-not-allowed'

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
        {/* Export Preview — disabled until garment + element present */}
        <div className="relative group">
          <button
            className={`dash-btn-ghost transition-opacity ${!canAct ? disabledClass : ''}`}
            onClick={canAct ? onOpenPreview : () => showTapHint('preview')}
            aria-disabled={!canAct}
            aria-describedby={!canAct ? 'topbar-tip-preview' : undefined}
          >
            Export Preview ↓
          </button>
          {!canAct && (
            <TopBarTip id="topbar-tip-preview" visible={tapHint === 'preview'}>
              Add an element to your design first
            </TopBarTip>
          )}
        </div>

        {/* Request Quote — same guard, triggers order flow */}
        <div className="relative group">
          <button
            className={`dash-btn-lime transition-opacity ${!canAct ? disabledClass : ''}`}
            onClick={canAct ? onOpenFlow : () => showTapHint('flow')}
            aria-disabled={!canAct}
            aria-describedby={!canAct ? 'topbar-tip-flow' : undefined}
          >
            Request Quote →
          </button>
          {!canAct && (
            <TopBarTip id="topbar-tip-flow" visible={tapHint === 'flow'}>
              Add an element to your design first
            </TopBarTip>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Disabled-button tooltip ───────────────────────────────────────────────────
//  Shows on hover (via CSS `group-hover`, so no JS needed for desktop) or
//  briefly on tap (via the `visible` prop, driven by tapHint state above —
//  touch devices don't fire hover at all). Positioned above the button it
//  belongs to; the parent must have `className="relative group"`.
function TopBarTip({ id, visible, children }: { id: string; visible: boolean; children: React.ReactNode }) {
  return (
    <div
      id={id}
      role="tooltip"
      className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50
        px-3 py-1.5 rounded-lg whitespace-nowrap
        text-[0.68rem] text-white/85 bg-[#141416] border border-white/10 shadow-lg
        transition-all duration-150 ease-out
        ${visible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100'}
      `}
    >
      {children}
      {/* Little arrow pointing down at the button */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#141416] border-r border-b border-white/10" />
    </div>
  )
}

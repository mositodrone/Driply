import gsap from 'gsap'
import type { DriplyEl, ShapeType, View } from '../models/canvas-element'
import type { GarmentSelection } from '../../components/GarmentSelector'
import { GARMENT_MAP } from '../../data/garments'

interface LeftPanelProps {
  view:             View
  setView:          (v: View) => void
  elements:         DriplyEl[]
  selectedId:       string | null
  setSelectedId:    (id: string | null) => void
  onDeleteSelected: () => void
  onAddText?:       () => void
  onAddShape?:      (type: ShapeType) => void
  fileInputRef:     React.RefObject<HTMLInputElement>
  onOpenSelector:   () => void
  activeGarment:    GarmentSelection | null
  toolsEnabled?:    boolean
  onUndo?:          () => void
  onRedo?:          () => void
  canUndo?:         boolean
  canRedo?:         boolean
  onMoveUp?:        (id: string) => void
  onMoveDown?:      (id: string) => void
  onMoveToFront?:   (id: string) => void
  onMoveToBack?:    (id: string) => void
  onToggleLock?:    (id: string) => void
}

const SHAPE_DEFS: { type: ShapeType; icon: string; label: string }[] = [
  { type: 'rect',     icon: '▭', label: 'Rectangle' },
  { type: 'circle',   icon: '○', label: 'Circle'    },
  { type: 'triangle', icon: '△', label: 'Triangle'  },
]

export function LeftPanel({
  view, setView, elements, selectedId, setSelectedId,
  onDeleteSelected, onAddText, onAddShape, fileInputRef,
  onOpenSelector, activeGarment, toolsEnabled = true,
  onUndo, onRedo, canUndo = false, canRedo = false,
  onMoveUp, onMoveDown, onMoveToFront, onMoveToBack, onToggleLock,
}: LeftPanelProps) {
  function popBtn(e: React.MouseEvent<HTMLButtonElement>) {
    gsap.fromTo(e.currentTarget,
      { scale: 0.92 },
      { scale: 1, duration: 0.35, ease: 'elastic.out(1.2, 0.5)' }
    )
  }

  const disabled = !toolsEnabled

  // Layer type icon
  function layerIcon(el: DriplyEl) {
    if (el.type === 'text')  return '🔤'
    if (el.type === 'shape') {
      if (el.shapeType === 'circle')   return '○'
      if (el.shapeType === 'triangle') return '△'
      return '▭'
    }
    return '🖼'
  }

  function layerLabel(el: DriplyEl) {
    if (el.type === 'text')  return `"${(el.text ?? '').slice(0, 18)}${(el.text ?? '').length > 18 ? '…' : ''}"`
    if (el.type === 'shape') return `${el.shapeType ?? 'shape'}`
    return 'Image'
  }

  return (
    <aside data-dash="left" className="dash-panel-left">

      {/* ── Garment selector ── */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <p className="dash-panel-label">Garment</p>
        <div className="dash-garment-card" onClick={onOpenSelector}>
          <div className="dash-garment-thumb"
            style={activeGarment ? { background: `${activeGarment.color.hex}22` } : {}}>
            <span style={{ fontSize: '1.3rem' }}>
              {activeGarment ? (GARMENT_MAP[activeGarment.garment.id]?.emoji ?? '👕') : '👕'}
            </span>
          </div>
          <div>
            <div className="text-[0.8rem] font-semibold text-white/90">
              {activeGarment ? activeGarment.garment.name : 'Choose a garment'}
            </div>
            <div className="text-[0.68rem] text-white/35 mt-0.5">
              {activeGarment
                ? `${activeGarment.color.label} · ${activeGarment.size}`
                : 'Click to select'}
            </div>
          </div>
          <span className="text-white/25 text-xs ml-auto">›</span>
        </div>

        {/* View toggle */}
        <div className="dash-view-toggle mt-3">
          {(['front', 'back'] as View[]).map(v => (
            <button key={v}
              className={`dash-view-btn ${view === v ? 'dash-view-active' : ''}`}
              onClick={e => { popBtn(e); setView(v) }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add elements ── */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex flex-col gap-2">
        <p className="dash-panel-label mb-1">Add</p>

        <button
          className={`dash-add-btn ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
          disabled={disabled}
          onClick={e => { if (!disabled) { popBtn(e); onAddText?.() } }}
        >
          <span>𝐓</span> Add Text
        </button>

        <button
          className={`dash-add-btn ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
          disabled={disabled}
          onClick={e => { if (!disabled) { popBtn(e); fileInputRef.current?.click() } }}
        >
          <span>🖼</span> Upload Image
        </button>

        {/* Shape buttons */}
        <div className="flex gap-1.5 mt-0.5">
          {SHAPE_DEFS.map(s => (
            <button
              key={s.type}
              title={s.label}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors
                ${disabled
                  ? 'opacity-30 cursor-not-allowed border-white/10 text-white/30'
                  : 'border-white/10 text-white/60 hover:border-[#C8F135]/40 hover:text-[#C8F135] hover:bg-[#C8F135]/05'
                }`}
              disabled={disabled}
              onClick={e => { if (!disabled) { popBtn(e); onAddShape?.(s.type) } }}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Undo / Redo ── */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex gap-2">
        <button
          className="flex-1 py-1.5 rounded-lg text-[0.72rem] text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          onClick={onUndo} disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >↩ Undo</button>
        <button
          className="flex-1 py-1.5 rounded-lg text-[0.72rem] text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          onClick={onRedo} disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >↪ Redo</button>
      </div>

      {/* ── Layers ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="dash-panel-label mb-2">Layers</p>
        {elements.length === 0 && (
          <p className="text-[0.72rem] text-white/25 text-center mt-6 leading-relaxed">
            No elements yet.<br />Add text, image, or a shape.
          </p>
        )}
        <div className="flex flex-col gap-1" data-dash="layer-list">
          {[...elements].reverse().map(el => (
            <div key={el.id}>
              {/* Layer row */}
              <div
                data-layer-id={el.id}
                className={`dash-layer-row ${selectedId === el.id ? 'dash-layer-active' : ''} ${el.locked ? 'opacity-50' : ''}`}
                onClick={() => setSelectedId(el.id)}
              >
                <span className="text-[0.9rem] w-5 text-center">{layerIcon(el)}</span>
                <span className="flex-1 text-[0.72rem] truncate text-white/70">
                  {layerLabel(el)}
                </span>

                {/* Lock toggle */}
                <button
                  title={el.locked ? 'Unlock layer' : 'Lock layer'}
                  className="text-[0.7rem] text-white/20 hover:text-white/60 transition-colors px-0.5"
                  onClick={e => { e.stopPropagation(); onToggleLock?.(el.id) }}
                >
                  {el.locked ? '🔒' : '🔓'}
                </button>

                {/* Delete */}
                <button
                  className="text-white/20 hover:text-[#FF5B3A] text-[0.75rem] transition-colors"
                  onClick={e => {
                    e.stopPropagation()
                    const row = e.currentTarget.closest('[data-layer-id]') as HTMLElement
                    if (row) {
                      gsap.to(row, {
                        x: -16, opacity: 0, height: 0,
                        paddingTop: 0, paddingBottom: 0, marginBottom: 0,
                        duration: 0.25, ease: 'power2.in',
                        onComplete: () => { setSelectedId(el.id); onDeleteSelected() },
                      })
                    }
                  }}
                >✕</button>
              </div>

              {/* Layer order controls — only show for selected layer */}
              {selectedId === el.id && (
                <div className="flex gap-1 ml-5 mb-1">
                  {[
                    { label: '⬆⬆', title: 'Bring to front', fn: () => onMoveToFront?.(el.id) },
                    { label: '↑',   title: 'Move up',        fn: () => onMoveUp?.(el.id)      },
                    { label: '↓',   title: 'Move down',      fn: () => onMoveDown?.(el.id)    },
                    { label: '⬇⬇', title: 'Send to back',   fn: () => onMoveToBack?.(el.id)  },
                  ].map(btn => (
                    <button
                      key={btn.title}
                      title={btn.title}
                      onClick={btn.fn}
                      className="flex-1 py-0.5 text-[0.6rem] text-white/30 hover:text-[#C8F135] border border-white/[0.06] hover:border-[#C8F135]/30 rounded-lg transition-colors"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Delete selected ── */}
      {selectedId && (
        <div className="px-4 pb-4">
          <button
            className="w-full py-2 rounded-xl border border-[#FF5B3A]/30 text-[#FF5B3A] text-[0.78rem] font-medium hover:bg-[#FF5B3A]/10 transition-colors"
            onClick={onDeleteSelected}
          >
            Delete selected
          </button>
        </div>
      )}
    </aside>
  )
}

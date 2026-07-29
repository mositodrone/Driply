//  DRIPLY — Design Studio
//  src/routes/dashboard.tsx
//
//  Changes from previous version:
//  - Empty state UI when no garment selected (dashboard loads first, selector
//    opens on user action — no auto-open on mount)
//  - Left panel tools greyed out + tooltip-gated until a garment is active
//  - Undo / redo stack (Ctrl+Z / Ctrl+Y) wired to keyboard shortcuts
//  - Snap-to-center guide lines on Konva stage during element drag
//  - GarmentSelector view toggle extended to front/back/leftArm/rightArm
// ============================================================

import { useGSAP } from '@gsap/react'
import { createFileRoute, useBlocker } from '@tanstack/react-router'
import gsap from 'gsap'
import Flip from 'gsap/Flip'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage } from 'react-konva'

import { CanvasToolbar } from './-dashboard/components/CanvasToolbar'
import { GarmentNode } from './-dashboard/components/GarmentNode'
import { ImageNode } from './-dashboard/components/ImageNode'
import { LeftPanel } from './-dashboard/components/LeftPanel'
import { RightPanel } from './-dashboard/components/RightPanel'
import { ShapeNode } from './-dashboard/components/ShapeNode'
import { TextNode } from './-dashboard/components/TextNode'
import { TopBar } from './-dashboard/components/TopBar'

import { DZ, STAGE_H, STAGE_W } from './-dashboard/constants/canvas'
import { useCanvasDesign } from './-dashboard/hooks/useCanvasDesign'
import { useToast } from './-dashboard/hooks/useToast'
import { uid, type DriplyEl, type ShapeType, type View } from './-dashboard/models/canvas-element'

import type { DesignDraft } from './-dashboard/models/design'

import { GarmentSelector, type GarmentSelection } from './components/GarmentSelector'
import { OrderFlowOverlay } from './components/OrderFlowOverlay'
import { getColorFilter } from './data/garments'

gsap.registerPlugin(useGSAP, Flip)

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// ── Snap guide threshold (px on canvas) ──────────────────────────────────────
const SNAP_THRESHOLD = 8
const STAGE_CX = STAGE_W / 2
const STAGE_CY = STAGE_H / 2

function DashboardPage() {
  // ── Design ID ─────────────────────────────────────────────────────────────
  const [designId] = useState<string>(() => {
    const existing = sessionStorage.getItem('driply_active_design')
    if (existing) return existing
    const id = uid()
    sessionStorage.setItem('driply_active_design', id)
    return id
  })

  const {
    view, setView,
    tool, setTool,
    zoom, setZoom,
    elements, setElements,
    selectedId, setSelectedId,
    selected,
    updateElement,
    deleteSelected,
    addText,
    handleImageUpload,
    handleStageClick,
    // ── Undo / redo — these need to be exposed from useCanvasDesign.
    //    If they aren't yet, see the implementation note at the bottom
    //    of this file.
    undo,
    redo,
  } = useCanvasDesign()

  const [orderOpen,         setOrderOpen]         = useState(false)
  const [selectorOpen,      setSelectorOpen]       = useState(false)
  const [activeGarment,     setActiveGarment]      = useState<GarmentSelection | null>(null)
  const [hasUnsaved,        setHasUnsaved]         = useState(false)
  const [savedAt,           setSavedAt]            = useState<Date | null>(null)
  const [designPreviewUrl,  setDesignPreviewUrl]   = useState<string | undefined>(undefined)

  // Snap guide visibility — which centre lines are currently showing
  const [snapGuides, setSnapGuides] = useState<{ h: boolean; v: boolean }>({ h: false, v: false })

  const stageRef      = useRef<any>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const rootRef       = useRef<HTMLDivElement>(null)
  const saveTimer     = useRef<ReturnType<typeof setTimeout>>()
  const emptyStateRef = useRef<HTMLDivElement>(null)

  const { showToast, Toast } = useToast()
  const draftKey = `driply_draft_${designId}`

  // ── Restore draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const { elements: saved, view: savedView } = JSON.parse(raw) as DesignDraft
      if (Array.isArray(saved) && saved.length > 0) {
        setElements(saved)
        if (savedView) setView(savedView)
        showToast('✓ Draft restored')
      }
    } catch { /* corrupt — silently ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-save (debounced 1.2s) ────────────────────────────────────────────
  useEffect(() => {
    if (elements.length === 0) return
    setHasUnsaved(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
        localStorage.setItem(draftKey, JSON.stringify(draft))
        setHasUnsaved(false)
        setSavedAt(new Date())
        showToast('Draft saved')
      } catch { /* storage full */ }
    }, 1200)
    return () => clearTimeout(saveTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, view])

  // ── Route-leave guard ─────────────────────────────────────────────────────
  useBlocker(
    useCallback(({ proceed, reset }) => {
      if (!hasUnsaved) { proceed(); return }
      const ok = window.confirm('You have unsaved changes. Save draft before leaving?')
      if (ok) {
        const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
        localStorage.setItem(draftKey, JSON.stringify(draft))
      }
      ok ? proceed() : reset()
    }, [hasUnsaved, elements, view, draftKey]),
    hasUnsaved,
  )

  // ── Garment selected ──────────────────────────────────────────────────────
  function handleGarmentSelect(sel: GarmentSelection) {
    setActiveGarment(sel)
    setSelectorOpen(false)
    showToast(`${sel.garment.name} added to canvas`)
    requestAnimationFrame(() => {
      const card = document.querySelector('.dash-garment-card') as HTMLElement
      if (card) gsap.fromTo(card, { scale: 0.94, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' })
    })
  }

  // ── Back button ───────────────────────────────────────────────────────────
  function handleBack(e: React.MouseEvent) {
    if (orderOpen) { e.preventDefault(); return }
    if (hasUnsaved) {
      e.preventDefault()
      const ok = window.confirm('Save draft before leaving?')
      if (ok) {
        const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
        localStorage.setItem(draftKey, JSON.stringify(draft))
        window.location.href = '/'
      }
    }
  }

  // ── Panel mount animation ─────────────────────────────────────────────────
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('[data-dash="topbar"]', { y: -52, opacity: 0, duration: 0.4 })
    tl.from('[data-dash="left"]',   { x: -220, opacity: 0, duration: 0.45 }, '-=0.25')
    tl.from('[data-dash="right"]',  { x: 260,  opacity: 0, duration: 0.45 }, '<')
    tl.from('[data-dash="canvas"]', { opacity: 0, scale: 0.97, duration: 0.4 }, '-=0.3')
  }, { scope: rootRef })

  // ── Empty state entrance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeGarment && emptyStateRef.current) {
      gsap.fromTo(
        emptyStateRef.current,
        { opacity: 0, y: 18, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out', delay: 0.55 },
      )
    }
  }, [activeGarment])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const active = document.activeElement?.tagName
      const typing = active === 'INPUT' || active === 'TEXTAREA'

      if (e.key === 'Escape') setSelectedId(null)

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !typing) {
        deleteSelected()
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !typing) {
        e.preventDefault()
        undo?.()
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if (!typing && (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      )) {
        e.preventDefault()
        redo?.()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, undo, redo])

  // ── Front ↔ Back 3D flip ──────────────────────────────────────────────────
  const handleViewChange = useCallback((newView: View) => {
    if (newView === view) return
    const wrap = canvasWrapRef.current
    if (!wrap) { setView(newView); return }
    const tl = gsap.timeline()
    tl.to(wrap, {
      rotationY: 90, duration: 0.22, ease: 'power2.in',
      transformPerspective: 900, transformOrigin: 'center center',
    })
    tl.call(() => setView(newView))
    tl.fromTo(wrap, { rotationY: -90 }, { rotationY: 0, duration: 0.22, ease: 'power2.out' })
  }, [view, setView])

  // ── Order flow ────────────────────────────────────────────────────────────
  function openOrderFlow() {
    const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
    localStorage.setItem(draftKey, JSON.stringify(draft))
    setHasUnsaved(false)
    setSavedAt(new Date())

    // Export the full canvas (garment + all design elements) as a flat PNG
    // so the order preview shows the actual design, not just the plain garment.
    if (stageRef.current) {
      try {
        const url = stageRef.current.toDataURL({ pixelRatio: 1.5 })
        setDesignPreviewUrl(url)
      } catch {
        setDesignPreviewUrl(undefined)
      }
    }

    setOrderOpen(true)
  }

  // ── Snap guide helpers ────────────────────────────────────────────────────
  //
  //  Called from each element's onDragMove. Compares the element's centre
  //  against the stage centre and shows a guide line when within threshold.
  //  Pass this down to TextNode / ImageNode via the onChange callback or
  //  directly as an onDragMove prop — whichever fits your node components.
  //
  function handleElementDragMove(el: DriplyEl, nodeX: number, nodeY: number, nodeW: number, nodeH: number) {
    const elCX = nodeX + nodeW / 2
    const elCY = nodeY + nodeH / 2
    setSnapGuides({
      v: Math.abs(elCX - STAGE_CX) < SNAP_THRESHOLD,
      h: Math.abs(elCY - STAGE_CY) < SNAP_THRESHOLD,
    })
  }

  function handleElementDragEnd() {
    setSnapGuides({ h: false, v: false })
  }

  // ── Shapes ────────────────────────────────────────────────────────────────
  function addShape(shapeType: ShapeType) {
    if (!toolsEnabled) return
    const el: DriplyEl = {
      id:               uid(),
      type:             'shape',
      shapeType,
      x:                DZ.x + DZ.w / 2 - 60,
      y:                DZ.y + DZ.h / 2 - 60,
      width:            120,
      height:           120,
      shapeFill:        '#C8F135',
      shapeStroke:      'transparent',
      shapeStrokeWidth: 0,
      opacity:          1,
      locked:           false,
    }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    showToast(`${shapeType} added`)
  }

  // ── Layer reorder ─────────────────────────────────────────────────────────
  function moveUp(id: string) {
    setElements(els => {
      const i = els.findIndex(e => e.id === id)
      if (i < 0 || i >= els.length - 1) return els
      const next = [...els];
      [next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }

  function moveDown(id: string) {
    setElements(els => {
      const i = els.findIndex(e => e.id === id)
      if (i <= 0) return els
      const next = [...els];
      [next[i], next[i - 1]] = [next[i - 1], next[i]]
      return next
    })
  }

  function moveToFront(id: string) {
    setElements(els => {
      const el = els.find(e => e.id === id)
      if (!el) return els
      return [...els.filter(e => e.id !== id), el]
    })
  }

  function moveToBack(id: string) {
    setElements(els => {
      const el = els.find(e => e.id === id)
      if (!el) return els
      return [el, ...els.filter(e => e.id !== id)]
    })
  }

  // ── Element lock toggle ───────────────────────────────────────────────────
  function toggleLock(id: string) {
    const el = elements.find(e => e.id === id)
    if (!el) return
    updateElement(id, { locked: !el.locked })
    showToast(el.locked ? 'Layer unlocked' : 'Layer locked')
  }

  // Whether tools should be interactive (requires an active garment)
  const toolsEnabled = !!activeGarment

  return (
    <div ref={rootRef} className="dash-root">

      <input
        ref={fileInputRef} type="file" accept="image/*"
        className="hidden" onChange={handleImageUpload}
      />

      {Toast}

      <GarmentSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleGarmentSelect}
        current={activeGarment?.garment.id}
      />

      <OrderFlowOverlay
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        designId={designId}
        activeGarment={activeGarment}
        designPreviewUrl={designPreviewUrl}
      />

      <TopBar
        projectName="My First Collection"
        onOpenFlow={openOrderFlow}
        hasUnsaved={hasUnsaved}
        savedAt={savedAt}
        onBack={handleBack}
      />

      <div className="dash-body">

        {/*
          ── Left panel ──────────────────────────────────────────────────────
          Pass toolsEnabled so LeftPanel can grey out / show tooltips on
          actions that need a garment (addText, uploadImage, etc.).
          The onOpenSelector button should always be active so the user
          can swap the garment at any point.
        */}
        <LeftPanel
          view={view}
          setView={handleViewChange}
          elements={elements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onDeleteSelected={deleteSelected}
          onAddText={toolsEnabled ? addText : undefined}
          onAddShape={toolsEnabled ? addShape : undefined}
          fileInputRef={fileInputRef}
          onOpenSelector={() => setSelectorOpen(true)}
          activeGarment={activeGarment}
          toolsEnabled={toolsEnabled}
          onUndo={undo}
          onRedo={redo}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onMoveToFront={moveToFront}
          onMoveToBack={moveToBack}
          onToggleLock={toggleLock}
        />

        {/* ── Canvas area ─────────────────────────────────────────────────── */}
        <div data-dash="canvas" className="dash-canvas-area">
          <CanvasToolbar
            tool={tool} setTool={setTool}
            zoom={zoom} setZoom={setZoom}
            disabled={!toolsEnabled}
          />

          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">

              {/* ── Empty state ─────────────────────────────────────────── */}
              {!activeGarment && (
                <div ref={emptyStateRef} className="dash-empty-state">
                  {/* Dashed canvas outline so they can see what they're filling */}
                  <div className="dash-empty-canvas-hint" />

                  <div className="dash-empty-inner">
                    <div className="dash-empty-icon">
                      {/* Simple shirt silhouette — inline SVG, no extra dep */}
                      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 6 L8 14 L14 16 L14 44 L38 44 L38 16 L44 14 L36 6 C34 10 30 12 26 12 C22 12 18 10 16 6Z"
                          fill="rgba(200,241,53,0.12)" stroke="rgba(200,241,53,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M16 6 L8 14" stroke="rgba(200,241,53,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M36 6 L44 14" stroke="rgba(200,241,53,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="dash-empty-heading">No garment selected</p>
                    <p className="dash-empty-sub">
                      Pick a garment to start designing. You can swap it any time.
                    </p>
                    <button
                      className="dash-empty-cta"
                      onClick={() => setSelectorOpen(true)}
                    >
                      Choose garment →
                    </button>
                    <p className="dash-empty-hint">
                      Tip: use ← → arrow keys inside the selector to browse styles
                    </p>
                  </div>
                </div>
              )}

              {/* ── Active canvas ─────────────────────────────────────────── */}
              {activeGarment && (
                <div
                  ref={canvasWrapRef}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.18s ease',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                  }}
                >
                  <Stage
                    ref={stageRef}
                    width={STAGE_W} height={STAGE_H}
                    onClick={handleStageClick} onTap={handleStageClick}
                    style={{
                      borderRadius: '16px', overflow: 'hidden',
                      background: '#2A2A2C', display: 'block',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Layer>
                      {/* Dot grid */}
                      {Array.from({ length: Math.ceil(STAGE_H / 24) }).map((_, row) =>
                        Array.from({ length: Math.ceil(STAGE_W / 24) }).map((_, col) => (
                          <Rect
                            key={`${row}-${col}`}
                            x={col * 24 + 12} y={row * 24 + 12}
                            width={1.5} height={1.5}
                            fill="rgba(255,255,255,0.05)"
                            listening={false}
                          />
                        ))
                      )}

                      <GarmentNode
                        garment={activeGarment.garment}
                        view={view}
                        colorFilter={getColorFilter(activeGarment.color)}
                      />

                      {/* Design zone boundary */}
                      <Rect
                        x={DZ.x} y={DZ.y} width={DZ.w} height={DZ.h}
                        stroke="rgba(200,241,53,0.45)" strokeWidth={1.5}
                        dash={[6, 4]} fill="rgba(200,241,53,0.04)"
                        listening={false}
                      />

                      {/* ── Snap guide lines ─────────────────────────────── */}
                      {snapGuides.v && (
                        <Line
                          points={[STAGE_CX, 0, STAGE_CX, STAGE_H]}
                          stroke="#C8F135" strokeWidth={1}
                          dash={[4, 4]} opacity={0.7}
                          listening={false}
                        />
                      )}
                      {snapGuides.h && (
                        <Line
                          points={[0, STAGE_CY, STAGE_W, STAGE_CY]}
                          stroke="#C8F135" strokeWidth={1}
                          dash={[4, 4]} opacity={0.7}
                          listening={false}
                        />
                      )}

                      {/* Canvas elements */}
                      {elements.map(el => {
                        const props = {
                          el,
                          isSelected: el.id === selectedId,
                          onSelect:   () => !el.locked && setSelectedId(el.id),
                          onChange:   (a: Partial<DriplyEl>) => updateElement(el.id, a),
                          onDragMove: (x: number, y: number, w: number, h: number) =>
                            handleElementDragMove(el, x, y, w, h),
                          onDragEnd:  handleElementDragEnd,
                        }
                        return el.type === 'text'
                          ? <TextNode  key={el.id} {...props} />
                          : el.type === 'shape'
                          ? <ShapeNode key={el.id} {...props} />
                          : <ImageNode key={el.id} {...props} />
                      })}
                    </Layer>
                  </Stage>

                  {/* Print area label */}
                  <div
                    className="absolute pointer-events-none text-[0.6rem] font-semibold tracking-[0.08em] uppercase text-[#C8F135]/45"
                    style={{ left: DZ.x, top: DZ.y - 18 }}
                  >
                    Print area
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context hint bar */}
          <div className="dash-canvas-hint">
            {!activeGarment
              ? 'Select a garment above to begin designing'
              : tool === 'select'
              ? selectedId
                ? 'Drag to move · Handles to resize · Delete to remove · Ctrl+Z to undo'
                : 'Click an element to select · Ctrl+Z undo · Ctrl+Y redo'
              : tool === 'text'
              ? 'Click "Add Text" in the left panel'
              : 'Click "Upload Image" in the left panel'
            }
          </div>
        </div>

        <RightPanel
          selected={selected}
          onChange={attrs => selectedId && updateElement(selectedId, attrs)}
        />
      </div>

      {/* ── Empty state styles ──────────────────────────────────────────────── */}
      <style>{`
        .dash-empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .dash-empty-canvas-hint {
          position: absolute;
          inset: 2.5rem;
          border: 1.5px dashed rgba(255,255,255,0.06);
          border-radius: 20px;
          pointer-events: none;
        }

        .dash-empty-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.6rem;
          max-width: 320px;
          position: relative;
          z-index: 1;
        }

        .dash-empty-icon {
          width: 88px;
          height: 88px;
          border-radius: 24px;
          background: rgba(200,241,53,0.06);
          border: 1px solid rgba(200,241,53,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .dash-empty-heading {
          font-size: 1.1rem;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: -0.01em;
        }

        .dash-empty-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.55;
          margin-bottom: 0.5rem;
        }

        .dash-empty-cta {
          padding: 0.75rem 1.75rem;
          background: #C8F135;
          color: #0E0E0E;
          font-weight: 700;
          font-size: 0.88rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          letter-spacing: 0.01em;
        }

        .dash-empty-cta:hover {
          background: #d4f54d;
          transform: translateY(-1px);
        }

        .dash-empty-cta:active {
          transform: scale(0.97);
        }

        .dash-empty-hint {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}

/*
  ── useCanvasDesign: undo / redo implementation note ──────────────────────────

  The hook needs to expose `undo` and `redo`. Here's the pattern to add inside
  useCanvasDesign.ts, alongside the existing `elements` / `setElements` state:

  ```ts
  const historyRef  = useRef<DriplyEl[][]>([])
  const futureRef   = useRef<DriplyEl[][]>([])

  // Call this inside every mutation (addText, updateElement, deleteSelected,
  // handleImageUpload) BEFORE applying the change:
  function pushHistory(current: DriplyEl[]) {
    historyRef.current = [...historyRef.current.slice(-49), current]
    futureRef.current  = []   // clear redo stack on new action
  }

  function undo() {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current.pop()!
    futureRef.current = [elements, ...futureRef.current]
    setElements(prev)
  }

  function redo() {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.shift()!
    historyRef.current = [...historyRef.current, elements]
    setElements(next)
  }

  return { ..., undo, redo }
  ```

  Keep history capped at 50 snapshots (slice(-49) above) to avoid unbounded
  memory growth on large designs.

  ── onDragMove / onDragEnd in TextNode and ImageNode ─────────────────────────

  Each node component needs two optional props:

  ```ts
  interface NodeProps {
    ...existing...
    onDragMove?: (x: number, y: number, w: number, h: number) => void
    onDragEnd?:  () => void
  }
  ```

  Inside the Konva node:
  ```tsx
  onDragMove={e => {
    const node = e.target
    props.onDragMove?.(node.x(), node.y(), node.width() * node.scaleX(), node.height() * node.scaleY())
  }}
  onDragEnd={e => {
    props.onChange({ x: e.target.x(), y: e.target.y() })
    props.onDragEnd?.()
  }}
  ```
*/

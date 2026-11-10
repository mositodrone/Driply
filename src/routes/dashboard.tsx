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

import { useUser } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { useGSAP } from '@gsap/react'
import { createFileRoute, redirect, useBlocker } from '@tanstack/react-router'
import gsap from 'gsap'
import Flip from 'gsap/Flip'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage } from 'react-konva'

import { CanvasToolbar } from './-dashboard/components/CanvasToolbar'
import { ContextMenu, type ContextMenuGroups } from './-dashboard/components/ContextMenu'
// import  DesignSubmissionOverlay from './components/DesignSubmissionOverlay'
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

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
// import { getDraftById } from '@/lib/actions/design.actions'
// import { getTutorialStatus } from '@/lib/actions/user.actions'
// import { DashboardTutorial } from './components/DashboardTutorial'
import { ExportPreviewModal } from './-dashboard/components/ExportPreviewModal'
import { GarmentSelector, type GarmentSelection } from './components/GarmentSelector'
import { OrderFlowOverlay } from './components/OrderFlowOverlay'
import { GARMENT_MAP, getColorFilter } from './data/garments'

gsap.registerPlugin(useGSAP, Flip)

// ── Auth gate — called from beforeLoad, matching Clerk's own documented
//  pattern exactly. Not the same shape as the earlier crash: the raw
//  auth() call is still safely inside a createServerFn handler either
//  way — what matters is that constraint, not which lifecycle method
//  (beforeLoad vs loader) triggers the call.
const authStateFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw redirect({ to: '/sign-in/$', search: { redirect: '/dashboard' } })
  }
  return { userId }
})

// ── Draft fetch — for /my-designs' "Continue Editing" link (?design=X).
//  Takes userId from beforeLoad's resolved context (via loader's context
//  param), never re-derives or trusts it from anywhere else. getDraftById
//  itself also enforces ownership (defense in depth) — null covers both
//  "doesn't exist" and "exists but isn't yours."
//
//  Also piggybacks the tutorial-seen check here rather than a second
//  server fn — one round trip covers both.


// const fetchDraft = createServerFn({ method: 'GET' })
//   .inputValidator((input: { userId: string; designId?: string }) => input)
//   .handler(async ({ data }) => {
//     const hasSeenTutorial = await getTutorialStatus(data.userId)
//     if (!data.designId) return { draft: null, hasSeenTutorial }
//     const draft = await getDraftById(data.designId, data.userId)
//     return { draft, hasSeenTutorial }
//   })

const dashboardSearchSchema = z.object({
  design: z.string().optional(),
})

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  validateSearch: dashboardSearchSchema,
  // FIX: this call was missing entirely — authStateFn was defined above
  // but never invoked, meaning /dashboard currently has no working auth
  // gate at all (context.userId was undefined, since nothing populated
  // route context). Restoring it is what actually protects this route.
  beforeLoad: async () => await authStateFn(),
  loaderDeps: ({ search }) => ({ designId: search.design }),
  // loader: async ({ context, deps }) =>
  //   await fetchDraft({ data: { userId: context.userId, designId: deps.designId } }),
})


// ── Snap guide threshold (px on canvas) ──────────────────────────────────────
const SNAP_THRESHOLD = 8
const STAGE_CX = STAGE_W / 2
const STAGE_CY = STAGE_H / 2

function DashboardPage() {
  // Client-side — used only to populate Paystack metadata (OrderFlowOverlay)
  // and the /api/designs POST body. The actual security boundary is server
  // side: /api/designs and /api/orders/confirm both re-derive the real
  // clerkId from the session via auth() and never trust this value alone.
  const { user } = useUser()
  const clerkId = user?.id ?? ''

  const { design: requestedDesignId } = Route.useSearch()
  // const { draft: loadedDraft, hasSeenTutorial } = Route.useLoaderData()

  // ── Design ID ─────────────────────────────────────────────────────────────
  // A ?design=X param (from /my-designs' "Continue Editing" link) takes
  // priority over whatever's already in sessionStorage — that's an
  // explicit request to open a specific saved draft, not just resume
  // whatever this browser tab happened to have active. Falls through to
  // the previous sessionStorage-or-generate-new behavior when absent.
  const [designId] = useState<string>(() => {
    if (requestedDesignId) {
      sessionStorage.setItem('driply_active_design', requestedDesignId)
      return requestedDesignId
    }
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
    addShape,
    handleImageUpload,
    handleStageClick,
    undo,
    redo,
    canUndo,
    canRedo,
    moveUp,
    moveDown,
    moveToFront,
    moveToBack,
    toggleLock,
    copyElement,
    pasteElement,
    flipH,
    flipV,
    setOpacity,
    selectAll,
    deselectAll,
  } = useCanvasDesign()

  const [orderOpen,         setOrderOpen]         = useState(false)
  const [submissionOpen, setSubmissionOpen]       = useState(false)
  const [previewOpen,       setPreviewOpen]        = useState(false)
  const [selectorOpen,      setSelectorOpen]       = useState(false)
  const [activeGarment,     setActiveGarment]      = useState<GarmentSelection | null>(null)
  const [hasUnsaved,        setHasUnsaved]         = useState(false)
  const [savedAt,           setSavedAt]            = useState<Date | null>(null)
  const [designPreviewUrl,  setDesignPreviewUrl]   = useState<string | undefined>(undefined)
  const [stageBg,           setStageBg]            = useState('#2A2A2C')
  const [contextMenu,       setContextMenu]        = useState<{ x: number; y: number } | null>(null)
  const [projectName,       setProjectName]        = useState<string>(() => {
    try { return localStorage.getItem('driply_project_name') ?? 'My First Design' } catch { return 'My First Design' }
  })

  // Both TopBar buttons lock until garment active + ≥1 element on canvas
  const canAct = !!activeGarment && elements.length > 0


  // Snap guide visibility — which centre lines are currently showing
  const [snapGuides, setSnapGuides] = useState<{ h: boolean; v: boolean }>({ h: false, v: false })

  // Right-click canvas context menu — x/y are viewport (clientX/clientY)
  // coords, so this must be rendered outside the zoomed canvasWrapRef.
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)

  // Mobile (≤900px) bottom-sheet panel — which of Layers/Properties is
  // currently open, or neither. See the effect below for the actual
  // open/close animation + scroll lock.
  const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null)
  const mobileBackdropRef = useRef<HTMLDivElement>(null)

  const stageRef      = useRef<any>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const rootRef       = useRef<HTMLDivElement>(null)
  const saveTimer     = useRef<ReturnType<typeof setTimeout>>()
  const serverSyncTimer = useRef<ReturnType<typeof setTimeout>>()
  const emptyStateRef = useRef<HTMLDivElement>(null)

  const { showToast, Toast } = useToast()
  const draftKey = `driply_draft_${designId}`

  // ── Restore draft ──────────────────────────────────────────────────────────
  //  Priority: server-loaded draft (Mongo, via ?design=X) > localStorage
  //  cache > blank canvas. The server version wins over localStorage
  //  because localStorage is only a same-browser fast-path cache — if this
  //  design was last edited on a different device, or this browser's
  //  cache was cleared, localStorage could hold stale or nonexistent data.
  // useEffect(() => {
  //   if (loadedDraft) {
  //     if (Array.isArray(loadedDraft.elements) && loadedDraft.elements.length > 0) {
  //       setElements(loadedDraft.elements)
  //     }
  //     if (loadedDraft.view) setView(loadedDraft.view)

  //     // Saved garment is a flat snapshot ({id, name, color, size}) — the
  //     // canvas needs the full catalog object (images per view, emoji,
  //     // etc.), looked up the same way LeftPanel does.
  //     const fullGarment = loadedDraft.garment?.id ? GARMENT_MAP[loadedDraft.garment.id] : undefined
  //     if (fullGarment) {
  //       setActiveGarment({
  //         garment: fullGarment,
  //         color: {
  //           label:  loadedDraft.garment.color?.label  ?? '',
  //           hex:    loadedDraft.garment.color?.hex    ?? '',
  //           filter: loadedDraft.garment.color?.filter ?? '',
  //         },
  //         size: loadedDraft.garment.size ?? '',
  //       })
  //     }

  //     showToast('✓ Draft loaded')
  //     return
  //   }

  //   // Requested a specific draft but it wasn't found (or isn't ours) —
  //   // say so rather than silently landing on an unexplained blank canvas.
  //   if (requestedDesignId) {
  //     showToast('Draft not found — starting a new design')
  //     return
  //   }

  //   // No server draft requested — fall back to the same-browser local cache.
  //   try {
  //     const raw = localStorage.getItem(draftKey)
  //     if (!raw) return
  //     const { elements: saved, view: savedView } = JSON.parse(raw) as DesignDraft
  //     if (Array.isArray(saved) && saved.length > 0) {
  //       setElements(saved)
  //       if (savedView) setView(savedView)
  //       showToast('✓ Draft restored')
  //     }
  //   } catch { /* corrupt — silently ignore */ }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

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

  // ── Server sync ────────────────────────────────────────────────────────────
  //  Pushes the current draft to Mongo via saveDraft() (design.actions.ts).
  //  Kept deliberately separate from the 1.2s local save above — that one's
  //  instant/cheap (localStorage) and fine to fire on every change; this one
  //  hits the DB and would hammer it if it ran that often. Fired two ways:
  //    1. After 30s of inactivity (effect below)
  //    2. Immediately before opening the export or order-quote flows — a
  //       Design document has to actually exist before checkout, or
  //       confirmPaystackOrder's markDraftOrdered(designId) silently no-ops
  //       on a designId nothing ever saved, and the order shows up on
  //       /my-designs as an orphan with no preview image.
  const syncDraftToServer = useCallback(async () => {
    if (elements.length === 0 || !activeGarment) return
    try {
      await fetch('/api/designs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          garment: {
            id:    activeGarment.garment.id,
            name:  activeGarment.garment.name,
            color: {
              label:  activeGarment.color.label,
              hex:    activeGarment.color.hex,
              filter: activeGarment.color.filter,
            },
            size: activeGarment.size,
          },
          elements,
          view,
          previewUrl: designPreviewUrl,
        }),
      })
    } catch {
      // Non-fatal — the 30s timer will retry on the next change, and the
      // local save already protects against data loss in the meantime.
      // (If this keeps failing silently, worth adding a toast here.)
    }
  }, [designId, activeGarment, elements, view, designPreviewUrl])

  // ── Server sync (debounced 30s of inactivity) ─────────────────────────────
  useEffect(() => {
    if (elements.length === 0) return
    clearTimeout(serverSyncTimer.current)
    serverSyncTimer.current = setTimeout(() => { syncDraftToServer() }, 3000)
    return () => clearTimeout(serverSyncTimer.current)
  }, [elements, view, syncDraftToServer])


  // ── Mobile bottom-sheet open/close ────────────────────────────────────────
  //  Targets .dash-panel-left/.dash-panel-right via the existing data-dash
  //  attributes rather than refs threaded through LeftPanel/RightPanel.
  //  CSS sets the resting closed state (translateY(100%)); GSAP animates
  //  from there directly via inline style, same pattern as every other
  //  overlay built this session (GarmentSelector, OrderFlowOverlay, the
  //  mobile nav menu).
  useEffect(() => {
    const leftEl   = document.querySelector('[data-dash="left"]')  as HTMLElement | null
    const rightEl  = document.querySelector('[data-dash="right"]') as HTMLElement | null
    const backdrop = mobileBackdropRef.current
    if (!leftEl || !rightEl || !backdrop) return

    if (mobilePanel) {
      // Same iOS-safe scroll lock used everywhere else this session —
      // overflow:hidden alone is a no-op on iOS Safari.
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top      = `-${scrollY}px`
      document.body.style.width    = '100%'

      const openEl  = mobilePanel === 'left' ? leftEl : rightEl
      const closeEl = mobilePanel === 'left' ? rightEl : leftEl

      gsap.set(backdrop, { display: 'block' })
      gsap.set(closeEl, { y: '100%' }) // ensure the other panel snaps shut instantly, no visible cross-fade
      gsap.to(backdrop, { opacity: 1, duration: 0.25 })
      gsap.to(openEl,   { y: 0, duration: 0.4, ease: 'power3.out' })

      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobilePanel(null) }
      window.addEventListener('keydown', onKey)

      return () => {
        document.body.style.position = ''
        document.body.style.top      = ''
        document.body.style.width    = ''
        window.scrollTo(0, scrollY)
        window.removeEventListener('keydown', onKey)
      }
    } else {
      gsap.to(backdrop, {
        opacity: 0, duration: 0.2,
        onComplete: () => gsap.set(backdrop, { display: 'none' }),
      })
      gsap.to([leftEl, rightEl], { y: '100%', duration: 0.3, ease: 'power2.in' })
    }
  }, [mobilePanel])

  // Auto-close the Properties sheet if the user deselects while it's open —
  // an empty properties panel taking up 75% of the screen serves no purpose.
  useEffect(() => {
    if (mobilePanel === 'right' && !selected) setMobilePanel(null)
  }, [selected, mobilePanel])

  // ── Route-leave guard ─────────────────────────────────────────────────────
  useBlocker(
    useCallback(({ proceed, reset }) => {
      if (!hasUnsaved) { proceed(); return }
      const ok = window.confirm('You have unsaved changes. Save draft before leaving?')
      if (ok) {
        const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
        localStorage.setItem(draftKey, JSON.stringify(draft))
	syncDraftToServer()
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

  function handleRename(name: string) {
    setProjectName(name)
    try { localStorage.setItem('driply_project_name', name) } catch { /* quota */ }
    const draft = JSON.parse(sessionStorage.getItem('driply-draft') ?? '{}')
    sessionStorage.setItem('driply-draft', JSON.stringify({ ...draft, projectName: name }))
  }

  // Duplicate the selected element (offset by +16px so it's visibly separate)
  // Calls through setElements from useCanvasDesign — pushHistory should be added
  // to useCanvasDesign if not already there. For a quick inline version:
  const duplicateSelected = useCallback(() => {
    if (!selectedId) return
    const el = elements.find(e => e.id === selectedId)
    if (!el) return
    // Import uid from canvas-element if not already in scope
    const newId = uid()
    const copy: DriplyEl = { ...el, id: newId, x: el.x + 16, y: el.y + 16 }
    setElements(els => [...els, copy])
    setSelectedId(newId)
  }, [selectedId, elements, setElements, setSelectedId])

  // Clear all elements from the canvas
  const clearCanvas = useCallback(() => {
    if (elements.length === 0) return
    if (!window.confirm('Clear all elements from the canvas? This cannot be undone.')) return
    setElements([])
    setSelectedId(null)
  }, [elements, setElements, setSelectedId])

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

  function handleContextMenu(e: any) {
  e.evt.preventDefault()
  // Use clientX/Y for fixed positioning — works regardless of scroll or zoom
  setContextMenu({ x: e.evt.clientX, y: e.evt.clientY })
}

// Build the item groups based on what's currently selected.
// Called inline in the render — rebuilds cheaply on each render.
  function buildContextGroups(): ContextMenuGroups {
    // ── Nothing selected — empty canvas right-click ───────────────────────────
    return [
      [
        {
          label: 'Select All',   icon: '⊡', shortcut: 'Ctrl+A',
          onClick: selectAll,
          disabled: elements.length === 0,
        },
        {
          label: 'Deselect All', icon: '⊠', shortcut: 'Esc',
          onClick: deselectAll,
          disabled: !selectedId,
        },
      ],
      [
        {
          label: 'Zoom In',    icon: '+', shortcut: 'Ctrl++',
          onClick: () => setZoom(z => Math.min(1.8, parseFloat((z + 0.1).toFixed(1)))),
        },
        {
          label: 'Reset Zoom', icon: '↺', shortcut: 'Ctrl+0',
          onClick: () => setZoom(1),
        },
        {
          label: 'Zoom Out',   icon: '−', shortcut: 'Ctrl+−',
          onClick: () => setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1)))),
          disabled: zoom <= 0.5,
        },
      ],
      [
        {
          label: 'Clear Canvas', icon: '🗑',
          onClick: clearCanvas,
          danger: true,
          disabled: elements.length === 0,
        },
      ],
    ]
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

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
      }

      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId && !typing) {
        e.preventDefault()
        copyElement(selectedId)
      }

      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !typing) {
        e.preventDefault()
        pasteElement()
      }

      // Select all: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !typing) {
        e.preventDefault()
        selectAll()
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
  async function openOrderFlow() {
    const draft: DesignDraft = { elements, view, savedAt: new Date().toISOString() }
    localStorage.setItem(draftKey, JSON.stringify(draft))
    setHasUnsaved(false)
    setSavedAt(new Date())

    // Export the full canvas (garment + all design elements) as a flat PNG
    // so the order preview shows the actual design, not just the plain garment.
    let previewUrl = designPreviewUrl
    if (stageRef.current) {
      try {
        previewUrl = stageRef.current.toDataURL({ pixelRatio: 1.5 })
        setDesignPreviewUrl(previewUrl)
      } catch {
        previewUrl = undefined
      }
    }

    // Awaited (unlike the export-preview checkpoint below) — this is the
    // moment right before checkout, worth the round trip to make sure a
    // Design document actually exists before Paystack metadata references
    // this designId.
    try {
      await fetch('/api/designs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          garment: activeGarment ? {
            id:    activeGarment.garment.id,
            name:  activeGarment.garment.name,
            color: {
              label:  activeGarment.color.label,
              hex:    activeGarment.color.hex,
              filter: activeGarment.color.filter,
            },
            size: activeGarment.size,
          } : undefined,
          elements,
          view,
          previewUrl,
        }),
      })
    } catch {
      // Proceed anyway — the order can still be created, it just won't
      // have a matching Design doc until the next successful sync.
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
  // addShape itself now lives in useCanvasDesign (with proper undo history);
  // this wrapper just keeps the toolsEnabled guard and toast.
  function handleAddShape(shapeType: ShapeType) {
    if (!toolsEnabled) return
    addShape(shapeType)
    showToast(`${shapeType} added`)
  }

  // ── Element lock toggle ───────────────────────────────────────────────────
  // Same deal — toggleLock now lives in useCanvasDesign; wrap for the toast.
  function handleToggleLock(id: string) {
    const el = elements.find(e => e.id === id)
    if (!el) return
    toggleLock(id)
    showToast(el.locked ? 'Layer unlocked' : 'Layer locked')
  }

  // ── Canvas context menu ───────────────────────────────────────────────────
  function handleNodeContextMenu(el: DriplyEl, x: number, y: number) {
    setSelectedId(el.id)
    setCtxMenu({ x, y, elementId: el.id })
  }

  function buildContextMenuGroups(el: DriplyEl): ContextMenuGroups {
    return [
      // ── Copy / Paste / Duplicate ─────────────────────────────────────────
      [
        {
          label: 'Copy',      icon: '⧉', shortcut: 'Ctrl+C',
          onClick: () => copyElement(el.id),
        },
        {
          label: 'Paste',     icon: '📋', shortcut: 'Ctrl+V',
          onClick: pasteElement,
        },
        {
          label: 'Duplicate', icon: '◈', shortcut: 'Ctrl+D',
          onClick: duplicateSelected,
        },
      ],
      // ── Flip ─────────────────────────────────────────────────────────────
      [
        { label: 'Flip Horizontal', icon: '↔', onClick: () => flipH(el.id) },
        { label: 'Flip Vertical',   icon: '↕', onClick: () => flipV(el.id) },
      ],
      // ── Opacity quick-set ────────────────────────────────────────────────
      [
        { label: 'Opacity 25%',  icon: '○', onClick: () => setOpacity(el.id, 0.25) },
        { label: 'Opacity 50%',  icon: '◑', onClick: () => setOpacity(el.id, 0.5)  },
        { label: 'Opacity 75%',  icon: '◕', onClick: () => setOpacity(el.id, 0.75) },
        { label: 'Opacity 100%', icon: '●', onClick: () => setOpacity(el.id, 1)    },
      ],
      // ── Layer order ──────────────────────────────────────────────────────
      [
        { label: 'Bring to Front', icon: '⬆⬆', onClick: () => moveToFront(el.id) },
        { label: 'Move Up',        icon: '↑',   onClick: () => moveUp(el.id)      },
        { label: 'Move Down',      icon: '↓',   onClick: () => moveDown(el.id)    },
        { label: 'Send to Back',   icon: '⬇⬇', onClick: () => moveToBack(el.id)  },
      ],
      // ── Lock / Delete ────────────────────────────────────────────────────
      [
        {
          label:   el.locked ? 'Unlock layer' : 'Lock layer',
          icon:    el.locked ? '🔓' : '🔒',
          onClick: () => handleToggleLock(el.id),
        },
        {
          label: 'Delete', icon: '✕', shortcut: 'Del', danger: true,
          onClick: () => { setSelectedId(el.id); deleteSelected() },
        },
      ],
    ]
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
        clerkId={clerkId}
        activeGarment={activeGarment}
        designPreviewUrl={designPreviewUrl}
      />

      {/* <DashboardTutorial hasSeenTutorial={hasSeenTutorial} /> */}

      <ExportPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        stageRef={stageRef}
        activeGarment={activeGarment}
        elements={elements}
        projectName={projectName}
      />

      {/* <DesignSubmissionOverlay
        open={submissionOpen}
        onClose={() => setSubmissionOpen(false)}
        activeGarment={activeGarment}
        designId={designId}
        stageRef={stageRef}
      /> */}

      <TopBar
        projectName={projectName}
        onRename={handleRename}
        onOpenPreview={() => { syncDraftToServer(); setPreviewOpen(true) }}
        hasGarment={!!activeGarment}
        hasElements={elements.length > 0}
        onOpenSubmission={() => setSubmissionOpen(true)}
        onOpenFlow={openOrderFlow}
        hasUnsaved={hasUnsaved}
        savedAt={savedAt}
        onBack={handleBack}
        canAct={canAct}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          groups={buildContextGroups()}
          onClose={() => setContextMenu(null)}
        />
      )}

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
          onAddShape={toolsEnabled ? handleAddShape : undefined}
          fileInputRef={fileInputRef}
          onOpenSelector={() => setSelectorOpen(true)}
          activeGarment={activeGarment}
          toolsEnabled={toolsEnabled}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onMoveToFront={moveToFront}
          onMoveToBack={moveToBack}
          onToggleLock={handleToggleLock}
          stageBg={stageBg}
          onStageBgChange={setStageBg}
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
                    onContextMenu={handleContextMenu}
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
                          onContextMenu: (x: number, y: number) => handleNodeContextMenu(el, x, y),
                        }
                        return el.type === 'text'
                          ? <TextNode  key={el.id} {...props} zoom={zoom}/>
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

      {/*
        ── Mobile bottom-sheet controls (≤900px) ─────────────────────────────
        LeftPanel/RightPanel render .dash-panel-left/.dash-panel-right
        internally — targeted here via the existing data-dash="left"/"right"
        attributes (same stable hooks DashboardTutorial already uses) rather
        than threading refs through those components. Hidden above 900px via
        CSS (.dash-mobile-fabs only has rules inside that media query).
      */}
      <div ref={mobileBackdropRef} className="dash-mobile-backdrop" onClick={() => setMobilePanel(null)} />
      <div className="dash-mobile-fabs">
        <button
          className={`dash-mobile-fab ${mobilePanel === 'left' ? 'active' : ''}`}
          onClick={() => setMobilePanel(p => p === 'left' ? null : 'left')}
        >
          🗂 Layers
        </button>
        <button
          className={`dash-mobile-fab ${mobilePanel === 'right' ? 'active' : ''}`}
          onClick={() => setMobilePanel(p => p === 'right' ? null : 'right')}
          disabled={!selected}
          style={!selected ? { opacity: 0.4 } : undefined}
        >
          ⚙ Edit{selected ? '' : ' (select something)'}
        </button>
      </div>

      {/*
        ── Canvas context menu ──────────────────────────────────────────────
        Rendered here — a sibling of dash-body, NOT inside canvasWrapRef —
        because canvasWrapRef has `transform: scale(zoom)` on it, and a CSS
        transform on an ancestor creates a new containing block for
        `position: fixed` descendants. Nested inside there, the menu would
        track the scaled canvas instead of the actual viewport.

        Keyed by element id + position so each right-click is a fresh mount:
        this sidesteps a race where a stale close animation from switching
        elements could null out the freshly-opened menu after the fact.
      */}
      {ctxMenu && (() => {
        const el = elements.find(e => e.id === ctxMenu.elementId)
        if (!el) return null
        return (
          <ContextMenu
            key={`${ctxMenu.elementId}-${ctxMenu.x}-${ctxMenu.y}`}
            x={ctxMenu.x}
            y={ctxMenu.y}
            groups={buildContextMenuGroups(el)}
            onClose={() => setCtxMenu(null)}
          />
        )
      })()}

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

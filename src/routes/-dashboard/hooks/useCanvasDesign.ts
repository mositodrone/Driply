import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import gsap from 'gsap'
import { DZ } from '../constants/canvas'
import { uid, type DriplyEl, type ShapeType, type Tool, type View } from '../models/canvas-element'

/**
 * Owns the canvas/design state that used to live directly inside
 * DashboardPage: the element list, selection, active tool, zoom,
 * and front/back view, plus the operations that mutate them.
 *
 * Deliberately does NOT own canvasWrapRef or the GSAP flip animation
 * for view changes — that's a DOM/page concern, so the page wraps
 * the raw `setView` returned here with its own flip transition.
 *
 * v2 additions:
 *  - undo / redo with a 50-snapshot history
 *  - addShape (rect / circle / triangle)
 *  - Layer order: moveUp, moveDown, moveToFront, moveToBack
 *  - toggleLock
 */
export function useCanvasDesign(initialView: View = 'front') {
  const [view,       setView]       = useState<View>(initialView)
  const [tool,       setTool]       = useState<Tool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom,       setZoom]       = useState(1)

  // ── Elements state + always-current ref ─────────────────────────────────────
  // useState updates are async — reading `elements` inside a callback can give
  // a stale snapshot. elementsRef is kept in sync by wrapping the setter, so
  // pushHistory() always captures the real current array.
  const [elements, _setElements] = useState<DriplyEl[]>([])
  const elementsRef = useRef<DriplyEl[]>([])

  const setElements = useCallback(
    (next: DriplyEl[] | ((prev: DriplyEl[]) => DriplyEl[])) => {
      _setElements(prev => {
        const resolved = typeof next === 'function' ? next(prev) : next
        elementsRef.current = resolved
        return resolved
      })
    },
    [],
  )

  // ── Undo / redo ──────────────────────────────────────────────────────────────
  const historyRef = useRef<DriplyEl[][]>([])
  const futureRef  = useRef<DriplyEl[][]>([])

  // Expose reactive flags so LeftPanel can enable/disable buttons correctly.
  // We use a counter rather than re-reading .length on refs (refs don't trigger
  // re-renders), so buttons update immediately after every push/pop.
  const [historyCount, setHistoryCount] = useState(0)
  const [futureCount,  setFutureCount]  = useState(0)

  // Call at the top of every mutation, BEFORE applying the change.
  // Snapshots the always-current elementsRef into history, wipes redo stack,
  // and bumps the reactive counters so UI buttons re-render.
  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-49), [...elementsRef.current]]
    futureRef.current  = []
    setHistoryCount(historyRef.current.length)
    setFutureCount(0)
  }, []) // elementsRef is a stable ref — no dep needed

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current.pop()!
    // Push current snapshot onto the redo stack BEFORE overwriting
    futureRef.current   = [[...elementsRef.current], ...futureRef.current]
    // Sync the ref first so any subsequent pushHistory() call in the same tick
    // captures the restored state, not the stale pre-undo state
    elementsRef.current = prev
    _setElements(prev)
    setSelectedId(null)
    setHistoryCount(historyRef.current.length)
    setFutureCount(futureRef.current.length)
  }, []) // refs are stable; _setElements / setSelectedId come from useState

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.shift()!
    historyRef.current  = [...historyRef.current, [...elementsRef.current]]
    elementsRef.current = next
    _setElements(next)
    setSelectedId(null)
    setHistoryCount(historyRef.current.length)
    setFutureCount(futureRef.current.length)
  }, [])

  // ── Layer order ──────────────────────────────────────────────────────────────
  // Each of these pushes history first so reordering/locking is undoable
  // the same way moves, edits, and deletes already are.
  const moveUp = useCallback((id: string) => {
    pushHistory()
    setElements(els => {
      const i = els.findIndex(e => e.id === id)
      if (i < 0 || i >= els.length - 1) return els
      const next = [...els]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }, [setElements])

  const moveDown = useCallback((id: string) => {
    pushHistory()
    setElements(els => {
      const i = els.findIndex(e => e.id === id)
      if (i <= 0) return els
      const next = [...els]
      ;[next[i], next[i - 1]] = [next[i - 1], next[i]]
      return next
    })
  }, [setElements])

  const moveToFront = useCallback((id: string) => {
    pushHistory()
    setElements(els => {
      const el = els.find(e => e.id === id)
      if (!el) return els
      return [...els.filter(e => e.id !== id), el]
    })
  }, [setElements])

  const moveToBack = useCallback((id: string) => {
    pushHistory()
    setElements(els => {
      const el = els.find(e => e.id === id)
      if (!el) return els
      return [el, ...els.filter(e => e.id !== id)]
    })
  }, [setElements])

  const selected = elements.find(el => el.id === selectedId) ?? null

  // ── Shared layer-row entrance animation ─────────────────────────────────────
  function animateLayerIn(id: string) {
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-layer-id="${id}"]`) as HTMLElement
      if (row) gsap.from(row, { x: -20, opacity: 0, duration: 0.35, ease: 'back.out(1.6)' })
    })
  }

  const updateElement = useCallback((id: string, attrs: Partial<DriplyEl>) => {
    pushHistory()
    setElements(els => els.map(el => (el.id === id ? { ...el, ...attrs } : el)))
  }, [setElements])

  // Routed through updateElement so it gets history + the standard
  // "merge attrs onto the matching element" behavior for free.
  const toggleLock = useCallback((id: string) => {
    const el = elementsRef.current.find(e => e.id === id)
    if (!el) return
    updateElement(id, { locked: !el.locked })
  }, [updateElement])

  const deleteSelected = useCallback(() => {
    const id = selectedId
    if (!id) return
    pushHistory()
    setElements(els => els.filter(el => el.id !== id))
    setSelectedId(null)
  }, [selectedId, setElements])

  const addText = useCallback(() => {
    pushHistory()
    const id = uid()
    setElements(els => [...els, {
      id, type: 'text',
      text: 'YOUR DRIP',
      x: DZ.x + 10, y: DZ.y + 30,
      fontSize: 22, fontFamily: 'Syne', fontStyle: 'bold', fill: '#FFFFFF',
    }])
    setSelectedId(id)
    setTool('select')
    animateLayerIn(id)
  }, [setElements])

  const addShape = useCallback((shapeType: ShapeType) => {
    pushHistory()
    const id = uid()
    setElements(els => [...els, {
      id,
      type:      'shape',
      shapeType,
      x:         DZ.x + DZ.w / 2 - 60,
      y:         DZ.y + DZ.h / 2 - 60,
      width:     120,
      height:    120,
      shapeFill:        '#C8F135',
      shapeStroke:      'transparent',
      shapeStrokeWidth: 0,
      opacity:   1,
      rotation:  0,
      locked:    false,
      cornerRadius: shapeType === 'rect' ? 0 : undefined,
    }])
    setSelectedId(id)
    setTool('select')
    animateLayerIn(id)
  }, [setElements])

  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // TODO (per the Cloudinary refactor notes): this still inlines the
    // upload as a base64 data URL into design state. The recommended
    // production flow is upload -> Next/API route -> Cloudinary ->
    // store the returned public_id here instead of `src`. Left as-is
    // since no upload API route exists in this codebase yet.
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      const id = uid()
      setElements(els => [...els, { id, type: 'image', src, x: DZ.x, y: DZ.y, width: 110, height: 110 }])
      setSelectedId(id)
      setTool('select')
      requestAnimationFrame(() => {
        const row = document.querySelector(`[data-layer-id="${id}"]`) as HTMLElement
        if (row) gsap.from(row, { x: -20, opacity: 0, duration: 0.35, ease: 'back.out(1.6)' })
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) setSelectedId(null)
  }, [])

  return {
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
    // Reactive booleans — safe to use as disabled props; update on every push/pop
    canUndo: historyCount > 0,
    canRedo:  futureCount  > 0,
    moveUp,
    moveDown,
    moveToFront,
    moveToBack,
    toggleLock,
  }
}

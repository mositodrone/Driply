import { useCallback, useState, type ChangeEvent } from 'react'
import gsap from 'gsap'
import { DZ } from '../constants/canvas'
import { uid, type DriplyEl, type Tool, type View } from '../models/canvas-element'

/**
 * Owns the canvas/design state that used to live directly inside
 * DashboardPage: the element list, selection, active tool, zoom,
 * and front/back view, plus the operations that mutate them.
 *
 * Deliberately does NOT own canvasWrapRef or the GSAP flip animation
 * for view changes — that's a DOM/page concern, so the page wraps
 * the raw `setView` returned here with its own flip transition.
 */
export function useCanvasDesign(initialView: View = 'front') {
  const [view, setView] = useState<View>(initialView)
  const [tool, setTool] = useState<Tool>('select')
  const [elements, setElements] = useState<DriplyEl[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const selected = elements.find(el => el.id === selectedId) ?? null

  const updateElement = useCallback((id: string, attrs: Partial<DriplyEl>) => {
    setElements(els => els.map(el => (el.id === id ? { ...el, ...attrs } : el)))
  }, [])

  const deleteSelected = useCallback(() => {
    setSelectedId(current => {
      if (!current) return current
      setElements(els => els.filter(el => el.id !== current))
      return null
    })
  }, [])

  const addText = useCallback(() => {
    const id = uid()
    setElements(els => [...els, {
      id, type: 'text',
      text: 'YOUR DRIP',
      x: DZ.x + 10, y: DZ.y + 30,
      fontSize: 22, fontFamily: 'Syne', fontStyle: 'bold', fill: '#FFFFFF',
    }])
    setSelectedId(id)
    setTool('select')
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-layer-id="${id}"]`) as HTMLElement
      if (row) gsap.from(row, { x: -20, opacity: 0, duration: 0.35, ease: 'back.out(1.6)' })
    })
  }, [])

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
    handleImageUpload,
    handleStageClick,
  }
}

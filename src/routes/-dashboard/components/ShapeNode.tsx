// ─── ShapeNode.tsx ────────────────────────────────────────────────────────────
//  Renders rect / circle / triangle on the Konva canvas.
//  Behaves identically to TextNode and ImageNode — selectable,
//  draggable, resizable via Transformer, deletable with Delete key,
//  respects the `locked` flag and `opacity` field.
//
//  Place in: src/routes/-dashboard/components/ShapeNode.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import {
  Circle,
  RegularPolygon,
  Rect,
  Transformer,
} from 'react-konva'
import type { DriplyEl } from '../models/canvas-element'

interface ShapeNodeProps {
  el:         DriplyEl
  isSelected: boolean
  onSelect:   () => void
  onChange:   (attrs: Partial<DriplyEl>) => void
  onDragMove?: (x: number, y: number, w: number, h: number) => void
  onDragEnd?:  () => void
  onContextMenu?: (x: number, y: number) => void
}

export function ShapeNode({ el, isSelected, onSelect, onChange, onDragMove, onDragEnd, onContextMenu }: ShapeNodeProps) {
  const shapeRef = useRef<any>(null)
  const trRef    = useRef<any>(null)

  useEffect(() => {
    if (!isSelected || !trRef.current || !shapeRef.current) return
    trRef.current.nodes([shapeRef.current])
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected])

  const commonProps = {
    ref:       shapeRef,
    id:        el.id,
    x:         el.x,
    y:         el.y,
    fill:      el.shapeFill    ?? 'rgba(200,241,53,0.7)',
    stroke:    el.shapeStroke  ?? 'transparent',
    strokeWidth: el.shapeStrokeWidth ?? 0,
    opacity:   el.opacity      ?? 1,
    rotation:  el.rotation     ?? 0,
    draggable: !el.locked,
    onClick:   onSelect,
    onTap:     onSelect,
    onContextMenu: (e: any) => {
      e.evt.preventDefault()
      e.cancelBubble = true // don't let Stage's onContextMenu dismiss this
      onSelect()
      onContextMenu?.(e.evt.clientX, e.evt.clientY)
    },
    onDragMove: (e: any) => {
      const n = e.target
      onDragMove?.(n.x(), n.y(), n.width() * n.scaleX(), n.height() * n.scaleY())
    },
    onDragEnd: (e: any) => {
      onChange({ x: e.target.x(), y: e.target.y() })
      onDragEnd?.()
    },
    onTransformEnd: () => {
      const n = shapeRef.current
      if (!n) return
      onChange({
        x:        n.x(),
        y:        n.y(),
        width:    n.width()  * n.scaleX(),
        height:   n.height() * n.scaleY(),
        rotation: n.rotation(),
      })
      n.scaleX(1)
      n.scaleY(1)
    },
  }

  const w = el.width  ?? 120
  const h = el.height ?? 120

  return (
    <>
      {el.shapeType === 'circle' ? (
        <Circle
          {...commonProps}
          radius={Math.min(w, h) / 2}
        />
      ) : el.shapeType === 'triangle' ? (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={Math.min(w, h) / 2}
        />
      ) : (
        // Default: rect
        <Rect
          {...commonProps}
          width={w}
          height={h}
          cornerRadius={el.cornerRadius ?? 0}
        />
      )}

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          boundBoxFunc={(_, newBox) => newBox}
        />
      )}
    </>
  )
}

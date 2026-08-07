import { useEffect, useRef } from 'react'
import { Image as KonvaImage, Transformer } from 'react-konva'
import useImage from 'use-image'
import type { DriplyEl } from '../models/canvas-element'

interface ImageNodeProps {
  el: DriplyEl
  isSelected: boolean
  onSelect: () => void
  onChange: (attrs: Partial<DriplyEl>) => void
  onContextMenu?: (x: number, y: number) => void
}

export function ImageNode({ el, isSelected, onSelect, onChange, onContextMenu }: ImageNodeProps) {
  const [img] = useImage(el.src ?? '', 'anonymous')
  const nodeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (!isSelected || !trRef.current || !nodeRef.current) return
    trRef.current.nodes([nodeRef.current])
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected])

  return (
    <>
      <KonvaImage
        ref={nodeRef} id={el.id} image={img}
        x={el.x} y={el.y}
        width={el.width ?? 120} height={el.height ?? 120}
        draggable onClick={onSelect} onTap={onSelect}
        onContextMenu={e => {
          e.evt.preventDefault()
          e.cancelBubble = true // don't let Stage's onContextMenu dismiss this
          onSelect()
          onContextMenu?.(e.evt.clientX, e.evt.clientY)
        }}
        onDragEnd={e => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = nodeRef.current
          onChange({ x: n.x(), y: n.y(), width: n.width() * n.scaleX(), height: n.height() * n.scaleY() })
          n.scaleX(1); n.scaleY(1)
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled boundBoxFunc={(_, b) => b} />}
    </>
  )
}

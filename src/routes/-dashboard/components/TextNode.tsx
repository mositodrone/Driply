import { useEffect, useRef } from 'react'
import { Text, Transformer } from 'react-konva'
import type { DriplyEl } from '../models/canvas-element'

interface TextNodeProps {
  el: DriplyEl
  isSelected: boolean
  onSelect: () => void
  onChange: (attrs: Partial<DriplyEl>) => void
}

export function TextNode({ el, isSelected, onSelect, onChange }: TextNodeProps) {
  const nodeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (!isSelected || !trRef.current || !nodeRef.current) return
    trRef.current.nodes([nodeRef.current])
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected])

  return (
    <>
      <Text
        ref={nodeRef} id={el.id}
        text={el.text ?? 'YOUR TEXT'}
        x={el.x} y={el.y}
        fontSize={el.fontSize ?? 22}
        fontFamily={el.fontFamily ?? 'Syne'}
        fontStyle={el.fontStyle ?? 'bold'}
        fill={el.fill ?? '#FFFFFF'}
        draggable onClick={onSelect} onTap={onSelect}
        onDragEnd={e => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = nodeRef.current
          onChange({
            x: n.x(), y: n.y(),
            fontSize: Math.max(8, Math.round((el.fontSize ?? 22) * n.scaleX())),
          })
          n.scaleX(1); n.scaleY(1)
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef} rotateEnabled={false}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(o, n) => (n.width < 20 ? o : n)}
        />
      )}
    </>
  )
}

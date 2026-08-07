import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Text, Transformer } from 'react-konva'
import type { DriplyEl } from '../models/canvas-element'

interface TextNodeProps {
  el:         DriplyEl
  isSelected: boolean
  onSelect:   () => void
  onChange:   (attrs: Partial<DriplyEl>) => void
  /** The CSS zoom scale applied to the Konva stage wrapper div.
   *  Needed so the overlay textarea tracks the canvas pixel-perfectly.
   *  Defaults to 1 (no zoom). */
  zoom?: number
  onContextMenu?: (x: number, y: number) => void
}

export function TextNode({ el, isSelected, onSelect, onChange, zoom = 1, onContextMenu }: TextNodeProps) {
  const nodeRef = useRef<any>(null)
  const trRef   = useRef<any>(null)
  const taRef   = useRef<HTMLTextAreaElement>(null)

  const [isEditing, setIsEditing] = useState(false)

  // ── Keep transformer in sync ─────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!isSelected || isEditing || !trRef.current || !nodeRef.current) return
    trRef.current.nodes([nodeRef.current])
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected, isEditing])

  // ── Enter edit mode ──────────────────────────────────────────────────────
  function startEditing(e?: any) {
    if (el.locked) return
    e?.cancelBubble && (e.cancelBubble = true)
    e?.evt?.stopPropagation?.()
    onSelect()
    requestAnimationFrame(() => setIsEditing(true))
  }

  // ── Position the overlay textarea and wire its events ───────────────────
  useLayoutEffect(() => {
    if (!isEditing) return
    const node  = nodeRef.current
    const stage = node?.getStage()
    const ta    = taRef.current
    if (!node || !stage || !ta) return

    //
    // The stage container gives us the bounding rect of the Konva canvas
    // element in viewport space. The CSS zoom transform is already factored
    // in by getBoundingClientRect, so `cssScale = box.width / stage.width()`
    // already equals the product of the parent CSS zoom × device pixel ratio.
    // We use this single scale for every measurement so the textarea always
    // sits on top of the Konva text, regardless of zoom level.
    //
    const box      = stage.container().getBoundingClientRect()
    const cssScale = box.width / stage.width()   // accounts for CSS zoom + dpr

    // Absolute position of the text node in stage-space, then project to
    // viewport-space using cssScale + the container's viewport offset.
    const pos = node.getAbsolutePosition()
    const absX = box.left + pos.x * cssScale
    const absY = box.top  + pos.y * cssScale

    // Font metrics scaled to viewport pixels
    const scaledFontSize    = (el.fontSize     ?? 22)  * cssScale
    const scaledLetterSpace = (el.letterSpacing ?? 0)  * cssScale

    const style = el.fontStyle ?? 'bold'

    function autoGrow(t: HTMLTextAreaElement) {
      t.style.width  = 'auto'
      t.style.height = 'auto'
      t.style.width  = `${Math.max(t.scrollWidth + 4, 40)}px`
      t.style.height = `${t.scrollHeight}px`
    }

    Object.assign(ta.style, {
      position:        'fixed',
      top:             `${absY}px`,
      left:            `${absX}px`,
      fontSize:        `${scaledFontSize}px`,
      lineHeight:      String(el.lineHeight ?? 1.2),
      fontFamily:      el.fontFamily ?? 'Syne',
      fontWeight:      style.includes('bold')   ? '700' : '400',
      fontStyle:       style.includes('italic') ? 'italic' : 'normal',
      letterSpacing:   `${scaledLetterSpace}px`,
      color:           el.fill ?? '#FFFFFF',
      opacity:         String(el.opacity ?? 1),
      // Apply the node's own rotation (in CSS degrees) around the top-left
      // origin so the textarea rotates to match the Konva text.
      transform:       `rotate(${el.rotation ?? 0}deg)`,
      transformOrigin: 'top left',
      zIndex:          '9999',
      // Ensure textarea font rendering matches Konva as closely as possible
      padding:         '0',
      margin:          '0',
    })

    autoGrow(ta)
    ta.focus()
    ta.select()

    function commit() {
      const value = ta.value.trim()
      if (value.length > 0) onChange({ text: ta.value })
      setIsEditing(false)
    }

    function onInput() { autoGrow(ta) }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsEditing(false)
      }
      // Ctrl/Cmd + Enter to commit (plain Enter adds a newline, which is useful)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        commit()
      }
    }

    ta.addEventListener('input',   onInput)
    ta.addEventListener('keydown', onKeyDown)
    ta.addEventListener('blur',    commit)
    return () => {
      ta.removeEventListener('input',   onInput)
      ta.removeEventListener('keydown', onKeyDown)
      ta.removeEventListener('blur',    commit)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  // ── Re-position textarea when zoom or element position changes mid-edit ──
  // (user scrolls / zooms while the textarea is open)
  useLayoutEffect(() => {
    if (!isEditing || !taRef.current || !nodeRef.current) return
    const node  = nodeRef.current
    const stage = node?.getStage()
    if (!stage) return

    const box      = stage.container().getBoundingClientRect()
    const cssScale = box.width / stage.width()
    const pos      = node.getAbsolutePosition()

    taRef.current.style.top  = `${box.top  + pos.y * cssScale}px`
    taRef.current.style.left = `${box.left + pos.x * cssScale}px`
  }, [zoom, el.x, el.y, isEditing])

  return (
    <>
      <Text
        ref={nodeRef}
        id={el.id}
        text={el.text ?? 'YOUR TEXT'}
        x={el.x}
        y={el.y}
        fontSize={el.fontSize ?? 22}
        fontFamily={el.fontFamily ?? 'Syne'}
        fontStyle={el.fontStyle ?? 'bold'}
        letterSpacing={el.letterSpacing ?? 0}
        lineHeight={el.lineHeight ?? 1.2}
        fill={el.fill ?? '#FFFFFF'}
        stroke={el.strokeColor || undefined}
        strokeWidth={el.strokeColor ? (el.strokeWidth ?? 0) : 0}
        opacity={el.opacity ?? 1}
        rotation={el.rotation ?? 0}
        // Hide the Konva text while the textarea overlay is active so there's
        // no double-rendering — the textarea IS the editing surface.
        visible={!isEditing}
        draggable={!el.locked && !isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={e => {
          e.evt.preventDefault()
          e.cancelBubble = true // don't let Stage's onContextMenu dismiss this
          onSelect()
          onContextMenu?.(e.evt.clientX, e.evt.clientY)
        }}
        onDblClick={e => startEditing(e)}
        onDblTap={e  => startEditing(e)}
        onDragEnd={e => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = nodeRef.current
          if (!n) return
          // Scale the stored fontSize by the transform scale, then
          // reset BOTH scaleX and scaleY so the node's matrix is clean.
          // Not resetting scaleY was causing cumulative drift on repeated
          // resize operations.
          const newFontSize = Math.max(8, Math.round((el.fontSize ?? 22) * n.scaleX()))
          onChange({ x: n.x(), y: n.y(), fontSize: newFontSize })
          n.scaleX(1)
          n.scaleY(1)
        }}
      />

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(o, n) => (n.width < 20 ? o : n)}
        />
      )}

      {isEditing && createPortal(
        <textarea
          ref={taRef}
          defaultValue={el.text ?? ''}
          placeholder="Your text…"
          spellCheck={false}
          // Stop mousedown bubbling to the stage so clicking inside the
          // textarea doesn't fire the stage's onClick → deselect handler
          onMouseDown={e => e.stopPropagation()}
          style={{
            position:    'fixed',
            margin:      0,
            padding:     0,
            border:      'none',
            outline:     '1.5px dashed rgba(200,241,53,0.7)',
            outlineOffset: '5px',
            background:  'transparent',
            resize:      'none',
            overflow:    'hidden',
            whiteSpace:  'pre',
            minWidth:    '40px',
            // Caret colour that's visible on dark and light backgrounds
            caretColor:  '#C8F135',
          }}
        />,
        document.body,
      )}
    </>
  )
}

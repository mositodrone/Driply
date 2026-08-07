// src/routes/-dashboard/components/ContextMenu.tsx
//
// Right-click context menu for the Konva canvas.
// Renders at pointer position (fixed), smart-flips if near viewport edges,
// GSAP entrance animation, closes on outside click / Escape / scroll.
//
// The parent (dashboard.tsx) assembles the item groups based on whether
// an element is currently selected, then passes them here. This component
// owns zero business logic — it just renders and calls back.

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ContextMenuAction {
  label:     string
  icon?:     string
  shortcut?: string
  onClick:   () => void
  disabled?: boolean
  danger?:   boolean
}

// Groups are separated by a divider line
export type ContextMenuGroups = ContextMenuAction[][]

interface ContextMenuProps {
  x:       number   // clientX from the right-click event
  y:       number   // clientY from the right-click event
  groups:  ContextMenuGroups
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
export function ContextMenu({ x, y, groups, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Smart position — flip if near viewport edges ───────────────────────────
  const MENU_W = 220
  const MENU_H = groups.flat().length * 34 + (groups.length - 1) * 9  // rough estimate
  const left   = x + MENU_W > window.innerWidth  ? x - MENU_W : x
  const top    = y + MENU_H > window.innerHeight ? y - MENU_H : y

  // ── Entrance animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!menuRef.current) return
    gsap.fromTo(menuRef.current,
      { opacity: 0, scale: 0.92, y: -6 },
      { opacity: 1, scale: 1,    y: 0, duration: 0.2, ease: 'back.out(2)' }
    )
  }, [])

  // ── Close on outside click, Escape, or scroll ─────────────────────────────
  useEffect(() => {
    // Right-button mousedowns are how a NEW context menu gets opened (on a
    // different node, or the canvas background). If we let this listener's
    // close() animation run for those, its delayed onComplete can null out
    // the state a moment after the new menu has already opened. Left-button
    // (or any other) outside clicks still close normally.
    const onDown   = (e: MouseEvent)    => { if (e.button === 2) return; if (!menuRef.current?.contains(e.target as Node)) close() }
    const onKey    = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onScroll = () => close()

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    window.addEventListener('scroll',      onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown',   onKey)
      window.removeEventListener('scroll',      onScroll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() {
    if (!menuRef.current) { onClose(); return }
    gsap.to(menuRef.current, {
      opacity: 0, scale: 0.94, y: -4,
      duration: 0.15, ease: 'power2.in',
      onComplete: onClose,
    })
  }

  function handleAction(action: ContextMenuAction) {
    if (action.disabled) return
    close()
    // Slight delay so the close animation plays before the action runs
    setTimeout(action.onClick, 120)
  }

  return (
    <div
      ref={menuRef}
      style={{
        position:        'fixed',
        left,
        top,
        zIndex:          9999,
        width:           MENU_W,
        background:      'rgba(20,20,22,0.96)',
        border:          '1px solid rgba(255,255,255,0.08)',
        borderRadius:    12,
        boxShadow:       '0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        backdropFilter:  'blur(16px)',
        padding:         '5px',
        transformOrigin: 'top left',
      }}
    >
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div style={{
              height: 1,
              background: 'rgba(255,255,255,0.07)',
              margin: '4px 0',
            }} />
          )}
          {group.map((action, ai) => (
            <button
              key={ai}
              disabled={action.disabled}
              onClick={() => handleAction(action)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            8,
                width:          '100%',
                padding:        '6px 10px',
                borderRadius:   8,
                background:     'transparent',
                border:         'none',
                cursor:         action.disabled ? 'not-allowed' : 'pointer',
                color:          action.disabled
                                  ? 'rgba(255,255,255,0.2)'
                                  : action.danger
                                  ? '#FF5B3A'
                                  : 'rgba(255,255,255,0.82)',
                fontSize:       '0.78rem',
                fontFamily:     'inherit',
                letterSpacing:  '0.01em',
                textAlign:      'left',
                transition:     'background 0.12s',
                userSelect:     'none',
              }}
              onMouseEnter={e => {
                if (!action.disabled)
                  (e.currentTarget as HTMLElement).style.background =
                    action.danger ? 'rgba(255,91,58,0.12)' : 'rgba(200,241,53,0.08)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {action.icon && (
                <span style={{ fontSize: '0.85rem', width: 18, textAlign: 'center', flexShrink: 0 }}>
                  {action.icon}
                </span>
              )}
              <span style={{ flex: 1 }}>{action.label}</span>
              {action.shortcut && (
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                  {action.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

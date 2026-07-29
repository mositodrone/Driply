// ============================================================
//  app/components/GarmentSelector.tsx
//
//  Changes from previous version:
//  - View toggle extended: front / back / leftArm / rightArm
//    (GarmentNode and the garments data catalog should supply
//    images for each view; missing views are hidden automatically)
//  - View type widened to GarmentView union (exported so
//    dashboard and GarmentNode import the same type)
// ============================================================

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GARMENTS, type Garment, type GarmentColor,
  getDefaultColor, getDefaultSize,
} from '../data/garments'

// ─── Types ────────────────────────────────────────────────────────────────────

// Exported so dashboard.tsx, GarmentNode, and the garments catalog
// all reference the same union — no string drift.
export type GarmentView = 'front' | 'back' | 'leftArm' | 'rightArm'

export interface GarmentSelection {
  garment:    Garment
  color:      GarmentColor
  size:       string
  attributes: Record<string, string>
  zoneId:     string
}

interface Props {
  open:     boolean
  onClose:  () => void
  onSelect: (sel: GarmentSelection) => void
  current?: string
}

// View tab config — label shown to user + the key on the garment image map
const VIEW_TABS: { id: GarmentView; label: string }[] = [
  { id: 'front',    label: 'Front'     },
  { id: 'back',     label: 'Back'      },
  { id: 'leftArm',  label: 'Left arm'  },
  { id: 'rightArm', label: 'Right arm' },
]

// ─── Image with loading skeleton ──────────────────────────────────────────────
function GarmentImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setLoaded(false)
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <div className="gs-img-wrap">
      {!loaded && (
        <div className="gs-img-skeleton">
          <div className="gs-skeleton-shimmer" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`gs-img ${loaded ? 'gs-img-visible' : 'gs-img-hidden'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GarmentSelector({ open, onClose, onSelect, current }: Props) {
  const overlayRef  = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)

  const [idx,        setIdx]        = useState(() => Math.max(0, GARMENTS.findIndex(g => g.id === current)))
  const [view,       setView]       = useState<GarmentView>('front')
  const [color,      setColor]      = useState<GarmentColor>(() => getDefaultColor(GARMENTS[0]))
  const [size,       setSize]       = useState<string>(() => getDefaultSize(GARMENTS[0]))
  const [attrs,      setAttrs]      = useState<Record<string, string>>({})
  const [zoneId,     setZoneId]     = useState<string>(() => GARMENTS[0].defaultZone)
  const [navigating, setNavigating] = useState(false)

  const garment = GARMENTS[idx]

  // Helper: resolve the image src for the current view.
  // Falls back to frontImage if a particular view isn't supplied — so a garment
  // catalog entry only needs to define the views it actually has.
  function resolveViewSrc(g: Garment, v: GarmentView): string {
    // Assumes garment images are stored as:
    //   g.images.front / g.images.back / g.images.leftArm / g.images.rightArm
    // If your catalog still uses g.frontImage / g.backImage, swap the lines below.
    const map: Record<GarmentView, string | undefined> = {
      front:    g.images?.front    ?? g.frontImage,
      back:     g.images?.back     ?? g.backImage,
      leftArm:  g.images?.leftArm  ?? g.frontImage,
      rightArm: g.images?.rightArm ?? g.frontImage,
    }
    return map[v] ?? g.frontImage
  }

  // Which view tabs to show — only ones that have a distinct image
  function availableViews(g: Garment): GarmentView[] {
    return VIEW_TABS
      .filter(t => {
        if (t.id === 'front' || t.id === 'back') return true
        const src = g.images?.[t.id]
        return !!src
      })
      .map(t => t.id)
  }

  // Reset when garment changes
  useEffect(() => {
    setColor(getDefaultColor(garment))
    setSize(getDefaultSize(garment))
    setAttrs(Object.fromEntries(garment.attributes.map(a => [a.key, a.options[0]])))
    setZoneId(garment.defaultZone)
    setView('front')
  }, [idx])

  // ── Open/close animation ──────────────────────────────────────────────────
  //
  //  The bug: when open flips true the component goes from null → rendered.
  //  useEffect([open]) fires before the refs are guaranteed non-null on the
  //  very first open, so the animation bails at the null-check and the overlay
  //  stays at opacity:0 forever.
  //
  //  Fix: track a `mounted` boolean that flips true only after the DOM has
  //  painted (via requestAnimationFrame). The open animation only runs once
  //  both `open` is true AND `mounted` is true.
  //
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) { setMounted(false); return }
    // rAF guarantees refs are attached before we try to animate
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return

    if (open && mounted) {
      document.body.style.overflow = 'hidden'
      gsap.set(panel,   { y: 60, opacity: 0, scale: 0.97 })
      gsap.set(overlay, { opacity: 0 })
      const tl = gsap.timeline()
      tl.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      tl.to(panel,   { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.15')
      tl.from('.gs-panel-item', { y: 16, opacity: 0, stagger: 0.05, duration: 0.35, ease: 'power3.out' }, '-=0.2')
    } else if (!open && overlay.style.opacity !== '0') {
      const tl = gsap.timeline({ onComplete: () => { document.body.style.overflow = '' } })
      tl.to(panel,   { y: 30, opacity: 0, scale: 0.97, duration: 0.25, ease: 'power2.in' })
      tl.to(overlay, { opacity: 0, duration: 0.2 }, '-=0.1')
    }
  }, [open, mounted])

  // ── Navigate garments ─────────────────────────────────────────────────────
  const navigate = useCallback((dir: 1 | -1) => {
    if (navigating) return
    setNavigating(true)
    const content = contentRef.current
    if (!content) { setIdx(i => (i + dir + GARMENTS.length) % GARMENTS.length); setNavigating(false); return }

    gsap.to(content, {
      x: dir * -40, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        setIdx(i => (i + dir + GARMENTS.length) % GARMENTS.length)
        gsap.fromTo(content,
          { x: dir * 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.28, ease: 'power3.out',
            onComplete: () => setNavigating(false) }
        )
      },
    })
  }, [navigating])

  // ── View toggle with flip animation ──────────────────────────────────────
  function toggleView(newView: GarmentView) {
    if (newView === view) return
    const imgWrap = document.querySelector('.gs-img-wrap') as HTMLElement
    if (imgWrap) {
      gsap.to(imgWrap, {
        rotationY: 90, duration: 0.2, ease: 'power2.in',
        transformPerspective: 900,
        onComplete: () => {
          setView(newView)
          gsap.fromTo(imgWrap, { rotationY: -90 }, { rotationY: 0, duration: 0.22, ease: 'power2.out' })
        },
      })
    } else {
      setView(newView)
    }
  }

  // ── Color change ──────────────────────────────────────────────────────────
  function handleColorChange(c: GarmentColor) {
    setColor(c)
    gsap.fromTo('.gs-color-label',
      { opacity: 0, y: -4 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
    )
  }

  // ── Select ────────────────────────────────────────────────────────────────
  function handleSelect() {
    gsap.timeline()
      .to('.gs-select-btn', { scale: 0.95, duration: 0.08 })
      .to('.gs-select-btn', { scale: 1.03, duration: 0.2, ease: 'back.out(2)' })
      .to('.gs-select-btn', { scale: 1, duration: 0.15 })

    setTimeout(() => {
      onSelect({ garment, color, size, attributes: attrs, zoneId })
      onClose()
    }, 280)
  }

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'Escape')     onClose()
      if (e.key === 'Enter')      handleSelect()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, navigate, onClose])

  if (!open && !overlayRef.current) return null

  const activeViews = availableViews(garment)
  const currentSrc  = resolveViewSrc(garment, view)

  return (
    <>
      <style>{`
        .gs-overlay {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(14,14,14,0.65); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; overflow-y: auto;
        }
        .gs-panel {
          background: #F8F5EF; border-radius: 28px;
          width: min(900px, 100%); max-height: 92vh;
          display: grid; grid-template-columns: 1fr 1fr;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35);
          margin: auto;
        }

        /* Left — image */
        .gs-left {
          background: #F0EDE8; position: relative;
          display: flex; flex-direction: column;
          min-height: 0;
        }
        .gs-img-area {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem; position: relative;
          min-height: 0; overflow: hidden;
        }

        /* View toggle — now scrollable for 4 tabs */
        .gs-view-toggle {
          display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none;
          position: absolute; top: 1rem; left: 50%; transform: translateX(-50%);
          z-index: 5; background: rgba(248,245,239,0.85);
          backdrop-filter: blur(8px); padding: 4px;
          border-radius: 100px; border: 1px solid rgba(14,14,14,0.08);
          white-space: nowrap; max-width: calc(100% - 2rem);
        }
        .gs-view-toggle::-webkit-scrollbar { display: none; }
        .gs-view-btn {
          font-size: 0.72rem; font-weight: 600; padding: 0.35rem 0.85rem;
          border-radius: 100px; border: none; cursor: pointer; transition: all 0.2s;
          background: none; color: #888; white-space: nowrap; flex-shrink: 0;
        }
        .gs-view-btn.active { background: #0E0E0E; color: white; }

        .gs-img-wrap { width: 100%; max-width: 260px; transform-style: preserve-3d; }
        .gs-img { width: 100%; height: auto; object-fit: contain; border-radius: 12px; }
        .gs-img-visible { opacity: 1; transition: opacity 0.25s; }
        .gs-img-hidden  { opacity: 0; }
        .gs-img-skeleton {
          width: 100%; aspect-ratio: 3/4; border-radius: 12px;
          background: #E8E5E0; position: relative; overflow: hidden;
        }
        .gs-skeleton-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        /* Nav arrows */
        .gs-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 10; display: flex; align-items: center; justify-content: space-between;
          left: 0.75rem; right: 0.75rem; pointer-events: none;
        }
        .gs-nav-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: white; border: 1px solid rgba(14,14,14,0.1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; pointer-events: all;
          font-size: 1.1rem; color: #0E0E0E;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: background 0.15s, transform 0.15s;
        }
        .gs-nav-btn:hover  { background: #0E0E0E; color: white; }
        .gs-nav-btn:active { transform: scale(0.92); }

        /* Dot indicators */
        .gs-dots { display: flex; gap: 6px; justify-content: center; padding: 1rem; }
        .gs-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(14,14,14,0.15); cursor: pointer; transition: all 0.2s;
        }
        .gs-dot.active { background: #0E0E0E; transform: scale(1.3); }

        /* Right — config */
        .gs-right {
          padding: 1.75rem; overflow-y: auto;
          display: flex; flex-direction: column; gap: 1rem;
          max-height: 92vh;
        }
        .gs-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .gs-category { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #888; }
        .gs-name {
          font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800;
          letter-spacing: -0.03em; color: #0E0E0E; margin-top: 0.2rem;
        }
        .gs-close-btn {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(14,14,14,0.06); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #888; font-size: 0.9rem; flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .gs-close-btn:hover { background: #0E0E0E; color: white; }

        .gs-section-label {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #888; margin-bottom: 0.6rem;
          display: flex; justify-content: space-between; align-items: center;
        }
        .gs-color-label { font-weight: 600; color: #0E0E0E; text-transform: none; letter-spacing: 0; font-size: 0.78rem; }

        /* Color swatches */
        .gs-colors { display: flex; gap: 8px; flex-wrap: wrap; }
        .gs-swatch {
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
          border-width: 2px; border-style: solid; transition: all 0.15s;
        }
        .gs-swatch:hover { transform: scale(1.18); }

        /* Sizes */
        .gs-sizes { display: flex; gap: 6px; flex-wrap: wrap; }
        .gs-size-btn {
          padding: 0.45rem 0.9rem; border-radius: 10px; font-size: 0.82rem; font-weight: 500;
          cursor: pointer; border: 1.5px solid rgba(14,14,14,0.1); background: white;
          color: #3A3A3A; transition: all 0.15s;
        }
        .gs-size-btn:hover  { border-color: rgba(14,14,14,0.3); }
        .gs-size-btn.active { background: #0E0E0E; color: white; border-color: #0E0E0E; }

        /* Attributes */
        .gs-attr-options { display: flex; gap: 6px; flex-wrap: wrap; }
        .gs-attr-btn {
          padding: 0.38rem 0.8rem; border-radius: 8px; font-size: 0.78rem; font-weight: 400;
          cursor: pointer; border: 1.5px solid rgba(14,14,14,0.08); background: #F8F5EF;
          color: #3A3A3A; transition: all 0.15s;
        }
        .gs-attr-btn:hover  { border-color: rgba(14,14,14,0.25); }
        .gs-attr-btn.active { background: #0E0E0E; color: white; border-color: #0E0E0E; }

        /* Design zone selector */
        .gs-zones { display: flex; flex-direction: column; gap: 4px; }
        .gs-zone-btn {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.75rem; border-radius: 10px;
          cursor: pointer; border: 1.5px solid transparent;
          background: white; color: #3A3A3A; font-size: 0.8rem;
          text-align: left; transition: all 0.15s;
        }
        .gs-zone-btn:hover  { border-color: rgba(14,14,14,0.15); }
        .gs-zone-btn.active { background: #0E0E0E; color: white; border-color: #0E0E0E; }
        .gs-zone-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Footer */
        .gs-footer {
          border-top: 1px solid rgba(14,14,14,0.06); padding-top: 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto;
        }
        .gs-counter { text-align: center; font-size: 0.72rem; color: #888; }
        .gs-select-btn {
          width: 100%; padding: 1rem;
          background: #0E0E0E; color: white;
          font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
          border: none; border-radius: 16px; cursor: pointer;
          transition: background 0.15s; will-change: transform;
        }
        .gs-select-btn:hover { background: #222; }

        @media (max-width: 640px) {
          .gs-overlay { padding: 0; align-items: flex-end; }
          .gs-panel {
            grid-template-columns: 1fr; grid-template-rows: auto 1fr;
            border-radius: 24px 24px 0 0; max-height: 95vh; width: 100%;
          }
          .gs-left  { min-height: 260px; max-height: 280px; }
          .gs-right { max-height: calc(95vh - 280px); }
        }
      `}</style>

      <div ref={overlayRef} className="gs-overlay" style={{ opacity: 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={e => e.target === overlayRef.current && onClose()}>

        <div ref={panelRef} className="gs-panel">

          {/* ── LEFT: image ── */}
          <div className="gs-left">

            {/* View toggle — only shows tabs with available images */}
            <div className="gs-view-toggle">
              {VIEW_TABS.filter(t => activeViews.includes(t.id)).map(t => (
                <button
                  key={t.id}
                  className={`gs-view-btn ${view === t.id ? 'active' : ''}`}
                  onClick={() => toggleView(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Nav arrows */}
            <div className="gs-nav">
              <button className="gs-nav-btn" onClick={() => navigate(-1)}>‹</button>
              <button className="gs-nav-btn" onClick={() => navigate(1)}>›</button>
            </div>

            {/* Image */}
            <div className="gs-img-area">
              <div ref={contentRef}>
                <GarmentImage src={currentSrc} alt={`${garment.name} — ${view}`} />
              </div>
            </div>

            {/* Dot nav */}
            <div className="gs-dots">
              {GARMENTS.map((_, i) => (
                <div key={i}
                  className={`gs-dot ${i === idx ? 'active' : ''}`}
                  onClick={() => { if (i !== idx) navigate(i > idx ? 1 : -1) }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT: config ── */}
          <div className="gs-right">

            <div className="gs-header gs-panel-item">
              <div>
                <div className="gs-category">{garment.category}</div>
                <div className="gs-name">{garment.name}</div>
              </div>
              <button className="gs-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Color */}
            <div className="gs-panel-item">
              <div className="gs-section-label">
                Color <span className="gs-color-label">{color.label}</span>
              </div>
              <div className="gs-colors">
                {garment.colors.map((c, i) => (
                  <button key={i}
                    className="gs-swatch"
                    title={c.label}
                    style={{
                      background:  c.hex,
                      borderColor: c.hex === color.hex ? '#0E0E0E' : 'transparent',
                      boxShadow:   c.hex === color.hex
                        ? '0 0 0 2px #F8F5EF, 0 0 0 3.5px #0E0E0E' : 'none',
                      transform:   c.hex === color.hex ? 'scale(1.2)' : 'scale(1)',
                      outline:     c.hex === '#FFFFFF' ? '1px solid rgba(14,14,14,0.12)' : 'none',
                    }}
                    onClick={() => handleColorChange(c)}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="gs-panel-item">
              <div className="gs-section-label">Size</div>
              <div className="gs-sizes">
                {garment.sizes.map(s => (
                  <button key={s}
                    className={`gs-size-btn ${size === s ? 'active' : ''}`}
                    data-size={s}
                    onClick={() => {
                      setSize(s)
                      gsap.fromTo(`[data-size="${s}"]`, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' })
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Attributes */}
            {garment.attributes.map(attr => (
              <div key={attr.key} className="gs-attr-group gs-panel-item">
                <div className="gs-section-label">{attr.label}</div>
                <div className="gs-attr-options">
                  {attr.options.map(opt => (
                    <button key={opt}
                      className={`gs-attr-btn ${attrs[attr.key] === opt ? 'active' : ''}`}
                      onClick={() => setAttrs(a => ({ ...a, [attr.key]: opt }))}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Design zone */}
            <div className="gs-panel-item">
              <div className="gs-section-label">Print / Embroidery Zone</div>
              <div className="gs-zones">
                {garment.designZones.map(z => (
                  <button key={z.id}
                    className={`gs-zone-btn ${zoneId === z.id ? 'active' : ''}`}
                    onClick={() => setZoneId(z.id)}>
                    <div className="gs-zone-dot"
                      style={{ background: zoneId === z.id ? '#C8F135' : '#ddd' }} />
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="gs-footer gs-panel-item">
              <div className="gs-counter">
                {idx + 1} / {GARMENTS.length} — use ← → arrow keys to navigate
              </div>
              <button className="gs-select-btn" onClick={handleSelect}>
                Add {garment.name} to Canvas →
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

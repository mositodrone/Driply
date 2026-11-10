// src/components/PageLoader.tsx
//
// Two exports:
//
// 1. <RouteLoader /> — fullscreen pending component used as
//    defaultPendingComponent on the root route. Shows for slow
//    loaders (data fetching, auth checks). Creative animated mark.
//
// 2. <NavProgress /> — slim top progress bar that fires on every
//    route transition regardless of speed. Mount once in __root.tsx.
//    Driven by useRouterState({ select: s => s.isLoading }).

import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

// ── Colours ───────────────────────────────────────────────────────────────────
const LIME   = '#C8F135'
const WARM   = '#F8F5EF'
const CORAL  = '#FF5B3A'
const DARK   = '#0E0E0E'

// ─────────────────────────────────────────────────────────────────────────────
// 1. FULLSCREEN ROUTE LOADER
//    Used as defaultPendingComponent — shows when a loader takes > pendingMs.
//    The drip mark animates: fills from bottom, inner counter-drip pulses.
// ─────────────────────────────────────────────────────────────────────────────
export function RouteLoader() {
  const rootRef   = useRef<HTMLDivElement>(null)
  const fillRef   = useRef<SVGPathElement>(null)
  const innerRef  = useRef<SVGPathElement>(null)
  const dotRef    = useRef<SVGCircleElement>(null)
  const textRef   = useRef<HTMLParagraphElement>(null)

  useGSAPLoader(rootRef, fillRef, innerRef, dotRef, textRef)

  return (
    <div
      ref={rootRef}
      style={{
        position:       'fixed',
        inset:           0,
        zIndex:          9999,
        background:      DARK,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:             24,
        opacity:         0,
      }}
    >
      {/* Animated drip mark */}
      <svg
        width="72" height="96"
        viewBox="0 0 72 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Clip mask — reveals fill from bottom up */}
        <defs>
          <clipPath id="drip-clip">
            <path d="M36 4 C36 4 4 44 4 64 C4 81 18 92 36 92 C54 92 68 81 68 64 C68 44 36 4 36 4 Z"/>
          </clipPath>
          {/* Stroke-only outline */}
        </defs>

        {/* Outline */}
        <path
          d="M36 4 C36 4 4 44 4 64 C4 81 18 92 36 92 C54 92 68 81 68 64 C68 44 36 4 36 4 Z"
          stroke={`${LIME}30`}
          strokeWidth="2"
          fill="none"
        />

        {/* Lime fill — animated via scaleY from bottom */}
        <g clipPath="url(#drip-clip)">
          <rect
            ref={fillRef as any}
            x="0" y="0" width="72" height="96"
            fill={LIME}
            style={{ transformOrigin: 'center bottom', transform: 'scaleY(0)' }}
          />
        </g>

        {/* Inner counter-drip */}
        <path
          ref={innerRef}
          d="M36 38 C36 38 24 54 24 64 C24 71 29 76 36 76 C43 76 48 71 48 64 C48 54 36 38 36 38 Z"
          fill={DARK}
          opacity="0.7"
        />

        {/* Highlight dot */}
        <circle
          ref={dotRef}
          cx="30" cy="50" r="4"
          fill="rgba(255,255,255,0.3)"
        />
      </svg>

      {/* Wordmark */}
      <div style={{
        fontFamily:    'Syne, sans-serif',
        fontWeight:     800,
        fontSize:      '1.25rem',
        letterSpacing: '-0.03em',
        color:          WARM,
        opacity:        0,
      }} className="loader-wordmark">
        Drip<span style={{ color: CORAL }}>ly</span>
      </div>

      {/* Loading text */}
      <p
        ref={textRef}
        style={{
          fontFamily:    'Syne, sans-serif',
          fontSize:      '0.72rem',
          fontWeight:     600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         `${WARM}40`,
          opacity:        0,
        }}
      >
        Loading
      </p>

      {/* Dot trail */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`loader-dot-${i}`}
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   LIME,
              opacity:       0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function useGSAPLoader(
  rootRef: React.RefObject<HTMLDivElement>,
  fillRef: React.RefObject<SVGPathElement>,
  innerRef: React.RefObject<SVGPathElement>,
  dotRef: React.RefObject<SVGCircleElement>,
  textRef: React.RefObject<HTMLParagraphElement>,
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const tl = gsap.timeline()

    // Fade root in
    tl.to(root, { opacity: 1, duration: 0.3, ease: 'power2.out' })

    // Fill drip from bottom
    tl.to(fillRef.current, {
      scaleY:   1,
      duration: 1.6,
      ease:     'power2.inOut',
    }, '-=0.1')

    // Wordmark
    tl.to('.loader-wordmark', { opacity: 1, y: 0, duration: 0.4 }, '-=1.2')

    // Text
    tl.to(textRef.current, { opacity: 1, duration: 0.3 }, '-=0.8')

    // Dot trail stagger loop
    gsap.to(['.loader-dot-0', '.loader-dot-1', '.loader-dot-2'], {
      opacity:    1,
      scale:      1.4,
      stagger:    0.18,
      duration:   0.35,
      ease:       'power2.out',
      yoyo:       true,
      repeat:    -1,
      repeatDelay: 0.1,
      delay:      0.6,
    })

    // Inner drip pulse
    gsap.to(innerRef.current, {
      scale:       0.88,
      opacity:     0.5,
      duration:    1.1,
      ease:        'sine.inOut',
      yoyo:        true,
      repeat:     -1,
      transformOrigin: 'center 76px',
    })

    // Highlight dot drift
    gsap.to(dotRef.current, {
      opacity: 0.5,
      r:       5,
      duration: 1.8,
      ease:    'sine.inOut',
      yoyo:    true,
      repeat: -1,
    })

    return () => { tl.kill(); gsap.killTweensOf('*') }
  }, [])
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NAV PROGRESS BAR
//    Thin lime bar at the top — fires on every route transition.
//    Mount once inside the body of __root.tsx.
//
//    Usage in __root.tsx:
//      import { NavProgress } from '@/components/PageLoader'
//      // Inside RootDocument body, before <Outlet />:
//      <NavProgress />
// ─────────────────────────────────────────────────────────────────────────────
export function NavProgress() {
  const isLoading = useRouterState({ select: s => s.isLoading })
  const barRef    = useRef<HTMLDivElement>(null)
  const glowRef   = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const bar  = barRef.current
    const glow = glowRef.current
    if (!bar || !glow) return

    if (isLoading) {
      setVisible(true)
      // Reset then fill to ~85% — final 15% completes on load done
      gsap.set(bar,  { scaleX: 0, transformOrigin: 'left center' })
      gsap.set(glow, { opacity: 1 })
      gsap.to(bar, {
        scaleX:   0.85,
        duration: 8,       // slow crawl — snaps to 1 when done
        ease:     'power1.inOut',
      })
    } else {
      // Complete the bar then fade out
      gsap.to(bar, {
        scaleX:   1,
        duration: 0.25,
        ease:     'power2.out',
        onComplete: () => {
          gsap.to([bar, glow], {
            opacity:  0,
            duration: 0.3,
            delay:    0.1,
            onComplete: () => setVisible(false),
          })
        },
      })
    }
  }, [isLoading])

  if (!visible && !isLoading) return null

  return (
    <div style={{
      position: 'fixed',
      top:       0,
      left:      0,
      right:     0,
      height:    3,
      zIndex:    99999,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Track */}
      <div style={{
        position:   'absolute',
        inset:       0,
        background: `${LIME}15`,
      }}/>

      {/* Bar */}
      <div
        ref={barRef}
        style={{
          position:        'absolute',
          top:              0,
          left:             0,
          bottom:           0,
          width:           '100%',
          background:      `linear-gradient(90deg, ${LIME}, ${CORAL})`,
          transformOrigin: 'left center',
          transform:       'scaleX(0)',
          opacity:          1,
        }}
      />

      {/* Glow at the leading edge */}
      <div
        ref={glowRef}
        style={{
          position:   'absolute',
          top:        -4,
          right:       0,
          width:       60,
          height:      11,
          background: `radial-gradient(ellipse, ${LIME}CC 0%, transparent 70%)`,
          filter:     'blur(2px)',
          opacity:     0,
        }}
      />
    </div>
  )
}
